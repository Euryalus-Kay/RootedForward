import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

// Use placeholder values during build/SSR when env vars aren't configured.
// The client will fail gracefully on actual requests (queries return errors
// that are caught by each consumer's try/catch).
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
