import type { NextRequest } from "next/server";
import { validateMessage } from "@/lib/listing";
import { notifySeller } from "@/lib/server/email";
import { json, notConfigured, rateLimited, siteOrigin, tooMany } from "@/lib/server/http";
import { getListing } from "@/lib/server/listings";
import { writeClient } from "@/lib/server/supabase";

/**
 * POST /api/messages — save a buyer's message and email the seller.
 * There is deliberately no GET: messages hold buyers' emails, so they stay private.
 */
export async function POST(request: NextRequest) {
  if (rateLimited(request, "message", 10, 10 * 60_000)) return tooMany();
  const db = writeClient();
  if (!db) return notConfigured();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Send the message as JSON." }, 400);
  }
  if (typeof body.website === "string" && body.website) return json({ error: "Rejected." }, 400); // honeypot

  const result = validateMessage(body);
  if (!result.ok) return json({ error: "Please fix the highlighted fields.", fields: result.errors }, 400);

  const listing = await getListing(result.value.listing_id);
  if (!listing) return json({ error: "That listing no longer exists." }, 404);
  // seller_email is filled in by a database trigger from the listing itself.
  const { data, error } = await db
    .from("messages")
    .insert({ ...result.value, seller_email: listing.seller_email })
    .select("id, created_at")
    .single();
  if (error) return json({ error: `Couldn't send the message: ${error.message}` }, 500);

  const emailed = await notifySeller(listing, result.value.buyer_email, result.value.message, siteOrigin(request));
  return json({ message: { id: data.id, created_at: data.created_at }, emailed }, 201);
}
