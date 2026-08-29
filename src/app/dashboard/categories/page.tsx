'use client';

import React, { useState, useEffect } from 'react';
import { PosService } from '@/lib/services/posService';
import { Category } from '@/types/pos';
import {
  Plus,
  FolderTree,
  Edit2,
  Trash2,
  Loader2,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sort_order: '0',
    is_active: true,
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await PosService.getCategories(false);
      setCategories(data);
    } catch (err: any) {
      toast.error('Failed to load categories: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      sort_order: (categories.length + 1).toString(),
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      sort_order: cat.sort_order.toString(),
      is_active: cat.is_active,
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : slug,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    const sortOrderNum = parseInt(formData.sort_order) || 0;
    const finalSlug = formData.slug || formData.name.toLowerCase().replace(/ /g, '-');

    try {
      if (editingCategory) {
        await PosService.updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          slug: finalSlug,
          sort_order: sortOrderNum,
          is_active: formData.is_active,
        });
        toast.success(`Updated category ${formData.name}`);
      } else {
        await PosService.createCategory({
          name: formData.name.trim(),
          slug: finalSlug,
          sort_order: sortOrderNum,
          is_active: formData.is_active,
        });
        toast.success(`Created category ${formData.name}`);
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      loadCategories();
    } catch (err: any) {
      toast.error('Failed to save category: ' + err.message);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (confirm(`Delete category "${cat.name}"? Products in this category will become Uncategorized.`)) {
      try {
        await PosService.deleteCategory(cat.id);
        toast.success(`Deleted ${cat.name}`);
        loadCategories();
      } catch (err: any) {
        toast.error('Failed to delete category: ' + err.message);
      }
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await PosService.updateCategory(cat.id, { is_active: !cat.is_active });
      toast.success(`${cat.name} is now ${!cat.is_active ? 'Active' : 'Inactive'}`);
      loadCategories();
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
            Product Categories
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Organize food & beverage categories and control their appearance order on POS screens.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5 w-16 text-center">Order</th>
                <th className="px-5 py-3.5">Category Name</th>
                <th className="px-5 py-3.5">URL Slug</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-stone-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-stone-400">
                    No categories found. Click "Add Category" to create your first category.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-stone-50 transition">
                    <td className="px-5 py-4 text-center font-mono font-bold text-stone-500">
                      {cat.sort_order}
                    </td>
                    <td className="px-5 py-4 font-bold text-stone-900 text-sm">
                      {cat.name}
                    </td>
                    <td className="px-5 py-4 font-mono text-stone-500 text-[11px]">
                      {cat.slug}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase transition cursor-pointer ${
                          cat.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                        }`}
                      >
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-stone-700 rounded-lg transition"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 bg-stone-100 hover:bg-rose-100 hover:text-rose-700 text-stone-700 rounded-lg transition"
                          title="Delete Category"
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
                {editingCategory ? 'Edit Category' : 'Create Category'}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Burgers & Wraps"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. burgers-wraps"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-medium focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Display Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono font-bold focus:border-orange-400 focus:ring-3 focus:ring-orange-500/15 focus:outline-none"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Lowest number appears first on the POS Terminal.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cat_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="size-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="cat_active" className="text-xs font-bold text-stone-800 cursor-pointer">
                  Category is active and visible on POS
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
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
