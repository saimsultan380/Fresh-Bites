'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Authenticated successfully');
      router.replace('/pos');
    } catch (err: any) {
      console.error('Sign in error:', err);
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPass,
      });

      if (error) throw error;

      toast.success('Authenticated successfully');
      router.replace('/pos');
    } catch (err: any) {
      console.error('Sign in error:', err);
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 select-none bg-zinc-950">
      {/* Background Hotel & Order Desk Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
      />

      {/* Cinematic Dark Overlay with subtle backdrop blur */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/60 backdrop-blur-[2px]" />

      {/* Central Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
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

        {/* Credentials Form */}
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@freshbites.com"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900 focus:outline-none transition shadow-2xs"
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900 focus:outline-none transition shadow-2xs"
              />
            </div>
          </div>

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
                <span>Sign In To Register</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Buttons */}
        <div className="pt-4 border-t border-zinc-100 space-y-2.5">
          <div className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Quick Staff Sign-In Presets
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@freshbites.com', 'Password123!')}
              disabled={loading}
              className="p-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-left transition cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-900">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
                <span>Store Admin</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono mt-1">Full Access</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('cashier@freshbites.com', 'Password123!')}
              disabled={loading}
              className="p-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-left transition cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-900">
                <UserCheck className="w-3.5 h-3.5 text-zinc-700" />
                <span>Counter Cashier</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono mt-1">Register POS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
