// Pure helpers shared by the API routes and the UI. No Supabase or React here.
import { CATEGORY_NAMES } from "./categories";

export type Listing = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  seller_email: string;
  image_url: string | null;
  location: string | null;
  created_at: string;
};

export const LISTING_COLUMNS =
  "id, title, description, price, category, seller_email, image_url, location, created_at";

export const LIMITS = {
  titleMin: 3,
  title: 100,
  description: 2000,
  location: 100,
  email: 254,
  message: 1000,
  maxPrice: 99_999_999.99, // decimal(10,2)
  imageBytes: 5 * 1024 * 1024,
};

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const SORTS = {
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
} as const;
export type Sort = keyof typeof SORTS;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isEmail(value: string): boolean {
  return value.length <= LIMITS.email && EMAIL.test(value);
}

export type FieldErrors = Partial<Record<string, string>>;
type Result<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

export type NewListing = {
  title: string;
  description: string | null;
  price: number;
  category: string;
  seller_email: string;
  image_url: string;
  location: string | null;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Parses "1,250.50", "$300" or 300 into a number with 2 decimals, or NaN. */
export function parsePrice(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value * 100) / 100 : NaN;
  const cleaned = str(value).replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return NaN;
  return Math.round(Number(cleaned) * 100) / 100;
}

/**
 * Validates a new listing. `imageUrlPrefix` is this project's public bucket URL, so a
 * listing can only point at a photo that was uploaded through /api/upload.
 */
export function validateListing(input: Record<string, unknown>, imageUrlPrefix: string): Result<NewListing> {
  const errors: FieldErrors = {};
  const title = str(input.title).replace(/\s+/g, " ");
  const description = str(input.description);
  const category = str(input.category);
  const email = str(input.seller_email).toLowerCase();
  const location = str(input.location).replace(/\s+/g, " ");
  const imageUrl = str(input.image_url);
  const price = parsePrice(input.price);

  if (!imageUrl) errors.image_url = "Add a photo.";
  else if (!imageUrl.startsWith(imageUrlPrefix)) errors.image_url = "Upload the photo again.";
  if (title.length < LIMITS.titleMin) errors.title = "Give it a title (at least 3 characters).";
  else if (title.length > LIMITS.title) errors.title = `Keep the title under ${LIMITS.title} characters.`;
  if (Number.isNaN(price)) errors.price = "Enter a price, e.g. 250 or 99.50.";
  else if (price < 0 || price > LIMITS.maxPrice) errors.price = "That price is out of range.";
  if (!CATEGORY_NAMES.includes(category)) errors.category = "Choose a category.";
  if (!isEmail(email)) errors.seller_email = "Enter a valid email so buyers can reach you.";
  if (description.length > LIMITS.description) errors.description = `Keep it under ${LIMITS.description} characters.`;
  if (location.length > LIMITS.location) errors.location = `Keep it under ${LIMITS.location} characters.`;

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title,
      description: description || null,
      price,
      category,
      seller_email: email,
      image_url: imageUrl,
      location: location || null,
    },
  };
}

export type NewMessage = { listing_id: string; buyer_email: string; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

export function validateMessage(input: Record<string, unknown>): Result<NewMessage> {
  const errors: FieldErrors = {};
  const listingId = str(input.listing_id);
  const email = str(input.buyer_email).toLowerCase();
  const message = str(input.message);
  if (!isUuid(listingId)) errors.listing_id = "Unknown listing.";
  if (!isEmail(email)) errors.buyer_email = "Enter your email so the seller can reply.";
  if (!message) errors.message = "Write a message.";
  else if (message.length > LIMITS.message) errors.message = `Keep it under ${LIMITS.message} characters.`;
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { listing_id: listingId, buyer_email: email, message } };
}

/**
 * Cleans a search query for a PostgREST `or(...ilike...)` filter: keeps letters, digits,
 * spaces and a few safe symbols, so commas, parentheses and wildcards can't change the filter.
 */
export function cleanSearch(q: unknown): string {
  return str(q)
    .replace(/[^\p{L}\p{N}\s'&.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export function parseSort(value: unknown): Sort {
  return typeof value === "string" && value in SORTS ? (value as Sort) : "newest";
}

/** Optional price bound from the URL, or null. */
export function parseBound(value: unknown): number | null {
  if (typeof value !== "string" || value === "") return null;
  const n = parsePrice(value);
  return Number.isNaN(n) ? null : n;
}

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

/** "$1,250", "$99.50", or "Free" for 0. */
export function formatPrice(price: number): string {
  if (price === 0) return "Free";
  const text = money.format(price);
  return text.endsWith(".00") ? text.slice(0, -3) : text;
}

/** "just now", "5 minutes ago", "3 days ago", or a date for anything older than 4 weeks. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const s = Math.max(0, Math.round((now - then) / 1000));
  const ago = (n: number, unit: string) => (n === 1 ? `1 ${unit} ago` : `${n} ${unit}s ago`);
  if (s < 60) return "just now";
  if (s < 3600) return ago(Math.floor(s / 60), "minute");
  if (s < 86400) return ago(Math.floor(s / 3600), "hour");
  if (s < 604800) return ago(Math.floor(s / 86400), "day");
  if (s < 4 * 604800) return ago(Math.floor(s / 604800), "week");
  return new Date(then).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
