'use client';

import React, { useState, useEffect } from 'react';
import { PosService } from '@/lib/services/posService';
import { Product, Category, ProductPriceHistory, StoreSettings } from '@/types/pos';
import { useAuth } from '@/lib/auth/authContext';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  History,
  Check,
  X,
  Loader2,
  DollarSign,
  UtensilsCrossed,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsPage() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '',
    is_active: true,
  });

  // Inline Quick Price Edit
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPriceVal, setNewPriceVal] = useState('');

  // Price History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyProductName, setHistoryProductName] = useState('');
  const [priceHistory, setPriceHistory] = useState<ProductPriceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats, setts] = await Promise.all([
        PosService.getProducts(false),
        PosService.getCategories(false),
        PosService.getStoreSettings(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSettings(setts);
    } catch (err: any) {
      toast.error('Failed to load products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currency = settings?.currency || 'PKR';

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      if (editingProduct) {
        await PosService.updateProduct(
          editingProduct.id,
          {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            category_id: formData.category_id || null,
            price: priceNum,
            is_active: formData.is_active,
          },
          profile?.id
        );
        toast.success(`Updated ${formData.name}`);
      } else {
        await PosService.createProduct({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category_id: formData.category_id || null,
          price: priceNum,
          is_active: formData.is_active,
        });
        toast.success(`Created product ${formData.name}`);
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      toast.error('Error saving product: ' + err.message);
    }
  };

  // Quick Price Save
  const handleSaveInlinePrice = async (product: Product) => {
    const priceNum = parseFloat(newPriceVal);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Invalid price');
      return;
    }

    try {
      await PosService.updateProduct(
        product.id,
        { price: priceNum },
        profile?.id
      );
      toast.success(`Updated price for ${product.name} to ${currency} ${priceNum.toLocaleString()}`);
      setEditingPriceId(null);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update price: ' + err.message);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (product: Product) => {
    try {
      await PosService.updateProduct(product.id, { is_active: !product.is_active });
      toast.success(`${product.name} is now ${!product.is_active ? 'Active' : 'Inactive'}`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Are you sure you want to permanently delete "${product.name}"?`)) {
      try {
        await PosService.deleteProduct(product.id);
        toast.success(`Deleted ${product.name}`);
        loadData();
      } catch (err: any) {
        toast.error('Failed to delete product: ' + err.message);
      }
    }
  };

  // Open Price History
  const handleOpenPriceHistory = async (product: Product) => {
    setHistoryProductName(product.name);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const history = await PosService.getProductPriceHistory(product.id);
      setPriceHistory(history);
    } catch (err: any) {
      toast.error('Failed to load price history: ' + err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category_id: categories[0]?.id || '',
      price: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      price: product.price.toString(),
      is_active: product.is_active,
    });
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    return p.category_id === selectedCategory;
  });

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Products & Price Management
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Configure menu items, update counter pricing, and review price revision history.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
          />
        </div>

        <div className="flex min-w-0 items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="min-w-0 flex-1 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 sm:flex-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5">Product Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Price ({currency})</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-stone-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-stone-400">
                    No products found. Click "Add New Product" to create one.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50 transition">
                    {/* Product Name & Description */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-stone-900 text-sm">
                        {product.name}
                      </div>
                      {product.description && (
                        <p className="text-[11px] text-stone-500 line-clamp-1 max-w-sm mt-0.5">
                          {product.description}
                        </p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4">
                      <span className="bg-stone-100 text-stone-700 font-bold text-[11px] px-2.5 py-1 rounded-md border border-stone-200">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Price with Quick Inline Edit */}
                    <td className="px-5 py-4">
                      {editingPriceId === product.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={newPriceVal}
                            onChange={(e) => setNewPriceVal(e.target.value)}
                            className="w-24 px-2 py-1 bg-white border border-orange-400 rounded text-xs font-mono font-bold focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlinePrice(product);
                              if (e.key === 'Escape') setEditingPriceId(null);
                            }}
                          />
                          <button
                            onClick={() => handleSaveInlinePrice(product)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="p-1 bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-950 text-sm">
                            {currency} {product.price.toLocaleString()}
                          </span>
                          <button
                            onClick={() => {
                              setEditingPriceId(product.id);
                              setNewPriceVal(product.price.toString());
                            }}
                            className="text-stone-400 hover:text-orange-600 p-1 transition"
                            title="Quick Change Price"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Active Status */}
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase transition cursor-pointer ${
                          product.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenPriceHistory(product)}
                          className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition"
                          title="Price Revision History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-stone-700 rounded-lg transition"
                          title="Edit Product Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="p-1.5 bg-stone-100 hover:bg-rose-100 hover:text-rose-700 text-stone-700 rounded-lg transition"
                          title="Delete Product"
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1a120e]/70 backdrop-blur-xs p-0 sm:items-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-orange-600 text-white">
              <h2 className="font-bold text-base tracking-tight">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 sm:p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zinger Burger"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                >
                  <option value="">Select a Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Selling Price ({currency}) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  placeholder="e.g. 290"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Description / Ingredients (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Crispy fried chicken fillet with iceberg lettuce and mayo"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="prod_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="size-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="prod_active" className="text-xs font-bold text-stone-800 cursor-pointer">
                  Item is active and available on POS Terminal
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
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price Revision History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#1a120e]/70 backdrop-blur-xs p-0 sm:items-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-stone-200 w-full max-w-md max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 bg-orange-600 text-white">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-orange-200" />
                <h2 className="font-bold text-sm tracking-tight">
                  Price History: {historyProductName}
                </h2>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-80 overflow-y-auto flex flex-col gap-3">
              {historyLoading ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                  Loading price log...
                </div>
              ) : priceHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  No historical price revisions logged for this product.
                </div>
              ) : (
                priceHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="text-[11px] text-stone-500">
                        {new Date(item.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="text-[10px] text-stone-400 font-medium mt-0.5">
                        Changed by: {item.changer_profile?.full_name || 'Admin'}
                      </div>
                    </div>

                    <div className="text-right font-mono font-bold">
                      <span className="text-stone-400 line-through mr-1">
                        {currency} {Number(item.old_price).toLocaleString()}
                      </span>
                      <span className="text-stone-950 font-bold">
                        → {currency} {Number(item.new_price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="w-full py-2 bg-orange-600 text-white font-bold text-xs rounded-lg hover:bg-stone-800"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
