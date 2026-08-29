import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  try {
    const adminSupabase = createAdminClient();

    // 1. Seed Admin
    const adminEmail = 'admin@freshbites.com';
    const adminPassword = 'Password123!';
    const { data: existingAdminList } = await adminSupabase.auth.admin.listUsers();
    let adminUser = existingAdminList.users.find(u => u.email === adminEmail);

    if (!adminUser) {
      const { data: createdAdmin, error: adminErr } = await adminSupabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { full_name: 'Store Manager', role: 'admin' }
      });
      if (adminErr) throw adminErr;
      adminUser = createdAdmin.user;
    }

    if (adminUser) {
      await adminSupabase.from('profiles').upsert({
        id: adminUser.id,
        email: adminEmail,
        full_name: 'Store Manager',
        role: 'admin',
        pin_code: '1234',
        is_active: true,
      });
    }

    // 2. Seed Cashier
    const cashierEmail = 'cashier@freshbites.com';
    const cashierPassword = 'Password123!';
    let cashierUser = existingAdminList.users.find(u => u.email === cashierEmail);

    if (!cashierUser) {
      const { data: createdCashier, error: cashierErr } = await adminSupabase.auth.admin.createUser({
        email: cashierEmail,
        password: cashierPassword,
        email_confirm: true,
        user_metadata: { full_name: 'Counter Cashier 1', role: 'cashier' }
      });
      if (cashierErr) throw cashierErr;
      cashierUser = createdCashier.user;
    }

    if (cashierUser) {
      await adminSupabase.from('profiles').upsert({
        id: cashierUser.id,
        email: cashierEmail,
        full_name: 'Counter Cashier 1',
        role: 'cashier',
        pin_code: '5678',
        is_active: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Initial Admin and Cashier accounts verified & seeded',
      accounts: {
        admin: { email: adminEmail, role: 'admin', pin: '1234' },
        cashier: { email: cashierEmail, role: 'cashier', pin: '5678' }
      }
    });
  } catch (error: any) {
    console.error('Error seeding users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
