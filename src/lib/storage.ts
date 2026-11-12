import type { SupabaseClient } from "@supabase/supabase-js";
import { UPLOADS } from "@/lib/config";

/**
 * Creates the storage buckets if missing. Size and MIME limits are enforced by
 * Supabase Storage itself, so oversized or wrong-type uploads are rejected
 * server-side even if a client bypasses our checks.
 * Safe to run repeatedly (seed, setup).
 */
export async function ensureStorageBuckets(supabase: SupabaseClient) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  const existing = new Set(buckets.map((b) => b.name));

  const wanted = [
    {
      name: UPLOADS.documentsBucket,
      options: { public: false, fileSizeLimit: UPLOADS.maxBytes, allowedMimeTypes: [...UPLOADS.documentMimeTypes] },
    },
    {
      name: UPLOADS.logosBucket,
      options: { public: true, fileSizeLimit: UPLOADS.logoMaxBytes, allowedMimeTypes: [...UPLOADS.logoMimeTypes] },
    },
  ];

  for (const b of wanted) {
    const result = existing.has(b.name)
      ? await supabase.storage.updateBucket(b.name, b.options)
      : await supabase.storage.createBucket(b.name, b.options);
    if (result.error) throw result.error;
  }
}

/** Public URL for a logo stored in the public logos bucket. */
export function logoPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${UPLOADS.logosBucket}/${path}`;
}
