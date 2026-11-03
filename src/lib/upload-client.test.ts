import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { discardUpload, UPLOAD_FAILED, uploadFile } from "@/lib/upload-client";

// Node has no XMLHttpRequest; this stands in for the browser's and records the last request.
class FakeXhr {
  static last: FakeXhr;
  upload: { onprogress: ((event: Partial<ProgressEvent>) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  responseText = "";
  method = "";
  url = "";
  body: FormData | null = null;

  constructor() {
    FakeXhr.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  send(body: FormData) {
    this.body = body;
  }
  abort() {
    this.onabort?.();
  }
  respond(body: unknown) {
    this.responseText = typeof body === "string" ? body : JSON.stringify(body);
    this.onload?.();
  }
}

const FILE = new File(["png"], "diagram.png", { type: "image/png" });
const STORED = { fileUrl: "https://pub-test.r2.dev/user_1/a.png", fileName: "diagram.png", fileSize: 3 };

beforeEach(() => {
  vi.stubGlobal("XMLHttpRequest", FakeXhr);
});

// The config resets env stubs only.
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uploadFile", () => {
  it("posts the kind and file and resolves with the stored file", async () => {
    const { promise } = uploadFile("image", FILE);
    const xhr = FakeXhr.last;

    expect(xhr.method).toBe("POST");
    expect(xhr.url).toBe("/api/upload");
    expect(xhr.body?.get("kind")).toBe("image");
    expect(xhr.body?.get("file")).toBeInstanceOf(File);

    xhr.respond({ success: true, data: STORED });
    await expect(promise).resolves.toEqual(STORED);
  });

  it("reports progress as a whole percentage", () => {
    const onProgress = vi.fn();
    uploadFile("image", FILE, { onProgress });

    FakeXhr.last.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 3 });
    FakeXhr.last.upload.onprogress?.({ lengthComputable: false, loaded: 2, total: 0 });

    expect(onProgress.mock.calls).toEqual([[33]]);
  });

  it("rejects with the server's error, or a generic one for an unreadable or failed response", async () => {
    const rejected = uploadFile("image", FILE).promise;
    FakeXhr.last.respond({ success: false, error: "Images can be at most 5.0 MB" });
    await expect(rejected).rejects.toThrow("Images can be at most 5.0 MB");

    const unreadable = uploadFile("image", FILE).promise;
    FakeXhr.last.respond("<html>Bad gateway</html>");
    await expect(unreadable).rejects.toThrow(UPLOAD_FAILED);

    const failed = uploadFile("image", FILE).promise;
    FakeXhr.last.onerror?.();
    await expect(failed).rejects.toThrow(UPLOAD_FAILED);
  });

  it("rejects with an AbortError when aborted", async () => {
    const { promise, abort } = uploadFile("image", FILE);
    abort();
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("discardUpload", () => {
  it("asks the server to delete the upload and ignores failures", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    discardUpload(STORED.fileUrl);

    expect(fetchMock).toHaveBeenCalledWith("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl: STORED.fileUrl }),
      keepalive: true,
    });
    // The rejection is swallowed, so nothing throws or goes unhandled.
    await Promise.resolve();
  });
});
