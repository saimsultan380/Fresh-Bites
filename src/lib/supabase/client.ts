import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseAnonKey, getSupabaseUrl } from './config';

export function createClient() {
  const supabaseUrl = getSupabaseUrl() || 'https://placeholder.supabase.co';
  const supabaseKey = getSupabaseAnonKey() || 'placeholder-anon-key';

  return createBrowserClient(supabaseUrl, supabaseKey);
}
