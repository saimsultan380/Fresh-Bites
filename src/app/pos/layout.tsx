'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { Loader2 } from 'lucide-react';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="pos-canvas flex min-h-dvh flex-col items-center justify-center gap-2">
        <Loader2 className="size-6 animate-spin text-orange-500" />
        <span className="text-sm font-medium text-stone-500">Opening register…</span>
      </div>
    );
  }

  if (profile && !profile.is_active) {
    return (
      <div className="pos-canvas flex min-h-dvh flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-semibold text-stone-800">This account is deactivated.</p>
        <p className="text-xs text-stone-500">Ask an admin to reactivate it before using the terminal.</p>
      </div>
    );
  }

  return <>{children}</>;
}
