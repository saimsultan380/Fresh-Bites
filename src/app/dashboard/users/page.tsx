'use client';

import React, { useState, useEffect } from 'react';
import { Profile, UserRole } from '@/types/pos';
import {
  Plus,
  Users,
  ShieldCheck,
  User,
  KeyRound,
  Edit2,
  Lock,
  Trash2,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [pinCode, setPinCode] = useState('1234');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
    } catch (err: any) {
      toast.error('Failed to load staff list: ' + err.message);
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
    setRole(p.role);
    setPinCode(p.pin_code || '1234');
    setIsActive(p.is_active);
    setIsModalOpen(true);
  };

  const openPasswordModal = (p: Profile) => {
    setTargetUser(p);
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Full Name and Email are required');
      return;
    }
    if (!editingProfile && !password.trim()) {
      toast.error('Password is required for new accounts');
      return;
    }
    if (pinCode.trim().length < 4) {
      toast.error('PIN code must be at least 4 digits');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProfile) {
        const payload: any = {
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

        toast.success(`Updated ${fullName.trim()} successfully`);
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password: password.trim(),
            full_name: fullName.trim(),
            role,
            pin_code: pinCode.trim(),
            is_active: isActive,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        toast.success(`Created staff account for ${fullName.trim()}`);
      }

      setIsModalOpen(false);
      loadProfiles();
    } catch (err: any) {
      toast.error('Failed to save staff account: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success(`Password updated for ${targetUser.full_name}`);
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      toast.error('Failed to update password: ' + err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleActive = async (p: Profile) => {
    try {
      const res = await fetch(`/api/users/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success(`Account for ${p.full_name} is now ${!p.is_active ? 'Active' : 'Disabled'}`);
      loadProfiles();
    } catch (err: any) {
      toast.error('Failed to toggle status: ' + err.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            Staff & User Management
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Manage staff accounts, assign terminal cashier roles, set authorization PINs, and update passwords.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadProfiles}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Staff</span>
          </button>
        </div>
      </div>

      {/* Staff Grid Cards */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-zinc-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-700" />
          <span className="text-xs font-medium">Loading database staff records...</span>
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl p-12 text-center space-y-3">
          <Users className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="font-bold text-sm text-zinc-700">No staff members found</p>
          <p className="text-xs text-zinc-400">Click &quot;Add New Staff&quot; to create cashier or manager credentials.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => {
            const isAdmin = p.role === 'admin';
            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl border p-5 space-y-4 shadow-2xs transition flex flex-col justify-between ${
                  p.is_active ? 'border-zinc-200 hover:border-zinc-300' : 'border-zinc-200 bg-zinc-50/50 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isAdmin ? 'bg-zinc-900 text-white' : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-zinc-900 truncate">
                          {p.full_name}
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-mono truncate">{p.email}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                        isAdmin
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-orange-50 text-orange-800 border-orange-200'
                      }`}
                    >
                      {isAdmin ? 'Store Admin' : 'Cashier'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Terminal PIN</span>
                      <span className="font-mono font-bold text-zinc-900 tracking-wider">
                        {p.pin_code || '••••'}
                      </span>
                    </div>

                    <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Status</span>
                      <span
                        className={`font-bold text-xs flex items-center gap-1 ${
                          p.is_active ? 'text-emerald-700' : 'text-zinc-500'
                        }`}
                      >
                        {p.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {p.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-1.5">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      title="Edit Staff Member"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openPasswordModal(p)}
                      className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      title="Change Password"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Password</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(p)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      p.is_active
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {p.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/65 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900 text-white">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-300" />
                <h2 className="font-bold text-xs uppercase tracking-wider">
                  {editingProfile ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700 uppercase tracking-wider">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ali Ahmed"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700 uppercase tracking-wider">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  disabled={Boolean(editingProfile)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ali@freshbites.com"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-500"
                />
              </div>

              {!editingProfile && (
                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-700 uppercase tracking-wider">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-700 uppercase tracking-wider">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  >
                    <option value="cashier">Counter Cashier</option>
                    <option value="admin">Store Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-700 uppercase tracking-wider">
                    Manager Override PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono font-bold text-center focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="userActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                <label htmlFor="userActiveCheck" className="text-xs font-semibold text-zinc-700 cursor-pointer">
                  Account is active (can log in to POS terminal)
                </label>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{editingProfile ? 'Update Staff' : 'Create Staff'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/65 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900 text-white">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-zinc-300" />
                <h2 className="font-bold text-xs uppercase tracking-wider">
                  Change Password
                </h2>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">User Account</span>
                <span className="font-bold text-zinc-900">{targetUser.full_name}</span>
                <span className="text-[11px] text-zinc-500 font-mono block">{targetUser.email}</span>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700 uppercase tracking-wider">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700 uppercase tracking-wider">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isChangingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
