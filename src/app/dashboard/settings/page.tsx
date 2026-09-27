'use client';

import React, { useState, useEffect } from 'react';
import { PosService } from '@/lib/services/posService';
import { StoreSettings } from '@/types/pos';
import {
  Store,
  Printer,
  Shield,
  Save,
  Loader2,
  Usb,
  Scissors,
  Percent,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  connectThermalPrinter,
  disconnectThermalPrinter,
  hasWebSerial,
  isPrinterConnected,
  testPrintAndCut,
} from '@/lib/print/thermalPrinter';

export default function StoreSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [printerReady, setPrinterReady] = useState(false);
  const [printerBusy, setPrinterBusy] = useState(false);

  // Security / Password update
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await PosService.getStoreSettings();
      setSettings(data);
    } catch (err: any) {
      toast.error('Failed to load store settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success('Your admin login password has been updated in database');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('Failed to update password: ' + err.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  useEffect(() => {
    loadSettings();
    setPrinterReady(isPrinterConnected());
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      const saved = await PosService.updateStoreSettings({
        business_name: settings.business_name.trim(),
        tagline: settings.tagline?.trim(),
        address: settings.address.trim(),
        phone: settings.phone.trim(),
        currency: settings.currency.trim().toUpperCase(),
        receipt_footer: settings.receipt_footer.trim(),
        ntn: settings.ntn?.trim() || '',
        strn: settings.strn?.trim() || '',
        tax_percent: Number(settings.tax_percent) || 0,
        service_charge_percent: Number(settings.service_charge_percent) || 0,
        paper_width_mm: settings.paper_width_mm === 58 ? 58 : 80,
        auto_print: settings.auto_print,
        auto_cut: settings.auto_cut,
        cut_mode: settings.cut_mode,
        feed_lines_before_cut: Math.max(1, Math.min(6, Number(settings.feed_lines_before_cut) || 2)),
        print_copies: Math.max(1, Number(settings.print_copies) || 1),
        print_kitchen_copy: settings.print_kitchen_copy,
        open_cash_drawer: settings.open_cash_drawer,
        printer_connection: settings.printer_connection,
        printer_baud_rate: Number(settings.printer_baud_rate) || 9600,
        max_cashier_discount_percent: Number(settings.max_cashier_discount_percent) || 10,
        admin_pin: settings.admin_pin.trim() || '1234',
      });
      setSettings(saved);
      toast.success('Store settings and receipt layout updated successfully');
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-stone-500 flex flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-xs font-bold">Loading System Settings...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Store & POS Settings
        </h1>
        <p className="text-xs text-stone-500 font-medium mt-0.5">
          Configure business metadata, currency, thermal receipt layout, and security parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Business Profile */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Store className="w-4 h-4 text-orange-500" />
            <h2 className="font-bold text-sm text-stone-900">
              Business Identity & Location
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Store / Brand Name *
              </label>
              <input
                type="text"
                required
                value={settings.business_name}
                onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Store Tagline
              </label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                placeholder="e.g. Eat Fresh, Feel Fresh"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Official Phone Number
              </label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="e.g. +92 300 1234567"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Default Currency Code *
              </label>
              <input
                type="text"
                required
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })}
                placeholder="PKR"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Physical Shop Address
              </label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="e.g. Shop # 4, Food Court, Commercial Plaza"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">NTN</label>
              <input
                type="text"
                value={settings.ntn || ''}
                onChange={(e) => setSettings({ ...settings, ntn: e.target.value })}
                placeholder="National Tax Number"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">STRN</label>
              <input
                type="text"
                value={settings.strn || ''}
                onChange={(e) => setSettings({ ...settings, strn: e.target.value })}
                placeholder="Sales Tax Registration No."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Percent className="w-4 h-4 text-orange-500" />
            <h2 className="font-bold text-sm text-stone-900">GST &amp; service charge</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">GST / sales tax (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={settings.tax_percent}
                onChange={(e) => setSettings({ ...settings, tax_percent: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
              />
              <p className="text-[10px] text-stone-400 mt-1">Added on the discounted subtotal. Use 0 if prices already include tax. Punjab/Sindh restaurant GST is often 5% or 16% — set what your SRB/PRA registration uses.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Service charge (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={settings.service_charge_percent}
                onChange={(e) => setSettings({ ...settings, service_charge_percent: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Thermal printer */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Printer className="w-4 h-4 text-orange-500" />
            <h2 className="font-bold text-sm text-stone-900">Thermal printer (58/80mm)</h2>
          </div>

          <p className="text-[11px] text-stone-500">
            If you installed the Windows <span className="font-semibold text-stone-700">POS-80-Series</span> driver
            (with paper cutter / chopper), set connection to <span className="font-semibold text-stone-700">Browser print (Windows POS-80)</span>,
            then choose <span className="font-mono">POS-80-Series</span> in the print dialog. For direct USB ESC/POS
            (no Windows driver), use Chrome/Edge and Connect printer below.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={printerBusy || !hasWebSerial()}
              onClick={async () => {
                setPrinterBusy(true);
                try {
                  await connectThermalPrinter(settings.printer_baud_rate || 9600);
                  setPrinterReady(true);
                  toast.success('Thermal printer connected');
                } catch (err: any) {
                  toast.error(err.message || 'Could not connect printer');
                } finally {
                  setPrinterBusy(false);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              <Usb className="size-3.5" />
              {printerReady ? 'Reconnect printer' : 'Connect printer'}
            </button>
            <button
              type="button"
              disabled={printerBusy || !printerReady}
              onClick={async () => {
                setPrinterBusy(true);
                try {
                  await testPrintAndCut(settings);
                  toast.success(settings.auto_cut ? 'Test printed and paper cut' : 'Test printed');
                } catch (err: any) {
                  toast.error(err.message || 'Test print failed');
                } finally {
                  setPrinterBusy(false);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              <Scissors className="size-3.5" />
              Test print + cut
            </button>
            {printerReady && (
              <button
                type="button"
                onClick={async () => {
                  await disconnectThermalPrinter();
                  setPrinterReady(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-2 text-xs font-bold text-stone-700"
              >
                Disconnect
              </button>
            )}
            <span className={`self-center text-[11px] font-bold ${printerReady ? 'text-emerald-700' : 'text-stone-400'}`}>
              {hasWebSerial()
                ? printerReady
                  ? 'Printer ready'
                  : 'Not connected'
                : 'Use Chrome/Edge on Windows for USB printing'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Receipt footer</label>
            <input
              type="text"
              value={settings.receipt_footer || ''}
              onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
              placeholder="Shukriya! Please visit again."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Paper width</label>
              <select
                value={settings.paper_width_mm}
                onChange={(e) => setSettings({ ...settings, paper_width_mm: Number(e.target.value) === 58 ? 58 : 80 })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold"
              >
                <option value={80}>80mm (standard)</option>
                <option value={58}>58mm (compact)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Print path</label>
              <select
                value={settings.printer_connection}
                onChange={(e) =>
                  setSettings({ ...settings, printer_connection: e.target.value === 'browser' ? 'browser' : 'escpos' })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold"
              >
                <option value="escpos">USB ESC/POS (Web Serial)</option>
                <option value="browser">Browser print (Windows POS-80)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Baud rate</label>
              <select
                value={settings.printer_baud_rate}
                onChange={(e) => setSettings({ ...settings, printer_baud_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold"
              >
                <option value={9600}>9600 (most USB printers)</option>
                <option value={19200}>19200</option>
                <option value={38400}>38400</option>
                <option value={115200}>115200</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Cut type</label>
              <select
                value={settings.cut_mode}
                onChange={(e) => setSettings({ ...settings, cut_mode: e.target.value === 'full' ? 'full' : 'partial' })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold"
              >
                <option value="partial">Partial cut (recommended)</option>
                <option value="full">Full cut</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Feed lines before cut</label>
              <input
                type="number"
                min={1}
                max={12}
                value={settings.feed_lines_before_cut}
                onChange={(e) => setSettings({ ...settings, feed_lines_before_cut: Math.max(1, Math.min(6, parseInt(e.target.value, 10) || 2)) })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold"
              />
              <p className="mt-1 text-[10px] text-stone-400">Use 1–3 for short slips (recommended: 2)</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Customer copies</label>
              <input
                type="number"
                min={1}
                max={3}
                value={settings.print_copies}
                onChange={(e) => setSettings({ ...settings, print_copies: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              ['auto_print', 'Auto-print when a sale completes'],
              ['auto_cut', 'Auto-cut paper after print'],
              ['open_cash_drawer', 'Kick cash drawer on cash sales'],
              ['print_kitchen_copy', 'Also print a kitchen / token copy'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={Boolean((settings as any)[key])}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.checked } as StoreSettings)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Cashier Permissions & Security */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Shield className="w-4 h-4 text-orange-500" />
            <h2 className="font-bold text-sm text-stone-900">
              Cashier Guardrails & Authorization PIN
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Max Allowed Cashier Discount (%) *
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.max_cashier_discount_percent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_cashier_discount_percent: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Discounts greater than this percentage will require Admin PIN authorization at POS.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Master Admin Authorization PIN *
              </label>
              <div className="relative">
                <input
                  type={showAdminPin ? 'text' : 'password'}
                  maxLength={6}
                  value={settings.admin_pin || ''}
                  onChange={(e) => setSettings({ ...settings, admin_pin: e.target.value })}
                  placeholder="1234"
                  className="w-full px-3 py-2 pr-10 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold tracking-widest focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPin(!showAdminPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  title={showAdminPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Used to authorize manager overrides and void operations.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Settings...' : 'Save Store Settings'}</span>
          </button>
        </div>
      </form>

      {/* Admin Security / Change My Password */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
          <Lock className="w-4 h-4 text-zinc-700" />
          <div>
            <h2 className="font-bold text-sm text-zinc-900">
              Change My Login Password
            </h2>
            <p className="text-[11px] text-zinc-500 font-medium">
              Update the account password for your currently logged-in admin user in Supabase auth.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateMyPassword} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <label className="block font-bold text-zinc-700 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 pr-10 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-zinc-700 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 pr-10 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdatingPassword || !newPassword}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            {isUpdatingPassword ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>Update Account Password</span>
          </button>
        </form>
      </div>
    </div>
  );
}
