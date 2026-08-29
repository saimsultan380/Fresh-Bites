'use client';

import React, { useState, useEffect } from 'react';
import { PosService } from '@/lib/services/posService';
import { DashboardStats, StoreSettings } from '@/types/pos';
import { Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [statsData, settsData] = await Promise.all([
        PosService.getDashboardStats(),
        PosService.getStoreSettings(),
      ]);
      setStats(statsData);
      setSettings(settsData);
    } catch (err: any) {
      toast.error('Failed to load reports: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const currency = settings?.currency || 'PKR';

  if (loading || !stats) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-stone-500 flex flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-xs font-bold">Compiling Financial Reports...</span>
      </div>
    );
  }

  const totalProductRevenue = stats.topSellingProducts.reduce((acc, p) => acc + p.revenue, 0);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Sales & Revenue Reports
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Periodic financial aggregates, product sales breakdown, and performance analytics.
          </p>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today Summary */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col gap-2">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Daily Sales (Today)
          </div>
          <div className="font-mono font-bold text-2xl text-stone-950">
            <span className="text-sm font-bold text-stone-500 mr-1">{currency}</span>
            {stats.todaySales.toLocaleString()}
          </div>
          <div className="flex justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
            <span>Orders: <strong className="text-stone-800">{stats.todayOrders}</strong></span>
            <span>AOV: <strong className="text-stone-800">{currency} {stats.averageOrderValue.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* 7-Day Summary */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col gap-2">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Weekly Sales (Last 7 Days)
          </div>
          <div className="font-mono font-bold text-2xl text-orange-600">
            <span className="text-sm font-bold text-stone-500 mr-1">{currency}</span>
            {stats.weeklySales.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-100">
            Cumulative 7-day completed sales revenue
          </div>
        </div>

        {/* 30-Day Summary */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col gap-2">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Monthly Sales (Last 30 Days)
          </div>
          <div className="font-mono font-bold text-2xl text-emerald-700">
            <span className="text-sm font-bold text-stone-500 mr-1">{currency}</span>
            {stats.monthlySales.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-100">
            Rolling 30-day store performance
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Last 7 days</h2>
            <p className="text-[11px] text-stone-500">Daily revenue ({currency})</p>
          </div>
        </div>
        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.salesByDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(val: any) => [`${currency} ${Number(val).toLocaleString()}`, 'Sales']}
                contentStyle={{
                  backgroundColor: '#1c1917',
                  borderColor: '#292524',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="sales" fill="#ea580c" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Revenue Breakdown Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-stone-900 tracking-tight">
              Product Performance & Volume Breakdown
            </h2>
            <p className="text-[11px] text-stone-500 font-medium">
              Sales volume and revenue generated per menu item
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5">Product Name</th>
                <th className="px-5 py-3.5 text-center">Units Sold</th>
                <th className="px-5 py-3.5 text-right">Total Revenue ({currency})</th>
                <th className="px-5 py-3.5 text-right">Revenue Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {stats.topSellingProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-stone-400">
                    No product sales logged yet.
                  </td>
                </tr>
              ) : (
                stats.topSellingProducts.map((p, idx) => {
                  const share = totalProductRevenue > 0
                    ? ((p.revenue / totalProductRevenue) * 100).toFixed(1)
                    : '0';

                  return (
                    <tr key={idx} className="hover:bg-stone-50 transition">
                      <td className="px-5 py-4 font-bold text-stone-900 text-sm">
                        {p.name}
                      </td>
                      <td className="px-5 py-4 text-center font-mono font-bold text-stone-800">
                        {p.quantity}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-right text-stone-950">
                        {p.revenue.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 bg-stone-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-orange-500 h-full rounded-full"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="font-mono text-stone-600 text-[11px] font-bold w-10 text-right">
                            {share}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
