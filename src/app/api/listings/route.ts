import type { NextRequest } from "next/server";
import { LISTING_COLUMNS, parseBound, parseSort, validateListing } from "@/lib/listing";
import { json, notConfigured, rateLimited, tooMany } from "@/lib/server/http";
import { getListings } from "@/lib/server/listings";
import { imageUrlPrefix, writeClient } from "@/lib/server/supabase";

/** GET /api/listings?category=electronics&q=bike&sort=price-asc&min=10&max=500 */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const { listings, error } = await getListings({
    category: p.get("category") ?? undefined,
    q: p.get("q") ?? undefined,
    sort: parseSort(p.get("sort")),
    min: parseBound(p.get("min") ?? undefined),
    max: parseBound(p.get("max") ?? undefined),
    limit: Number(p.get("limit")) || undefined,
  });
  if (error) return json({ error }, 500);
  return json({ listings });
}

/** POST /api/listings — create a listing. The photo must already be uploaded via /api/upload. */
export async function POST(request: NextRequest) {
  if (rateLimited(request, "listing", 10, 10 * 60_000)) return tooMany();
  const db = writeClient();
  if (!db) return notConfigured();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send the listing as JSON." }, 400);
  }
  if (typeof body.website === "string" && body.website) return json({ error: "Rejected." }, 400); // honeypot

  const result = validateListing(body, imageUrlPrefix());
  if (!result.ok) return json({ error: "Please fix the highlighted fields.", fields: result.errors }, 400);

  const row = { ...result.value } as Record<string, unknown>;
  if (row.location === null) delete row.location; // let the column default apply

  const { data, error } = await db.from("listings").insert(row).select(LISTING_COLUMNS).single();
  if (error) return json({ error: `Couldn't save the listing: ${error.message}` }, 500);
  return json({ listing: { ...data, price: Number(data.price) } }, 201);
}
