import { NextResponse } from "next/server";

import { getItemDetail } from "@/lib/db/items";
import { getSessionUserId } from "@/lib/db/users";

// Full item for the item drawer. The proxy doesn't cover /api, so the session is checked here.
export async function GET(_request: Request, ctx: RouteContext<"/api/items/[id]">) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "You're not signed in. Please sign in again." },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;

  try {
    const item = await getItemDetail(userId, id);
    if (!item) {
      return NextResponse.json(
        { success: false, error: "This item doesn't exist or was deleted." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Loading item failed", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
