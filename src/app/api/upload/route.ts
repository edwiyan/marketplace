import type { NextRequest } from "next/server";
import { IMAGE_TYPES, LIMITS } from "@/lib/listing";
import { json, notConfigured, rateLimited, tooMany } from "@/lib/server/http";
import { IMAGE_BUCKET, writeClient } from "@/lib/server/supabase";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

/** POST /api/upload — multipart form with a `file` field. Returns the photo's public URL. */
export async function POST(request: NextRequest) {
  if (rateLimited(request, "upload", 20, 10 * 60_000)) return tooMany();
  const db = writeClient();
  if (!db) return notConfigured();

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return json({ error: "Send the photo as multipart form data." }, 400);
  }
  if (!(file instanceof File) || file.size === 0) return json({ error: "Choose a photo." }, 400);
  if (!IMAGE_TYPES.includes(file.type)) return json({ error: "Use a JPG, PNG, WebP or GIF photo." }, 400);
  if (file.size > LIMITS.imageBytes) return json({ error: "Photos must be 5 MB or smaller." }, 413);

  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${EXT[file.type]}`;
  const { error } = await db.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) return json({ error: `Upload failed: ${error.message}` }, 500);

  const url = db.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  return json({ url }, 201);
}
