import type { UploadKind } from "@/lib/file-upload";
import type { UploadedFile, UploadResponse } from "@/types/uploads";

export const UPLOAD_FAILED = "Upload failed. Check your connection and try again.";

export interface UploadHandle {
  // Resolves with the stored file; rejects with the server's message, UPLOAD_FAILED, or an
  // AbortError after abort().
  promise: Promise<UploadedFile>;
  abort: () => void;
}

function parseUploadResponse(text: string): UploadResponse | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Sends a file to POST /api/upload. XMLHttpRequest rather than fetch, which can't report
// upload progress.
export function uploadFile(
  kind: UploadKind,
  file: File,
  { onProgress }: { onProgress?: (percent: number) => void } = {},
): UploadHandle {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<UploadedFile>((resolve, reject) => {
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      const body = parseUploadResponse(xhr.responseText);
      if (body?.success) resolve(body.data);
      else reject(new Error(body?.error ?? UPLOAD_FAILED));
    };
    xhr.onerror = () => reject(new Error(UPLOAD_FAILED));
    xhr.onabort = () => reject(new DOMException("Upload aborted", "AbortError"));
  });

  const formData = new FormData();
  formData.set("kind", kind);
  formData.set("file", file);
  xhr.open("POST", "/api/upload");
  xhr.send(formData);

  return { promise, abort: () => xhr.abort() };
}

// Best effort: removes an upload that won't become an item. keepalive lets it finish
// even when the dialog or page is closing.
export function discardUpload(fileUrl: string) {
  fetch("/api/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileUrl }),
    keepalive: true,
  }).catch(() => {});
}
