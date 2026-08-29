'use client';

import React, { useState, useEffect } from 'react';
import { Profile, UserRole } from '@/types/pos';
import { useAuth } from '@/lib/auth/authContext';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import {
  Plus,
  Edit2,
  Loader2,
  X,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selfPasswordOpen, setSelfPasswordOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('cashier');
  const [pinCode, setPinCode] = useState('1234');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles);
      } else {
        throw new Error(data.error);
      }
    } catch (err: unknown) {
      toast.error('Failed to load staff list: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const openAddModal = () => {
    setEditingProfile(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('cashier');
    setPinCode('1234');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Profile) => {
    setEditingProfile(p);
    setFullName(p.full_name);
    setEmail(p.email);
    setPassword('');
    setShowPassword(false);
    setRole(p.role);
    setPinCode(p.pin_code || '1234');
    setIsActive(p.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Full Name and Email are required');
      return;
    }
    if (!editingProfile && !password.trim()) {
      toast.error('Password is required for new accounts');
      return;
    }
    if (password.trim() && password.trim().length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProfile) {
        const payload: Record<string, unknown> = {
          full_name: fullName.trim(),
          role,
          pin_code: pinCode.trim(),
          is_active: isActive,
        };
        if (password.trim()) payload.password = password.trim();

        const res = await fetch(`/api/users/${editingProfile.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        toast.success(
          password.trim()
            ? `Updated ${fullName} and set new password`
            : `Updated staff user: ${fullName}`
        );
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim().toLowerCase(),
            password: password.trim(),
            role,
            pin_code: pinCode.trim(),
            is_active: isActive,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        toast.success(`Created ${role} account for ${fullName}`);
      }

      setIsModalOpen(false);
      loadProfiles();
    } catch (err: unknown) {
      toast.error('Error saving user: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (p: Profile) => {
    if (p.id === user?.id) {
      toast.error('You cannot deactivate your own account');
      return;
    }
    try {
      const res = await fetch(`/api/users/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`${p.full_name} is now ${!p.is_active ? 'Active' : 'Deactivated'}`);
      loadProfiles();
    } catch (err: unknown) {
      toast.error('Failed to update status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Staff & User Management
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Create staff accounts in the database, reset passwords, and control login access.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSelfPasswordOpen(true)}
            className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>My Password</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5">Staff Name</th>
                <th className="px-5 py-3.5">Email Address</th>
                <th className="px-5 py-3.5">System Role</th>
                <th className="px-5 py-3.5">PIN Code</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-stone-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                    Loading staff accounts...
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-stone-400">
                    No staff profiles found. Add your first staff member to enable login.
                  </td>
                </tr>
              ) : (
                profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition">
                    <td className="px-5 py-4 font-bold text-stone-900 text-sm">
                      {p.full_name}
                      {p.id === user?.id ? (
                        <span className="ml-2 text-[9px] font-bold uppercase text-orange-600">You</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-stone-600">{p.email}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          p.role === 'admin'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-stone-700">
                      {p.pin_code ? '••••' : '—'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase transition cursor-pointer ${
                          p.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                        }`}
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-stone-700 rounded-lg transition"
                        title="Edit user / reset password"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1a120e]/70 backdrop-blur-xs p-0 sm:items-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-stone-200 w-full max-w-md max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-orange-600 text-white">
              <h2 className="font-bold text-base tracking-tight">
                {editingProfile ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter Cashier 1"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  disabled={!!editingProfile}
                  placeholder="e.g. cashier1@yourstore.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {editingProfile
                    ? 'Reset Password (leave blank to keep current)'
                    : 'Account Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">System Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold text-stone-800 focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">PIN Code (4-digits)</label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="1234"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none text-center"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="user_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="size-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="user_active" className="text-xs font-bold text-stone-800 cursor-pointer">
                  Account is active and permitted to login
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingProfile ? 'Save User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ChangePasswordModal open={selfPasswordOpen} onClose={() => setSelfPasswordOpen(false)} />
    </div>
  );
}
