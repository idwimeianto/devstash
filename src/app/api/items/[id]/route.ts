import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api-response";
import { getItemDetail } from "@/lib/db/items";
import { getSessionUserId } from "@/lib/db/users";
import { GENERIC_ERROR, NOT_SIGNED_IN } from "@/lib/messages";

// Full item for the item drawer. The proxy doesn't cover /api, so the session is checked here.
export async function GET(_request: Request, ctx: RouteContext<"/api/items/[id]">) {
  const userId = await getSessionUserId();
  if (!userId) return jsonError(NOT_SIGNED_IN, 401);

  const { id } = await ctx.params;

  try {
    const item = await getItemDetail(userId, id);
    if (!item) return jsonError("This item doesn't exist or was deleted.", 404);
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Loading item failed", error);
    return jsonError(GENERIC_ERROR, 500);
  }
}
