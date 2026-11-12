/** Upload rules shared by the browser (instant feedback) and the server (enforcement). */
import { UPLOADS } from "@/lib/config";

export const UPLOAD_KINDS = ["LOGO", "CAC_CERTIFICATE", "COMPANY_PROFILE"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export function rulesFor(kind: UploadKind) {
  return kind === "LOGO"
    ? { bucket: UPLOADS.logosBucket, maxBytes: UPLOADS.logoMaxBytes, mimeTypes: UPLOADS.logoMimeTypes as readonly string[], label: "PNG, JPG or WEBP, max 2 MB" }
    : { bucket: UPLOADS.documentsBucket, maxBytes: UPLOADS.maxBytes, mimeTypes: UPLOADS.documentMimeTypes as readonly string[], label: "PDF, JPG or PNG, max 5 MB" };
}

export function validateFileMeta(kind: UploadKind, file: { type: string; size: number }): string | null {
  const rules = rulesFor(kind);
  if (!rules.mimeTypes.includes(file.type)) return `Unsupported file type. Use ${rules.label}.`;
  if (file.size <= 0) return "The file is empty.";
  if (file.size > rules.maxBytes) return `File is too large. Use ${rules.label}.`;
  return null;
}

/** Check the first bytes match the claimed type (stops renamed executables etc.). */
export function sniffMime(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  )
    return "image/webp";
  return null;
}

export function extensionFor(mime: string): string {
  return { "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[mime] ?? "bin";
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
