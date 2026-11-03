import { NextResponse } from "next/server";

import { getItemFile } from "@/lib/db/items";
import { getSessionUserId } from "@/lib/db/users";
import { getKeyFromPublicUrl, getObject } from "@/lib/r2";

function error(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// "report (v2).pdf" -> attachment; filename="report _v2_.pdf"; filename*=UTF-8''report%20(v2).pdf
function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\w.\- ]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

// Streams a file or image item's upload from R2 as a download, under the item's original
// file name. Going through the app avoids CORS on R2. The proxy doesn't cover /api, so the
// session is checked here.
export async function GET(_request: Request, ctx: RouteContext<"/api/items/[id]/download">) {
  const userId = await getSessionUserId();
  if (!userId) return error("You're not signed in. Please sign in again.", 401);

  const { id } = await ctx.params;

  try {
    const file = await getItemFile(userId, id);
    const key = file && getKeyFromPublicUrl(file.fileUrl);
    if (!file || !key) return error("This file doesn't exist or was deleted.", 404);

    const object = await getObject(key);
    if (!object.Body) return error("This file doesn't exist or was deleted.", 404);

    const headers = new Headers({
      "Content-Type": object.ContentType ?? "application/octet-stream",
      "Content-Disposition": contentDisposition(file.fileName ?? key.split("/")[1]),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    });
    if (object.ContentLength !== undefined) {
      headers.set("Content-Length", String(object.ContentLength));
    }
    return new Response(object.Body.transformToWebStream(), { headers });
  } catch (err) {
    if (err instanceof Error && err.name === "NoSuchKey") {
      return error("This file doesn't exist or was deleted.", 404);
    }
    console.error("Downloading file failed", err);
    return error("Something went wrong. Please try again.", 500);
  }
}
