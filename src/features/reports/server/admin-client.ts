import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export const LEGACY_BIRTH_DATE_FALLBACK = "1900-01-01";
export const ATTEMPT_WORK_IMAGES_BUCKET = "attempt-work-images";

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function createReportsAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase 서버 설정이 누락되었습니다.");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
