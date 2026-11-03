import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/items/[id]/download/route";
import { getItemFile } from "@/lib/db/items";
import { getSessionUserId } from "@/lib/db/users";
import { getObject } from "@/lib/r2";

vi.mock("@/lib/db/items", () => ({ getItemFile: vi.fn() }));
vi.mock("@/lib/db/users", () => ({ getSessionUserId: vi.fn() }));
// Keep the real URL helpers; only the calls to R2 are faked.
vi.mock("@/lib/r2", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/r2")>()),
  getObject: vi.fn(),
}));

const USER_ID = "user_1";
const ITEM_ID = "item_1";
const PUBLIC_URL = "https://pub-test.r2.dev";

function download(id = ITEM_ID) {
  return GET(new Request(`http://localhost/api/items/${id}/download`), {
    params: Promise.resolve({ id }),
  });
}

function r2Object(text: string, contentType = "application/pdf") {
  return {
    ContentType: contentType,
    ContentLength: text.length,
    Body: { transformToWebStream: () => new Blob([text]).stream() },
  } as never;
}

beforeEach(() => {
  vi.stubEnv("R2_PUBLIC_URL", PUBLIC_URL);
  vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
  vi.mocked(getItemFile).mockResolvedValue({
    fileUrl: `${PUBLIC_URL}/${USER_ID}/abc-123.pdf`,
    fileName: "Spec (v2) ✓.pdf",
  });
  vi.mocked(getObject).mockResolvedValue(r2Object("%PDF-1.7"));
});

describe("GET /api/items/[id]/download", () => {
  it("streams the user's file as an attachment under its original name", async () => {
    const response = await download();

    expect(response.status).toBe(200);
    expect(getItemFile).toHaveBeenCalledWith(USER_ID, ITEM_ID);
    expect(getObject).toHaveBeenCalledWith(`${USER_ID}/abc-123.pdf`);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Length")).toBe("8");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Disposition")).toBe(
      `attachment; filename="Spec _v2_ _.pdf"; filename*=UTF-8''Spec%20(v2)%20%E2%9C%93.pdf`,
    );
    await expect(response.text()).resolves.toBe("%PDF-1.7");
  });

  it("returns 401 when signed out", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    expect((await download()).status).toBe(401);
    expect(getItemFile).not.toHaveBeenCalled();
  });

  it("returns 404 for another user's item, an item without a file or a foreign URL", async () => {
    vi.mocked(getItemFile).mockResolvedValue(null);
    expect((await download("someone_elses_item")).status).toBe(404);

    vi.mocked(getItemFile).mockResolvedValue({ fileUrl: "https://evil.example/x/y.pdf", fileName: "y.pdf" });
    expect((await download()).status).toBe(404);

    expect(getObject).not.toHaveBeenCalled();
  });

  it("returns 404 when the object is missing in R2", async () => {
    vi.mocked(getObject).mockRejectedValue(Object.assign(new Error("gone"), { name: "NoSuchKey" }));

    expect((await download()).status).toBe(404);
  });

  it("returns 500 when R2 fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getObject).mockRejectedValue(new Error("R2 down"));

    expect((await download()).status).toBe(500);
  });
});
