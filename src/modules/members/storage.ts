import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { UPLOADS } from "@/lib/config";
import { rulesFor, sniffMime, type UploadKind } from "@/lib/uploads";

type VerifiedUpload = { kind: UploadKind; path: string; fileName: string; mimeType: string; sizeBytes: number };

/**
 * Downloads an object uploaded via a signed URL and checks it server-side:
 * it must exist, be within the size limit, and its bytes must match an allowed type.
 */
export async function verifyUpload(kind: UploadKind, path: string, fileName: string): Promise<VerifiedUpload> {
  const rules = rulesFor(kind);
  const { data, error } = await createAdminClient().storage.from(rules.bucket).download(path);
  if (error || !data) throw new Error("An uploaded file could not be found. Please upload it again.");
  if (data.size > rules.maxBytes) throw new Error(`${fileName} is too large.`);
  const head = new Uint8Array(await data.slice(0, 16).arrayBuffer());
  const mime = sniffMime(head);
  if (!mime || !rules.mimeTypes.includes(mime)) throw new Error(`${fileName} is not a valid ${rules.label} file.`);
  return { kind, path, fileName, mimeType: mime, sizeBytes: data.size };
}

/** Move an object to its permanent location. Returns the new path. */
export async function moveObject(kind: UploadKind, from: string, to: string): Promise<string> {
  const { error } = await createAdminClient().storage.from(rulesFor(kind).bucket).move(from, to);
  if (error) throw new Error(`Could not store file: ${error.message}`);
  return to;
}

/** Short-lived signed URL for a private member document (admin review, member's own files). */
export async function signedDocumentUrl(path: string, expiresInSeconds = 300): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .storage.from(UPLOADS.documentsBucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) {
    console.error("[storage] signed url failed", error.message);
    return null;
  }
  return data.signedUrl;
}
