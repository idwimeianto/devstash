import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, POST } from "@/app/api/upload/route";
import { isFileUrlInUse } from "@/lib/db/items";
import { getSessionUserId } from "@/lib/db/users";
import { deleteObject, putObject } from "@/lib/r2";
import { checkUploadAllowed } from "@/lib/usage-checks";
import { PRO_FEATURE_REQUIRED } from "@/lib/usage-limits";

vi.mock("@/lib/db/items", () => ({ isFileUrlInUse: vi.fn() }));
// The plan rules themselves are covered in usage-checks.test.ts.
vi.mock("@/lib/usage-checks", () => ({ checkUploadAllowed: vi.fn() }));
vi.mock("@/lib/db/users", () => ({ getSessionUserId: vi.fn() }));
// Keep the real URL helpers; only the calls to R2 are faked.
vi.mock("@/lib/r2", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/r2")>()),
  putObject: vi.fn(),
  deleteObject: vi.fn(),
}));

const USER_ID = "user_1";
const PUBLIC_URL = "https://pub-test.r2.dev";

function upload(kind: string | null, file: File | null) {
  const formData = new FormData();
  if (kind) formData.set("kind", kind);
  if (file) formData.set("file", file);
  return POST(new Request("http://localhost/api/upload", { method: "POST", body: formData }));
}

function removeUpload(body: unknown) {
  return DELETE(
    new Request("http://localhost/api/upload", { method: "DELETE", body: JSON.stringify(body) }),
  );
}

beforeEach(() => {
  vi.stubEnv("R2_PUBLIC_URL", PUBLIC_URL);
  vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
  vi.mocked(isFileUrlInUse).mockResolvedValue(false);
  vi.mocked(checkUploadAllowed).mockResolvedValue(null);
});

describe("POST /api/upload", () => {
  it("stores an image under the user's prefix and returns its public URL", async () => {
    const response = await upload("image", new File(["png-bytes"], "My Photo.PNG", { type: "image/png" }));

    expect(response.status).toBe(201);
    expect(checkUploadAllowed).toHaveBeenCalledWith(USER_ID);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: { fileUrl: expect.any(String), fileName: "My Photo.PNG", fileSize: 9 },
    });
    expect(body.data.fileUrl).toMatch(new RegExp(`^${PUBLIC_URL}/${USER_ID}/[\\w-]+\\.png$`));

    const put = vi.mocked(putObject).mock.calls[0][0];
    expect(put.key).toMatch(new RegExp(`^${USER_ID}/[\\w-]+\\.png$`));
    expect(put.contentType).toBe("image/png");
    expect(put.contentDisposition).toBeUndefined();
  });

  it("returns 403 for a free user before reading the body", async () => {
    vi.mocked(checkUploadAllowed).mockResolvedValue(PRO_FEATURE_REQUIRED);
    const request = new Request("http://localhost/api/upload", { method: "POST", body: "x" });
    const formData = vi.spyOn(request, "formData");

    const response = await POST(request);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ success: false, error: PRO_FEATURE_REQUIRED });
    expect(formData).not.toHaveBeenCalled();
    expect(putObject).not.toHaveBeenCalled();
  });

  it("returns 500 when the plan check fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(checkUploadAllowed).mockRejectedValue(new Error("db down"));

    const response = await upload("image", new File(["png"], "a.png", { type: "image/png" }));

    expect(response.status).toBe(500);
    expect(putObject).not.toHaveBeenCalled();
  });

  it("stores SVGs as attachments", async () => {
    await upload("image", new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" }));

    expect(vi.mocked(putObject).mock.calls[0][0]).toMatchObject({
      contentType: "image/svg+xml",
      contentDisposition: "attachment",
    });
  });

  it("stores text files by extension when the browser reports no type", async () => {
    const response = await upload("file", new File(["# hi"], "README.md", { type: "" }));

    expect(response.status).toBe(201);
    expect(vi.mocked(putObject).mock.calls[0][0].contentType).toBe("text/markdown");
  });

  it("returns 413 for a body over the limit without reading it", async () => {
    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      headers: { "content-length": String(11 * 1024 * 1024) },
      body: "x",
    });
    const formData = vi.spyOn(request, "formData");

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ success: false, error: "This file is too large" });
    expect(formData).not.toHaveBeenCalled();
    expect(putObject).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    const response = await upload("file", new File(["x"], "a.txt", { type: "text/plain" }));

    expect(response.status).toBe(401);
    expect(putObject).not.toHaveBeenCalled();
  });

  it("returns 400 without a file or with an unknown kind", async () => {
    expect((await upload("file", null)).status).toBe(400);
    expect((await upload("snippet", new File(["x"], "a.txt"))).status).toBe(400);
    expect(putObject).not.toHaveBeenCalled();
  });

  it("returns 400 for a file the kind doesn't allow", async () => {
    const response = await upload("image", new File(["x"], "a.pdf", { type: "application/pdf" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: expect.stringMatching(/^Images must be one of/),
    });
    expect(putObject).not.toHaveBeenCalled();
  });

  it("returns 500 when R2 fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(putObject).mockRejectedValue(new Error("R2 down"));

    const response = await upload("file", new File(["x"], "a.txt", { type: "text/plain" }));

    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/upload", () => {
  const fileUrl = `${PUBLIC_URL}/${USER_ID}/abc-123.png`;

  it("deletes the user's unused upload", async () => {
    const response = await removeUpload({ fileUrl });

    expect(response.status).toBe(200);
    expect(isFileUrlInUse).toHaveBeenCalledWith(USER_ID, fileUrl);
    expect(deleteObject).toHaveBeenCalledWith(`${USER_ID}/abc-123.png`);
  });

  it("refuses another user's object and foreign URLs", async () => {
    expect((await removeUpload({ fileUrl: `${PUBLIC_URL}/user_2/abc.png` })).status).toBe(404);
    expect((await removeUpload({ fileUrl: "https://evil.example/user_1/abc.png" })).status).toBe(404);
    expect((await removeUpload({})).status).toBe(404);
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("refuses a file an item still uses", async () => {
    vi.mocked(isFileUrlInUse).mockResolvedValue(true);

    const response = await removeUpload({ fileUrl });

    expect(response.status).toBe(409);
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    expect((await removeUpload({ fileUrl })).status).toBe(401);
    expect(deleteObject).not.toHaveBeenCalled();
  });
});
