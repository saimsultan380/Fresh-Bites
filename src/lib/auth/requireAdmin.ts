import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Profile } from '@/types/pos';

export async function requireAdmin(): Promise<
  | { ok: true; userId: string; profile: Profile; admin: ReturnType<typeof createAdminClient> }
  | { ok: false; status: number; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, status: 401, error: 'Sign in required' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { ok: false, status: 403, error: 'Staff profile not found' };
  }

  if (profile.role !== 'admin' || profile.is_active === false) {
    return { ok: false, status: 403, error: 'Admin access required' };
  }

  try {
    const admin = createAdminClient();
    return { ok: true, userId: user.id, profile: profile as Profile, admin };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Admin client unavailable';
    return { ok: false, status: 500, error: message };
  }
}
