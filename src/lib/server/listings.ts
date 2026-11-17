import "server-only";
import { categoryBySlug } from "@/lib/categories";
import { LISTING_COLUMNS, cleanSearch, isUuid, type Listing, type Sort } from "@/lib/listing";
import { readClient } from "./supabase";

export type ListingFilters = {
  category?: string; // slug
  q?: string;
  sort?: Sort;
  min?: number | null;
  max?: number | null;
  limit?: number;
};

export type ListingsResult = { listings: Listing[]; error: string | null };

export async function getListings(filters: ListingFilters = {}): Promise<ListingsResult> {
  const db = readClient();
  if (!db) return { listings: [], error: "Supabase isn't configured." };

  let query = db.from("listings").select(LISTING_COLUMNS);

  const category = filters.category ? categoryBySlug(filters.category) : undefined;
  if (category) query = query.eq("category", category.name);

  const q = cleanSearch(filters.q);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`);

  if (filters.min != null) query = query.gte("price", filters.min);
  if (filters.max != null) query = query.lte("price", filters.max);

  if (filters.sort === "price-asc") query = query.order("price", { ascending: true });
  else if (filters.sort === "price-desc") query = query.order("price", { ascending: false });
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query.limit(Math.min(filters.limit ?? 60, 100));
  if (error) return { listings: [], error: error.message };
  return { listings: (data ?? []).map(toListing), error: null };
}

export async function getListing(id: string): Promise<Listing | null> {
  if (!isUuid(id)) return null;
  const db = readClient();
  if (!db) return null;
  const { data } = await db.from("listings").select(LISTING_COLUMNS).eq("id", id).maybeSingle();
  return data ? toListing(data) : null;
}

/** A few other listings in the same category, for the "More like this" row. */
export async function getRelated(listing: Listing, limit = 4): Promise<Listing[]> {
  const db = readClient();
  if (!db) return [];
  const { data } = await db
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("category", listing.category)
    .neq("id", listing.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(toListing);
}

// Postgres numeric comes back as a string in some drivers; normalise it.
function toListing(row: Record<string, unknown>): Listing {
  return { ...(row as Listing), price: Number(row.price) };
}
