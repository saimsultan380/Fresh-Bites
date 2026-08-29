'use client';

import React, { useState, useEffect } from 'react';
import { PosService } from '@/lib/services/posService';
import { Deal, Product, StoreSettings } from '@/types/pos';
import {
  Plus,
  Boxes,
  Edit2,
  Trash2,
  Loader2,
  X,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{ product_id: string; quantity: number }[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dls, prods, setts] = await Promise.all([
        PosService.getDeals(false),
        PosService.getProducts(false),
        PosService.getStoreSettings(),
      ]);
      setDeals(dls);
      setProducts(prods);
      setSettings(setts);
    } catch (err: any) {
      toast.error('Failed to load deals: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currency = settings?.currency || 'PKR';

  const openAddModal = () => {
    setEditingDeal(null);
    setName('');
    setDescription('');
    setPrice('');
    setIsActive(true);
    setSelectedItems([]);
    setIsModalOpen(true);
  };

  const openEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setName(deal.name);
    setDescription(deal.description || '');
    setPrice(deal.price.toString());
    setIsActive(deal.is_active);
    setSelectedItems(
      deal.deal_items?.map((di) => ({
        product_id: di.product_id,
        quantity: di.quantity,
      })) || []
    );
    setIsModalOpen(true);
  };

  const handleAddItemToDeal = (productId: string) => {
    if (!productId) return;
    const existing = selectedItems.find((i) => i.product_id === productId);
    if (existing) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems([...selectedItems, { product_id: productId, quantity: 1 }]);
    }
  };

  const handleUpdateItemQty = (productId: string, delta: number) => {
    setSelectedItems(
      selectedItems
        .map((i) => {
          if (i.product_id === productId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as { product_id: string; quantity: number }[]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Deal name is required');
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Please add at least one product item to this combo deal');
      return;
    }

    try {
      if (editingDeal) {
        await PosService.updateDeal(editingDeal.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          price: priceNum,
          is_active: isActive,
          items: selectedItems,
        });
        toast.success(`Updated deal: ${name}`);
      } else {
        await PosService.createDeal({
          name: name.trim(),
          description: description.trim() || undefined,
          price: priceNum,
          is_active: isActive,
          items: selectedItems,
        });
        toast.success(`Created combo deal: ${name}`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Error saving deal: ' + err.message);
    }
  };

  const handleToggleActive = async (deal: Deal) => {
    try {
      await PosService.updateDeal(deal.id, { is_active: !deal.is_active });
      toast.success(`${deal.name} is now ${!deal.is_active ? 'Active' : 'Inactive'}`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async (deal: Deal) => {
    if (confirm(`Delete combo deal "${deal.name}"?`)) {
      try {
        await PosService.deleteDeal(deal.id);
        toast.success(`Deleted ${deal.name}`);
        loadData();
      } catch (err: any) {
        toast.error('Failed to delete deal: ' + err.message);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Combo Deals Management
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Create bundled promotions combining burgers, chicken, sides, and drinks at special discounted pricing.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Combo Deal</span>
        </button>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-stone-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
            Loading combo deals...
          </div>
        ) : deals.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-400 bg-white rounded-xl border border-stone-200">
            No combo deals created yet. Click "Create Combo Deal" to set up your first bundle.
          </div>
        ) : (
          deals.map((deal) => (
            <div
              key={deal.id}
              className="flex flex-col justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-violet-100 px-2 py-0.5 text-[9px] font-bold tracking-wider text-violet-800 uppercase">
                      Combo
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(deal)}
                      className={`cursor-pointer rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        deal.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {deal.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(deal)}
                      className="p-1.5 bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-stone-600 rounded-lg transition"
                      title="Edit Deal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(deal)}
                      className="p-1.5 bg-stone-100 hover:bg-rose-100 hover:text-rose-700 text-stone-600 rounded-lg transition"
                      title="Delete Deal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-stone-900 text-base mt-2">
                  {deal.name}
                </h3>
                {deal.description && (
                  <p className="text-xs text-stone-500 mt-1 leading-normal">
                    {deal.description}
                  </p>
                )}

                {/* Included Items Pill List */}
                <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col gap-1.5">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Included Items:
                  </div>
                  <div className="flex flex-col gap-1">
                    {deal.deal_items?.map((item) => (
                      <div
                        key={item.id}
                        className="text-xs text-stone-700 font-semibold flex items-center justify-between bg-stone-50 px-2 py-1 rounded-md"
                      >
                        <span>{item.product?.name || 'Product'}</span>
                        <span className="font-mono text-orange-700 font-bold">
                          {item.quantity}×
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-baseline justify-between">
                <span className="text-xs font-bold text-stone-500">Combo Price:</span>
                <span className="font-mono font-bold text-xl text-stone-950">
                  <span className="text-xs text-stone-500 mr-1">{currency}</span>
                  {deal.price.toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1a120e]/70 backdrop-blur-xs p-0 sm:items-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-orange-600 text-white">
              <h2 className="font-bold text-base tracking-tight">
                {editingDeal ? 'Edit Combo Deal' : 'Create New Combo Deal'}
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
                  Deal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deal 1: Zinger Duo Combo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Fixed Combo Price ({currency}) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  placeholder="e.g. 490"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Description / Marketing Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1 × Zinger Burger, 1 × Drumstick, 1 × Buddy Drink"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                />
              </div>

              {/* Item Builder */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Bundled Products in this Combo *
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    id="deal_product_select"
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddItemToDeal(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">+ Add a product to combo...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({currency} {p.price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Items List */}
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  {selectedItems.length === 0 ? (
                    <p className="text-center text-xs text-stone-400 py-3">
                      No products added yet. Select a product above.
                    </p>
                  ) : (
                    selectedItems.map((item) => {
                      const prod = products.find((p) => p.id === item.product_id);
                      return (
                        <div
                          key={item.product_id}
                          className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-stone-200 text-xs"
                        >
                          <span className="font-bold text-stone-800">
                            {prod?.name || 'Product'}
                          </span>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-stone-100 rounded px-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(item.product_id, -1)}
                                className="text-stone-600 hover:text-stone-900 font-bold p-0.5"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold px-1">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(item.product_id, 1)}
                                className="text-stone-600 hover:text-stone-900 font-bold p-0.5"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="deal_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="size-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="deal_active" className="text-xs font-bold text-stone-800 cursor-pointer">
                  Combo Deal is active and visible on POS Terminal
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
                  {editingDeal ? 'Save Changes' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
