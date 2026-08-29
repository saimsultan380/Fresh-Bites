'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  FolderTree,
  Boxes,
  Percent,
  Receipt,
  BarChart3,
  Users,
  Settings,
  Monitor,
  LogOut,
  Loader2,
  Menu,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';

const NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Products & Prices', href: '/dashboard/products', icon: UtensilsCrossed },
  { label: 'Categories', href: '/dashboard/categories', icon: FolderTree },
  { label: 'Combo Deals', href: '/dashboard/deals', icon: Boxes },
  { label: 'Discounts', href: '/dashboard/discounts', icon: Percent },
  { label: 'Sales History', href: '/dashboard/sales', icon: Receipt },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Staff & Users', href: '/dashboard/users', icon: Users },
  { label: 'Store Settings', href: '/dashboard/settings', icon: Settings },
];

function BrandMark() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-bold tracking-tight text-white">Fresh Bites</h2>
        <span className="text-[10px] font-mono font-medium tracking-wider text-zinc-500 uppercase">
          Management
        </span>
      </div>
    </div>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex min-h-9 items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer',
              isActive
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            )}
          >
            <Icon className={cn('size-4 shrink-0', isActive ? 'text-white' : 'text-zinc-500')} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarPanel({
  pathname,
  userInitials,
  profileName,
  profileEmail,
  onNavigate,
  onChangePassword,
  onSignOut,
}: {
  pathname: string;
  userInitials: string;
  profileName: string;
  profileEmail: string;
  onNavigate: () => void;
  onChangePassword: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-zinc-950 text-white">
      <div className="flex items-center gap-2.5 border-b border-zinc-800 px-4 py-4">
        <BrandMark />
      </div>
      <div className="p-3">
        <Link
          href="/pos"
          onClick={onNavigate}
          className="flex min-h-9 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 hover:text-white cursor-pointer"
        >
          <Monitor className="size-3.5 text-zinc-400" />
          <span>Open Register</span>
        </Link>
      </div>
      <NavLinks pathname={pathname} onNavigate={onNavigate} />
      <div className="flex items-center justify-between border-t border-zinc-800 p-3">
        <div className="mr-1 flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-800 border border-zinc-700 font-mono text-[10px] font-bold text-zinc-300">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold leading-tight text-zinc-200">{profileName}</p>
            <p className="mt-0.5 truncate text-[10px] text-zinc-500 font-mono">{profileEmail}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={onChangePassword}
            className="cursor-pointer rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            title="Change Password"
          >
            <KeyRound className="size-3.5" />
          </button>
          <button
            onClick={onSignOut}
            className="cursor-pointer rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            title="Sign out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/pos');
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const userInitials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-white">
        <Loader2 className="size-6 animate-spin text-zinc-800" />
        <span className="text-sm font-medium text-zinc-500">Loading backoffice…</span>
      </div>
    );
  }

  const sidebarProps = {
    pathname,
    userInitials,
    profileName: profile?.full_name || 'Admin User',
    profileEmail: profile?.email || 'admin@store.com',
    onNavigate: () => setMobileOpen(false),
    onChangePassword: () => {
      setMobileOpen(false);
      setPasswordOpen(true);
    },
    onSignOut: () => signOut(),
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-white">
      <aside className="hidden w-60 shrink-0 flex-col bg-zinc-950 border-r border-zinc-800 text-white select-none lg:flex">
        <SidebarPanel {...sidebarProps} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[min(18rem,88vw)] gap-0 bg-zinc-950 p-0 text-white border-r border-zinc-800"
        >
          <SheetTitle className="sr-only">Backoffice navigation</SheetTitle>
          <div className="flex h-full flex-col">
            <SidebarPanel {...sidebarProps} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <header className="flex shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-3 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2.5 text-white lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <BrandMark />
          <Link
            href="/pos"
            className="ml-auto flex size-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 cursor-pointer"
            title="Open Register"
          >
            <Monitor className="size-4" />
          </Link>
        </header>

        <main className="bg-white min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}
