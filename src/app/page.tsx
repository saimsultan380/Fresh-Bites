'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, profile, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (isAdmin) {
        router.replace('/pos');
      } else {
        router.replace('/pos');
      }
    }
  }, [user, profile, loading, isAdmin, router]);

  return (
    <div className="pos-canvas flex min-h-dvh flex-col items-center justify-center gap-3">
      <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
        <Loader2 className="size-4 animate-spin text-orange-500" />
        <span>Initializing Fresh Bites POS Terminal...</span>
      </div>
    </div>
  );
}
