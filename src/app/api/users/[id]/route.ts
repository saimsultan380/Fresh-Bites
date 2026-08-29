import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { full_name, role, pin_code, is_active, password } = body;

    const admin = createAdminClient();

    if (password) {
      const { error: pwdErr } = await admin.auth.admin.updateUserById(id, { password });
      if (pwdErr) throw pwdErr;
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updates.full_name = full_name;
    if (role !== undefined) updates.role = role;
    if (pin_code !== undefined) updates.pin_code = pin_code;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data: profile, error } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = createAdminClient();

    // Soft-deactivate profile
    const { error: profileErr } = await admin
      .from('profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (profileErr) throw profileErr;

    return NextResponse.json({ success: true, message: 'User deactivated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
