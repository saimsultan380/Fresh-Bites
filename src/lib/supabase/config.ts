export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) return false;
  if (url.includes('placeholder.supabase.co')) return false;
  if (key === 'placeholder-anon-key') return false;

  return true;
}

export const SUPABASE_CONFIG_ERROR =
  'Backend is not configured. In Vercel, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy.';

export function formatAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (
    message === 'Failed to fetch' ||
    message.includes('NetworkError') ||
    message.toLowerCase().includes('fetch failed')
  ) {
    if (!isSupabaseConfigured()) {
      return SUPABASE_CONFIG_ERROR;
    }
    return 'Cannot reach the authentication server. Check your connection and try again.';
  }

  return message || 'Invalid email or password';
}
