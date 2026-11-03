import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { isFileUrlInUse } from "@/lib/db/items";
import { getSessionUserId } from "@/lib/db/users";
import {
  getFileExtension,
  getStoredContentType,
  isUploadKind,
  validateUpload,
} from "@/lib/file-upload";
import { deleteObject, getKeyFromPublicUrl, getPublicUrl, putObject } from "@/lib/r2";
import type { DeleteUploadResponse, UploadResponse } from "@/types/uploads";

const NOT_SIGNED_IN = "You're not signed in. Please sign in again.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const MAX_FILE_NAME_LENGTH = 255;

function json<T extends UploadResponse | DeleteUploadResponse>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

// Stores a file for a not-yet-created file or image item. The proxy doesn't cover /api,
// so the session is checked here.
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return json({ success: false, error: NOT_SIGNED_IN }, 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ success: false, error: "Choose a file to upload" }, 400);
  }

  const kind = formData.get("kind");
  const file = formData.get("file");
  if (typeof kind !== "string" || !isUploadKind(kind) || !(file instanceof File)) {
    return json({ success: false, error: "Choose a file to upload" }, 400);
  }

  const invalid = validateUpload(kind, file);
  if (invalid) return json({ success: false, error: invalid }, 400);

  // The key never contains the user's file name; it's kept only for display and downloads.
  const key = `${userId}/${randomUUID()}${getFileExtension(file.name)}`;
  const contentType = getStoredContentType(kind, file.name);

  try {
    await putObject({
      key,
      body: new Uint8Array(await file.arrayBuffer()),
      contentType,
      // SVGs can carry scripts, so opening the public URL downloads them instead of rendering.
      contentDisposition: contentType === "image/svg+xml" ? "attachment" : undefined,
    });
  } catch (error) {
    console.error("Uploading to R2 failed", error);
    return json({ success: false, error: GENERIC_ERROR }, 500);
  }

  return json(
    {
      success: true,
      data: {
        fileUrl: getPublicUrl(key),
        fileName: file.name.slice(0, MAX_FILE_NAME_LENGTH),
        fileSize: file.size,
      },
    },
    201,
  );
}

// Removes an upload the user dropped before creating the item. Only the user's own
// objects can be removed, and never one an item still uses.
export async function DELETE(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return json({ success: false, error: NOT_SIGNED_IN }, 401);

  let fileUrl: unknown;
  try {
    ({ fileUrl } = await request.json());
  } catch {
    fileUrl = undefined;
  }

  const key = typeof fileUrl === "string" ? getKeyFromPublicUrl(fileUrl) : null;
  if (typeof fileUrl !== "string" || !key?.startsWith(`${userId}/`)) {
    return json({ success: false, error: "File not found" }, 404);
  }

  try {
    if (await isFileUrlInUse(userId, fileUrl)) {
      return json({ success: false, error: "This file belongs to an item" }, 409);
    }
    await deleteObject(key);
    return json({ success: true });
  } catch (error) {
    console.error("Deleting upload from R2 failed", error);
    return json({ success: false, error: GENERIC_ERROR }, 500);
  }
}
