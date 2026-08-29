import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET() {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) {
      return NextResponse.json({ success: false, error: gate.error }, { status: gate.status });
    }

    const { data: profiles, error } = await gate.admin
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, profiles });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load users';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) {
      return NextResponse.json({ success: false, error: gate.error }, { status: gate.status });
    }

    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const full_name = String(body.full_name || '').trim();
    const role = body.role === 'admin' ? 'admin' : 'cashier';
    const pin_code = String(body.pin_code || '1234').trim();
    const is_active = body.is_active !== false;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } = await gate.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (authError) throw authError;

    const { data: profile, error: profileError } = await gate.admin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name,
        role,
        pin_code,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      await gate.admin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
