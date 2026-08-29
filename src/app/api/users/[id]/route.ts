import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) {
      return NextResponse.json({ success: false, error: gate.error }, { status: gate.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { full_name, role, pin_code, is_active, password } = body;

    if (password) {
      if (String(password).length < 8) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }
      const { error: pwdErr } = await gate.admin.auth.admin.updateUserById(id, {
        password: String(password),
      });
      if (pwdErr) throw pwdErr;
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updates.full_name = String(full_name).trim();
    if (role !== undefined) updates.role = role === 'admin' ? 'admin' : 'cashier';
    if (pin_code !== undefined) updates.pin_code = String(pin_code).trim();
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const { data: profile, error } = await gate.admin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, profile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdmin();
    if (!gate.ok) {
      return NextResponse.json({ success: false, error: gate.error }, { status: gate.status });
    }

    const { id } = await params;

    if (id === gate.userId) {
      return NextResponse.json(
        { success: false, error: 'You cannot deactivate your own account' },
        { status: 400 }
      );
    }

    const { error: profileErr } = await gate.admin
      .from('profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (profileErr) throw profileErr;

    return NextResponse.json({ success: true, message: 'User deactivated' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to deactivate user';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
