import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    !url.includes('placeholder') &&
    !key.includes('placeholder')
  );
};

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || !isSupabaseConfigured()) {
    return null;
  }

  browserClient = createBrowserClient<Database>(url, key);
  return browserClient;
}

