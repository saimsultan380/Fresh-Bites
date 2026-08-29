'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/authContext';
import { StoreSettings } from '@/types/pos';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import {
  Clock,
  Search,
  History,
  Maximize,
  Minimize,
  LogOut,
  LayoutDashboard,
  KeyRound,
} from 'lucide-react';
import Link from 'next/link';

interface PosHeaderProps {
  settings: StoreSettings;
  onOpenRecentOrders: () => void;
  onFocusSearch: () => void;
}

export function PosHeader({ settings, onOpenRecentOrders, onFocusSearch }: PosHeaderProps) {
  const { profile, isAdmin, signOut } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-orange-700 bg-orange-600 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 text-white select-none sm:gap-3 sm:px-4 sm:pt-[max(0.625rem,env(safe-area-inset-top))] sm:pb-2.5">
      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="truncate text-sm font-bold tracking-tight">
              {settings.business_name || 'Fresh Bites'}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-orange-700/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
          <p className="hidden truncate text-[11px] text-orange-100 md:block">
            {settings.tagline || 'Eat Fresh, Feel Fresh'}
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-2 text-xs text-orange-50 xl:flex">
        <Clock className="size-3.5 text-orange-200" />
        <span>{dateStr}</span>
        <span className="text-orange-300">•</span>
        <span className="font-mono font-semibold">{timeStr}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <button
          onClick={onFocusSearch}
          className="flex size-9 cursor-pointer items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20 sm:size-auto sm:gap-2 sm:px-3 sm:py-1.5"
          title="Find item"
        >
          <Search className="size-4 sm:size-3.5" />
          <span className="hidden text-xs font-medium sm:inline">Find item</span>
          <kbd className="hidden rounded bg-black/15 px-1.5 py-0.5 font-mono text-[10px] text-orange-100 md:inline">
            Ctrl+K
          </kbd>
        </button>

        <button
          onClick={onOpenRecentOrders}
          className="flex size-9 cursor-pointer items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20 sm:size-auto sm:gap-1.5 sm:px-3 sm:py-1.5"
          title="History"
        >
          <History className="size-4 sm:size-3.5" />
          <span className="hidden text-xs font-medium sm:inline">History</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="hidden size-9 cursor-pointer items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20 sm:flex"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
        </button>

        {isAdmin && (
          <Link
            href="/dashboard"
            className="flex size-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20 sm:size-auto sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs sm:font-semibold"
            title="Backoffice"
          >
            <LayoutDashboard className="size-4 sm:size-3.5" />
            <span className="hidden sm:inline">Backoffice</span>
          </Link>
        )}

        <div className="flex items-center gap-1 border-l border-white/20 pl-1 sm:gap-2 sm:pl-2">
          <div className="hidden text-right lg:block">
            <div className="text-xs font-semibold">
              {profile?.full_name || 'Staff User'}
            </div>
            <div className="text-[10px] font-medium tracking-wide text-orange-100 uppercase">
              {profile?.role || 'Cashier'}
            </div>
          </div>
          <button
            onClick={() => setPasswordOpen(true)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg transition hover:bg-white/20"
            title="Change Password"
          >
            <KeyRound className="size-4" />
          </button>
          <button
            onClick={() => signOut()}
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg transition hover:bg-white/20"
            title="Sign Out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </header>
  );
}
