import type { NextRequest } from "next/server";
import { json } from "@/lib/server/http";
import { getListing } from "@/lib/server/listings";

/** GET /api/listings/:id */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/listings/[id]">) {
  const { id } = await ctx.params;
  const listing = await getListing(id);
  if (!listing) return json({ error: "Listing not found." }, 404);
  return json({ listing });
}
