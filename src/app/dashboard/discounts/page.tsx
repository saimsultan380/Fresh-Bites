'use client';

import React, { useState, useEffect } from 'react';
import { PosService } from '@/lib/services/posService';
import { Discount, DiscountType, StoreSettings } from '@/types/pos';
import {
  Plus,
  Percent,
  Tag,
  Edit2,
  Trash2,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<DiscountType>('percentage');
  const [value, setValue] = useState('');
  const [isActive, setIsActive] = useState(true);

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const [discs, setts] = await Promise.all([
        PosService.getDiscounts(false),
        PosService.getStoreSettings(),
      ]);
      setDiscounts(discs);
      setSettings(setts);
    } catch (err: any) {
      toast.error('Failed to load discounts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const currency = settings?.currency || 'PKR';

  const openAddModal = () => {
    setEditingDiscount(null);
    setName('');
    setType('percentage');
    setValue('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (d: Discount) => {
    setEditingDiscount(d);
    setName(d.name);
    setType(d.type);
    setValue(d.value.toString());
    setIsActive(d.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Discount name is required');
      return;
    }
    const valNum = parseFloat(value);
    if (isNaN(valNum) || valNum <= 0) {
      toast.error('Please enter a valid discount value');
      return;
    }
    if (type === 'percentage' && valNum > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    try {
      if (editingDiscount) {
        await PosService.updateDiscount(editingDiscount.id, {
          name: name.trim(),
          type,
          value: valNum,
          is_active: isActive,
        });
        toast.success(`Updated discount: ${name}`);
      } else {
        await PosService.createDiscount({
          name: name.trim(),
          type,
          value: valNum,
          is_active: isActive,
        });
        toast.success(`Created discount: ${name}`);
      }

      setIsModalOpen(false);
      loadDiscounts();
    } catch (err: any) {
      toast.error('Failed to save discount: ' + err.message);
    }
  };

  const handleDelete = async (d: Discount) => {
    if (confirm(`Delete discount "${d.name}"?`)) {
      try {
        await PosService.deleteDiscount(d.id);
        toast.success(`Deleted ${d.name}`);
        loadDiscounts();
      } catch (err: any) {
        toast.error('Failed to delete discount: ' + err.message);
      }
    }
  };

  const handleToggleActive = async (d: Discount) => {
    try {
      await PosService.updateDiscount(d.id, { is_active: !d.is_active });
      toast.success(`${d.name} is now ${!d.is_active ? 'Active' : 'Inactive'}`);
      loadDiscounts();
    } catch (err: any) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Discount Promotions
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Manage percentage and fixed-amount counter discounts available to cashier staff.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Discount Rule</span>
        </button>
      </div>

      {/* Discounts Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5">Discount Name</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Deduction Value</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-stone-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                    Loading discounts...
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-stone-400">
                    No discount rules found. Click "Add Discount Rule" to set up promotions.
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-stone-50 transition">
                    <td className="px-5 py-4 font-bold text-stone-900 text-sm">
                      {d.name}
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-stone-100 text-stone-700 font-bold text-[11px] px-2.5 py-1 rounded-md border border-stone-200 uppercase">
                        {d.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-emerald-800 text-sm">
                      {d.type === 'percentage'
                        ? `${d.value}% OFF`
                        : `${currency} ${d.value.toLocaleString()} FLAT OFF`}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(d)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase transition cursor-pointer ${
                          d.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                        }`}
                      >
                        {d.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(d)}
                          className="p-1.5 bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-stone-700 rounded-lg transition"
                          title="Edit Discount"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          className="p-1.5 bg-stone-100 hover:bg-rose-100 hover:text-rose-700 text-stone-700 rounded-lg transition"
                          title="Delete Discount"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1a120e]/70 backdrop-blur-xs p-0 sm:items-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-stone-200 w-full max-w-md max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-orange-600 text-white">
              <h2 className="font-bold text-base tracking-tight">
                {editingDiscount ? 'Edit Discount Rule' : 'Create Discount Rule'}
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
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Discount Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10% Counter Discount"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Discount Type *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType('percentage')}
                    className={`flex-1 py-2 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      type === 'percentage'
                        ? 'bg-orange-600 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('fixed')}
                    className={`flex-1 py-2 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      type === 'fixed'
                        ? 'bg-orange-600 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Fixed Amount ({currency})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {type === 'percentage' ? 'Percentage Off (%) *' : `Fixed Amount Off (${currency}) *`}
                </label>
                <input
                  type="number"
                  required
                  min={0.1}
                  max={type === 'percentage' ? 100 : undefined}
                  step="any"
                  placeholder={type === 'percentage' ? 'e.g. 10' : 'e.g. 100'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="disc_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="size-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="disc_active" className="text-xs font-bold text-stone-800 cursor-pointer">
                  Discount rule is active and available at checkout
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg transition shadow-xs"
                >
                  {editingDiscount ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
