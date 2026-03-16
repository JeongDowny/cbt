export function toSupabasePublicStorageUrl(bucketName: string, path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return path;
  }

  const normalized = path.replace(/^\/+/, "");
  return `${url}/storage/v1/object/public/${bucketName}/${normalized}`;
}
