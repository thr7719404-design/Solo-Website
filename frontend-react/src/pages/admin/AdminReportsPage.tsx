import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { adminApi } from '@/api/admin';

const PERIODS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

const PIE_COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899', '#64748B'];

const fmtAed = (n: number) => `AED ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function AdminReportsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const changePeriod = (d: number) => { setLoading(true); setDays(d); };

  useEffect(() => {
    let cancelled = false;
    adminApi.getReports(days)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => { if (!cancelled) toast.error('Failed to load reports'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  if (loading || !data) return <div className="py-12 text-center text-gray-400">Loading reports...</div>;

  const fin = data.financial ?? {};
  const growth = fin.monthGrowthPercent ?? 0;

  const growthSign = growth > 0 ? '+' : '';
  const growthBadge = growth === 0 ? undefined : `${growthSign}${growth.toFixed(1)}%`;
  const growthColor = growth >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Business Intelligence</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button key={p.days} onClick={() => changePeriod(p.days)} className={`px-3 py-1.5 text-xs rounded font-medium ${days === p.days ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Today's Revenue" value={fmtAed(fin.today?.revenue ?? 0)} />
        <KpiCard label="This Week" value={fmtAed(fin.week?.revenue ?? 0)} />
        <KpiCard label="This Month" value={fmtAed(fin.month?.revenue ?? 0)} badge={growthBadge} badgeColor={growthColor} />
        <KpiCard label="All-Time Revenue" value={fmtAed(fin.allTime?.revenue ?? 0)} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Orders" value={String(fin.totalOrders ?? 0)} />
        <KpiCard label="Avg Order Value" value={fmtAed(fin.avgOrderValue ?? 0)} />
        <KpiCard label="Total VAT" value={fmtAed(fin.allTime?.vat ?? 0)} />
        <KpiCard label="Total Discounts" value={fmtAed(fin.allTime?.discount ?? 0)} />
      </div>

      {/* Revenue Trend */}
      {data.revenueSeries?.length > 0 && (
        <Section title="Revenue Trend">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmtAed(Number(v))} labelFormatter={(l) => `Date: ${String(l)}`} />
                <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* Order Breakdown */}
      {data.orderBreakdown && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PieSection title="By Status" data={data.orderBreakdown.byStatus} />
          <PieSection title="By Payment" data={data.orderBreakdown.byPayment} />
          <PieSection title="By Shipping" data={data.orderBreakdown.byShipping} />
        </div>
      )}

      {/* Top Products */}
      {data.topProducts?.length > 0 && (
        <Section title="Top Products">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(v) => fmtAed(Number(v))} />
                <Bar dataKey="totalRevenue" fill="#6366F1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* Stock Overview */}
      {data.stock && (
        <Section title="Inventory Health">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <KpiCard label="Total Variants" value={String(data.stock.totalVariants ?? 0)} />
            <KpiCard label="Total Stock Units" value={String(data.stock.totalStockUnits ?? 0)} />
            <KpiCard label="Out of Stock" value={String(data.stock.outOfStockCount ?? 0)} />
            <KpiCard label="Low Stock" value={String(data.stock.lowStockCount ?? 0)} />
          </div>
          {data.stock.lowStockItems?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-gray-500 uppercase border-b"><th className="py-2 pr-4">Product</th><th className="py-2 pr-4">SKU</th><th className="py-2">Stock</th></tr></thead>
                <tbody>
                  {data.stock.lowStockItems.map((it: any) => (
                    <tr key={it.variantId} className="border-b border-gray-100">
                      <td className="py-2 pr-4">{it.productName}</td>
                      <td className="py-2 pr-4 text-gray-500">{it.sku}</td>
                      <td className={`py-2 font-semibold ${it.stockQty === 0 ? 'text-red-600' : 'text-amber-600'}`}>{it.stockQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* Customer Analytics */}
      {data.customers && (
        <Section title="Customer Analytics">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <KpiCard label="Total Customers" value={String(data.customers.totalCustomers ?? 0)} />
            <KpiCard label="New Today" value={String(data.customers.newCustomersToday ?? 0)} />
            <KpiCard label="Returning" value={String(data.customers.segments?.returning ?? 0)} />
          </div>
          {data.customers.topSpenders?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-gray-500 uppercase border-b"><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Orders</th><th className="py-2">Spent</th></tr></thead>
                <tbody>
                  {data.customers.topSpenders.map((s: any) => (
                    <tr key={s.userId} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium">{s.name}</td>
                      <td className="py-2 pr-4 text-gray-500">{s.email}</td>
                      <td className="py-2 pr-4">{s.orderCount}</td>
                      <td className="py-2 font-semibold">{fmtAed(s.totalSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* VAT Report */}
      {data.vat?.monthlySeries?.length > 0 && (
        <Section title="VAT Collection">
          <div className="text-sm text-gray-500 mb-3">Effective rate: {((data.vat.effectiveRate ?? 0) * 100).toFixed(1)}%</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500 uppercase border-b"><th className="py-2 pr-4">Month</th><th className="py-2 pr-4">Revenue</th><th className="py-2">VAT</th></tr></thead>
              <tbody>
                {data.vat.monthlySeries.map((m: any) => (
                  <tr key={m.month} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{m.month}</td>
                    <td className="py-2 pr-4">{fmtAed(m.totalRevenue)}</td>
                    <td className="py-2 font-semibold">{fmtAed(m.vatCollected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Category Performance */}
      {data.categoryPerformance?.length > 0 && (
        <Section title="Category Performance">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500 uppercase border-b"><th className="py-2 pr-4">Category</th><th className="py-2 pr-4">Revenue</th><th className="py-2 pr-4">Qty</th><th className="py-2">Orders</th></tr></thead>
              <tbody>
                {data.categoryPerformance.map((c: any) => (
                  <tr key={c.categoryId} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">{c.name}</td>
                    <td className="py-2 pr-4">{fmtAed(c.revenue)}</td>
                    <td className="py-2 pr-4">{c.qty}</td>
                    <td className="py-2">{c.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Promo Performance */}
      {data.promos?.length > 0 && (
        <Section title="Promo Code Performance">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500 uppercase border-b"><th className="py-2 pr-4">Code</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Uses</th><th className="py-2 pr-4">Orders</th><th className="py-2 pr-4">Revenue</th><th className="py-2">Discount Given</th></tr></thead>
              <tbody>
                {data.promos.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-mono font-bold">{p.code}</td>
                    <td className="py-2 pr-4 text-gray-500">{p.discountType}</td>
                    <td className="py-2 pr-4">{p.usageCount}{p.usageLimit ? `/${p.usageLimit}` : ''}</td>
                    <td className="py-2 pr-4">{p.orderCount}</td>
                    <td className="py-2 pr-4">{fmtAed(p.totalRevenue ?? 0)}</td>
                    <td className="py-2 text-red-600">{fmtAed(p.totalDiscount ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}

/* ---------- Small helper components ---------- */

function KpiCard({ label, value, badge, badgeColor }: Readonly<{ label: string; value: string; badge?: string; badgeColor?: string }>) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-lg font-bold">{value}</p>
        {badge && <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${badgeColor ?? ''}`}>{badge}</span>}
      </div>
    </div>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function PieSection({ title, data }: Readonly<{ title: string; data?: Array<{ label: string; count: number; revenue?: number }> }>) {
  if (!data?.length) return null;
  const colored = data.map((d, i) => ({ ...d, fill: PIE_COLORS[i % PIE_COLORS.length] }));
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-xs font-semibold text-gray-500 mb-3">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={colored} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} />
            <Tooltip formatter={Number} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1 mt-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="flex-1 text-gray-600">{d.label}</span>
            <span className="font-semibold">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
