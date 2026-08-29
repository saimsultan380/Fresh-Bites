'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  formatAuthError,
  isSupabaseConfigured,
  SUPABASE_CONFIG_ERROR,
} from '@/lib/supabase/config';
import {
  clearRememberedEmail,
  loadRememberedEmail,
  saveRememberedEmail,
} from '@/lib/auth/savedLogin';
import {
  Lock,
  Mail,
  Loader2,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '@/types/pos';

interface StaffDirectoryItem {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [staff, setStaff] = useState<StaffDirectoryItem[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    const remembered = loadRememberedEmail();
    if (remembered) {
      setEmail(remembered);
      setRememberEmail(true);
    }
  }, []);

  useEffect(() => {
    if (!supabaseReady) {
      setStaffLoading(false);
      return;
    }

    let cancelled = false;

    const loadStaff = async () => {
      setStaffLoading(true);
      try {
        const client = createClient();
        const { data, error } = await client
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('is_active', true)
          .order('full_name', { ascending: true });

        if (error) throw error;
        if (!cancelled) setStaff((data || []) as StaffDirectoryItem[]);
      } catch (err) {
        console.error('Failed to load staff directory:', err);
        if (!cancelled) setStaff([]);
      } finally {
        if (!cancelled) setStaffLoading(false);
      }
    };

    void loadStaff();
    return () => {
      cancelled = true;
    };
  }, [supabaseReady]);

  const redirectAfterLogin = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', userId)
      .single();

    if (profile?.is_active === false) {
      await supabase.auth.signOut();
      throw new Error('This staff account has been deactivated.');
    }

    if (profile?.role === 'admin') {
      router.replace('/dashboard');
      return;
    }

    router.replace('/pos');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    if (!supabaseReady) {
      toast.error(SUPABASE_CONFIG_ERROR);
      return;
    }

    setLoading(true);
    try {
      const loginEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed. Please try again.');

      if (rememberEmail) {
        saveRememberedEmail(loginEmail);
      } else {
        clearRememberedEmail();
      }

      toast.success('Authenticated successfully');
      await redirectAfterLogin(data.user.id);
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      toast.error(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const selectStaff = (member: StaffDirectoryItem) => {
    setSelectedId(member.id);
    setEmail(member.email);
    setPassword('');
    toast.message(`Selected ${member.full_name}`, {
      description: 'Enter password and sign in.',
    });
    passwordRef.current?.focus();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 select-none bg-zinc-950">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/60 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Cloud POS Terminal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            Fresh Bites
          </h1>
          <p className="text-xs text-zinc-500 font-medium">
            Fast Food & Restaurant Management System
          </p>
        </div>

        {!supabaseReady && (
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              Supabase is not configured for this deployment. Add{' '}
              <span className="font-mono font-semibold">NEXT_PUBLIC_SUPABASE_URL</span> and{' '}
              <span className="font-mono font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> in
              Vercel, then redeploy.
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Staff Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedId(null);
                }}
                placeholder="staff@yourstore.com"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            />
            <span className="text-[11px] leading-relaxed text-zinc-600">
              Remember email on this device
              <span className="block text-zinc-400">Password is never saved. Enter it each time.</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 active:bg-zinc-900 disabled:bg-zinc-400 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-100 space-y-2.5">
          <div className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Active Staff (from database)
          </div>

          {staffLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading staff…
            </div>
          ) : staff.length === 0 ? (
            <p className="text-center text-[11px] text-zinc-400 py-2">
              No active staff found. Ask an admin to add users in Backoffice → Staff & Users.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-0.5 sm:grid-cols-2">
              {staff.map((member) => {
                const Icon = member.role === 'admin' ? ShieldCheck : UserCheck;
                const isSelected = selectedId === member.id || email.toLowerCase() === member.email.toLowerCase();
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => selectStaff(member)}
                    disabled={loading}
                    className={`p-2.5 border rounded-xl text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-100 border-zinc-400'
                        : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-900">
                      <Icon className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                      <span className="truncate">{member.full_name}</span>
                    </div>
                    <span className="block text-[9px] text-zinc-500 mt-1 truncate">{member.email}</span>
                    <span className="text-[9px] font-bold uppercase text-zinc-400">{member.role}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
