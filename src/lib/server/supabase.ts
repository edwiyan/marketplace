import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const IMAGE_BUCKET = "listing-images";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

const options = { auth: { persistSession: false, autoRefreshToken: false } };

/** Read-only client (publishable/anon key, limited by Row Level Security). */
export function readClient(): SupabaseClient | null {
  return url && anonKey ? createClient(url, anonKey, options) : null;
}

/** Write client (secret key). Only used by API routes after validating input. */
export function writeClient(): SupabaseClient | null {
  return url && secretKey ? createClient(url, secretKey, options) : null;
}

/** Public URL prefix for photos in our bucket; listings may only point here. */
export function imageUrlPrefix(): string {
  return `${url ?? ""}/storage/v1/object/public/${IMAGE_BUCKET}/`;
}

export const missingConfig = !url || !anonKey;
