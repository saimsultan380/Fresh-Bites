'use client';

import React, { useState, useEffect } from 'react';
import { PosService } from '@/lib/services/posService';
import { DashboardStats, StoreSettings } from '@/types/pos';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Percent,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Monitor,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Link from 'next/link';
import { PageShell, PageHeader, Panel, primaryBtnClass, secondaryBtnClass } from '@/components/dashboard/AdminChrome';
import { cn } from '@/lib/utils';
import { paymentMethodLabel } from '@/lib/constants/payments';

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, settsData] = await Promise.all([
        PosService.getDashboardStats(),
        PosService.getStoreSettings(),
      ]);
      setStats(statsData);
      setSettings(settsData);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currency = settings?.currency || 'PKR';

  if (loading || !stats) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <Loader2 className="size-6 animate-spin text-orange-500" />
        <span className="text-sm font-medium text-stone-500">Loading store analytics…</span>
      </div>
    );
  }

  const kpis = [
    {
      label: "Today's Sales",
      value: stats.todaySales.toLocaleString(),
      prefix: currency,
      hint: `Yesterday: ${currency} ${stats.yesterdaySales.toLocaleString()}`,
      icon: DollarSign,
      tone: 'bg-orange-100 text-orange-700',
    },
    {
      label: "Today's Orders",
      value: String(stats.todayOrders),
      hint: 'Completed counter orders',
      icon: ShoppingBag,
      tone: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Avg Order Value',
      value: stats.averageOrderValue.toLocaleString(),
      prefix: currency,
      hint: 'Revenue per ticket',
      icon: TrendingUp,
      tone: 'bg-sky-100 text-sky-700',
    },
    {
      label: "Today's Discounts",
      value: stats.todayDiscount.toLocaleString(),
      prefix: currency,
      hint: 'Promotional deductions',
      icon: Percent,
      tone: 'bg-violet-100 text-violet-700',
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        title="Store Overview"
        description="Sales, orders, and product turnover for the counter."
        action={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button type="button" onClick={loadData} className={cn(secondaryBtnClass, 'flex-1 sm:flex-none')}>
              <RefreshCw className="size-3.5" />
              Refresh
            </button>
            <Link href="/pos" className={cn(primaryBtnClass, 'flex-1 sm:flex-none')}>
              <Monitor className="size-3.5" />
              Open Register
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Panel key={kpi.label} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">{kpi.label}</span>
                <div className={cn('flex size-8 items-center justify-center rounded-lg', kpi.tone)}>
                  <Icon className="size-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-stone-950">
                {kpi.prefix && <span className="mr-1 text-sm font-medium text-stone-400">{kpi.prefix}</span>}
                {kpi.value}
              </div>
              <p className="mt-1 text-[11px] text-stone-500">{kpi.hint}</p>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel className="p-5 lg:col-span-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Last 7 days</h2>
              <p className="text-[11px] text-stone-500">Daily revenue ({currency})</p>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold text-stone-400">7-day total</div>
              <div className="text-sm font-bold text-stone-900">
                {currency} {stats.weeklySales.toLocaleString()}
              </div>
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
        </Panel>

        <Panel className="flex flex-col p-5 lg:col-span-4">
          <h2 className="text-sm font-bold text-stone-900">Top selling items</h2>
          <p className="text-[11px] text-stone-500">Most ordered menu items</p>
          <div className="mt-4 flex flex-col gap-2.5">
            {stats.topSellingProducts.length === 0 ? (
              <p className="py-6 text-center text-xs text-stone-400">No product sales yet</p>
            ) : (
              stats.topSellingProducts.map((prod, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-stone-100 py-1 text-xs last:border-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded bg-orange-100 font-mono text-[10px] font-bold text-orange-800">
                      {idx + 1}
                    </span>
                    <span className="truncate font-semibold text-stone-800">{prod.name}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="mr-2 font-bold text-stone-900">{prod.quantity} sold</span>
                    <span className="text-[11px] text-stone-400">
                      {currency} {prod.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-auto border-t border-stone-100 pt-3">
            <Link href="/dashboard/reports" className="flex items-center justify-between text-xs font-semibold text-orange-700 hover:text-orange-800">
              <span>View full analytics</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex items-center justify-between border-b border-stone-100 p-5">
          <div>
            <h2 className="text-sm font-bold text-stone-900">Recent sales</h2>
            <p className="text-[11px] text-stone-500">Latest tickets from the register</p>
          </div>
          <Link href="/dashboard/sales" className="text-xs font-semibold text-orange-700 hover:text-orange-800">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold text-stone-600 uppercase">
              <tr>
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3">Cashier</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {stats.recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-stone-400">
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                stats.recentSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                    <td className="px-5 py-3.5 font-mono font-bold text-stone-900">{sale.invoice_number}</td>
                    <td className="px-5 py-3.5 text-stone-600">
                      {new Date(sale.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-stone-700">{sale.cashier_name || 'Cashier'}</td>
                    <td className="px-5 py-3.5 text-[11px] font-bold text-stone-600 uppercase">{paymentMethodLabel(sale.payment_method)}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-stone-950">
                      {currency} {sale.total_amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
                          sale.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        )}
                      >
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </PageShell>
  );
}
