import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, profiles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, role, pin_code } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (email, password, full_name)' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: role || 'cashier' },
    });

    if (authError) throw authError;

    // Create profile
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role: role || 'cashier',
        pin_code: pin_code || '1234',
        is_active: body.is_active !== false,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
