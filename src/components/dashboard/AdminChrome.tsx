'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn('mx-auto flex w-full flex-col gap-6 p-4 sm:p-6', wide ? 'max-w-7xl' : 'max-w-5xl')}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">{title}</h1>
        <p className="mt-0.5 text-xs font-medium text-stone-500">{description}</p>
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-stone-200 bg-white', className)}>
      {children}
    </div>
  );
}

export const fieldClass =
  'w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-base font-medium outline-none transition focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 sm:py-2 sm:text-sm';

export const primaryBtnClass =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-orange-500 disabled:opacity-50';

export const secondaryBtnClass =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-stone-100 px-4 py-2.5 text-xs font-bold text-stone-700 transition hover:bg-stone-200 disabled:opacity-50';

export const iconBtnClass =
  'cursor-pointer rounded-lg bg-stone-100 p-1.5 text-stone-700 transition hover:bg-orange-50 hover:text-orange-700';

export function AdminModal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1a120e]/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={cn(
          'flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150 sm:rounded-2xl',
          wide ? 'max-w-lg' : 'max-w-md'
        )}
      >
        <div className="flex shrink-0 items-center justify-between bg-orange-600 px-5 py-3 text-white">
          <h2 className="text-sm font-bold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function StatusPill({
  active,
  onClick,
}: {
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-2.5 py-1 text-[10px] font-bold uppercase transition',
        onClick && 'cursor-pointer',
        active
          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </button>
  );
}
