'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update password');
      toast.success('Password changed successfully');
      handleClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#1a120e]/70 backdrop-blur-xs p-0 sm:items-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-stone-200 w-full max-w-md max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 bg-zinc-950 text-white">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <h2 className="font-bold text-sm tracking-tight">Change Password</h2>
          </div>
          <button type="button" onClick={handleClose} className="p-1 rounded-md text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            autoComplete="new-password"
          />
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Confirm new password</label>
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-stone-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full px-3 py-2.5 pr-10 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 focus:outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
