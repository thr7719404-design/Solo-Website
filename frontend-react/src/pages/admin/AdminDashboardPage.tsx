import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/api/admin';
import type { DashboardStatsDto, FullReportDto } from '@/types';
import styles from './Admin.module.css';

/* ── Helpers ── */
const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--admin-accent)', PENDING: 'var(--admin-accent)',
  processing: 'var(--admin-blue)', PROCESSING: 'var(--admin-blue)',
  shipped: 'var(--admin-violet)', SHIPPED: 'var(--admin-violet)',
  delivered: 'var(--admin-emerald)', DELIVERED: 'var(--admin-emerald)',
  cancelled: 'var(--admin-rose)', CANCELLED: 'var(--admin-rose)',
  REFUNDED: 'var(--admin-rose)',
};

const ACTIVITY_COLORS: Record<string, string> = {
  order: 'var(--admin-cyan)',
  product: 'var(--admin-emerald)',
  category: 'var(--admin-violet)',
  user: 'var(--admin-accent)',
};

function fmt(n: number, dec = 0): string {
  return n.toLocaleString('en-AE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function pct(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function MiniBar({ data, color }: Readonly<{ data: number[]; color: string }>) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 36 }}>
      {data.slice(-14).map((v, i) => (
        <div key={`bar-${i}-${v}`} style={{ width: 6, borderRadius: 2, background: color, opacity: 0.7, height: `${Math.max((v / max) * 100, 4)}%`, transition: 'height 0.4s ease' }} />
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [report, setReport] = useState<FullReportDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStats().catch(() => null),
      adminApi.getReports(30).catch(() => null),
    ]).then(([s, r]) => { setStats(s); setReport(r); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles['admin-body']}><div className="loading-spinner" /></div>;

  const s = stats;
  const f = report?.financial;
  const rev = report?.revenueSeries ?? [];
  const stk = report?.stock;
  const cust = report?.customers;
  const cats = report?.categoryPerformance ?? [];
  const ob = report?.orderBreakdown;

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Dashboard</h1>
          <span className={styles['header-v2-sub']}>Business intelligence overview — last 30 days</span>
        </div>
        <Link to="/admin/analytics" className={styles['btn-secondary']}>Full Analytics →</Link>
      </div>
      <div className={styles['admin-body']}>

        {/* ═══ OPERATIONAL ALERTS — actionable issues at-a-glance ═══ */}
        {report && (() => {
          const alerts = [
            { key: 'stuck', label: 'Stuck Orders (>3d)', value: report.stuckOrders.totalStuck, color: 'var(--admin-rose)', emoji: '⏱️', to: '/admin/orders?status=PROCESSING', show: report.stuckOrders.totalStuck > 0 },
            { key: 'oos', label: 'Out of Stock', value: report.stock.outOfStockCount, color: 'var(--admin-rose)', emoji: '🚫', to: '/admin/products', show: report.stock.outOfStockCount > 0 },
            { key: 'low', label: 'Low Stock', value: report.stock.lowStockCount, color: 'var(--admin-accent)', emoji: '⚠️', to: '/admin/products', show: report.stock.lowStockCount > 0 },
            { key: 'failed', label: 'Failed Payments (30d)', value: report.failedPayments.failedCount, color: 'var(--admin-rose)', emoji: '💳', to: '/admin/orders', show: report.failedPayments.failedCount > 0 },
            { key: 'abandoned', label: 'Abandoned Carts (7d)', value: report.abandonedCarts.abandonedCartCount, color: 'var(--admin-accent)', emoji: '🛒', to: '/admin/customers', show: report.abandonedCarts.abandonedCartCount > 0 },
            { key: 'noimg', label: 'Missing Images', value: report.catalogHealth.issues.missingImages, color: 'var(--admin-violet)', emoji: '🖼️', to: '/admin/products', show: report.catalogHealth.issues.missingImages > 0 },
            { key: 'slow', label: `Slow Movers (${report.slowMovers.periodDays}d)`, value: report.slowMovers.slowMoverCount, color: 'var(--admin-violet)', emoji: '🐢', to: '/admin/products', show: report.slowMovers.slowMoverCount > 0 },
            { key: 'returns', label: `Returns (${report.refunds.periodDays}d)`, value: report.refunds.totalReturns, color: 'var(--admin-blue)', emoji: '↩️', to: '/admin/orders', show: report.refunds.totalReturns > 0 },
          ].filter(a => a.show);
          if (!alerts.length) return null;
          return (
            <div className={styles['glass-panel']} style={{ marginBottom: 16, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <strong style={{ fontSize: 13, letterSpacing: 0.4, color: 'var(--admin-text-dim)', textTransform: 'uppercase' }}>Operational Alerts</strong>
                <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{alerts.length} item{alerts.length === 1 ? '' : 's'} need attention</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {alerts.map(a => (
                  <Link key={a.key} to={a.to} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${a.color}33`, borderLeft: `3px solid ${a.color}`, borderRadius: 8, textDecoration: 'none', color: 'inherit' }}>
                    <span style={{ fontSize: 20 }}>{a.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: a.color, lineHeight: 1.1 }}>{fmt(a.value)}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.label}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ═══ ROW 1: Financial KPIs ═══ */}
        <div className={styles['stats-grid']}>
          <div className={`${styles['stat-card']} ${styles['stat-card-accent']}`}>
            <div className={`${styles['stat-icon']} ${styles['stat-icon-accent']}`}>💰</div>
            <div className={styles['stat-label']}>Revenue Today</div>
            <div className={styles['stat-value']}>AED {fmt(f?.today.revenue ?? s?.revenueToday ?? 0)}</div>
            <div className={styles['stat-sub']}>Week: AED {fmt(f?.week.revenue ?? s?.revenueThisWeek ?? 0)} · Month: AED {fmt(f?.month.revenue ?? s?.revenueThisMonth ?? 0)}</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-cyan']}`}>
            <div className={`${styles['stat-icon']} ${styles['stat-icon-cyan']}`}>📦</div>
            <div className={styles['stat-label']}>Orders Today</div>
            <div className={styles['stat-value']}>{f?.today.orders ?? s?.ordersToday ?? 0}</div>
            <div className={styles['stat-sub']}>Week: {f?.week.orders ?? s?.ordersThisWeek ?? 0} · Month: {f?.month.orders ?? s?.ordersThisMonth ?? 0}</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-emerald']}`}>
            <div className={`${styles['stat-icon']} ${styles['stat-icon-emerald']}`}>📈</div>
            <div className={styles['stat-label']}>Avg Order Value</div>
            <div className={styles['stat-value']}>AED {fmt(f?.avgOrderValue ?? 0, 2)}</div>
            <div className={styles['stat-sub']}>Growth: {pct(f?.monthGrowthPercent ?? 0)}{(() => {
              const g = f?.monthGrowthPercent ?? 0;
              if (g > 0) return ' ↑';
              if (g < 0) return ' ↓';
              return '';
            })()}</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-violet']}`}>
            <div className={`${styles['stat-icon']} ${styles['stat-icon-violet']}`}>👥</div>
            <div className={styles['stat-label']}>Total Customers</div>
            <div className={styles['stat-value']}>{fmt(cust?.totalCustomers ?? s?.totalCustomers ?? 0)}</div>
            <div className={styles['stat-sub']}>New today: {cust?.newCustomersToday ?? s?.newCustomersToday ?? 0} · Returning: {cust?.segments.returning ?? 0}</div>
          </div>
        </div>

        {/* ═══ ROW 2: All-Time Financial + VAT + Discounts + Shipping + Revenue Trend ═══ */}
        <div className={styles['stats-grid']} style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
          <div className={`${styles['stat-card']} ${styles['stat-card-accent']}`}>
            <div className={styles['stat-label']}>All-Time Revenue</div>
            <div className={styles['stat-value']} style={{ fontSize: 22 }}>AED {fmt(f?.allTime.revenue ?? 0)}</div>
            <div className={styles['stat-sub']}>{fmt(f?.totalOrders ?? 0)} orders total</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-blue']}`}>
            <div className={styles['stat-label']}>VAT Collected (30d)</div>
            <div className={styles['stat-value']} style={{ fontSize: 22 }}>AED {fmt(f?.month.vat ?? 0)}</div>
            <div className={styles['stat-sub']}>All-time: AED {fmt(f?.allTime.vat ?? 0)}</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-rose']}`}>
            <div className={styles['stat-label']}>Discounts Given (30d)</div>
            <div className={styles['stat-value']} style={{ fontSize: 22 }}>AED {fmt(f?.month.discount ?? 0)}</div>
            <div className={styles['stat-sub']}>All-time: AED {fmt(f?.allTime.discount ?? 0)}</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-cyan']}`}>
            <div className={styles['stat-label']}>Shipping Revenue</div>
            <div className={styles['stat-value']} style={{ fontSize: 22 }}>AED {fmt(f?.allTime.shipping ?? 0)}</div>
            <div className={styles['stat-sub']}>All-time total</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-emerald']}`}>
            <div className={styles['stat-label']}>Revenue Trend (14d)</div>
            <MiniBar data={rev.slice(-14).map(d => d.revenue)} color="var(--admin-emerald)" />
          </div>
        </div>

        {/* ═══ ROW 3: Catalog Summary ═══ */}
        {s?.catalogSummary && (
          <div className={styles['stats-grid']} style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 20 }}>
            {([
              { label: 'Categories', val: s.catalogSummary.totalCategories, color: 'violet' },
              { label: 'Brands', val: s.catalogSummary.totalBrands, color: 'cyan' },
              { label: 'Products', val: s.catalogSummary.totalProducts, color: 'blue' },
              { label: 'Active', val: s.catalogSummary.activeProducts, color: 'emerald' },
              { label: 'Featured', val: s.catalogSummary.featuredProducts, color: 'accent' },
              { label: 'Low Stock', val: s.catalogSummary.lowStockCount, color: 'rose' },
            ] as const).map(c => (
              <div key={c.label} className={`${styles['stat-card']} ${styles['stat-card-' + c.color]}`}>
                <div className={styles['stat-label']}>{c.label}</div>
                <div className={styles['stat-value']} style={{ fontSize: 24 }}>{c.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ ROW 4: Revenue Chart (30d) + Orders by Status ═══ */}
        <div className={`${styles['dash-grid']} ${styles['dash-grid-2']}`} style={{ marginBottom: 20 }}>
          <div className={styles['glass-panel']}>
            <div className={styles['glass-panel-header']}>
              <h3>Daily Revenue (30 days)</h3>
              <span className={styles['count-chip']}>AED {fmt(rev.reduce((a, d) => a + d.revenue, 0))}</span>
            </div>
            <div className={styles['glass-panel-body']}>
              {rev.length === 0 ? (
                <div className={styles['empty-state']} style={{ padding: 30 }}><p>No revenue data</p></div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 160 }}>
                  {rev.map((d, i) => {
                    const maxRev = Math.max(...rev.map(r => r.revenue), 1);
                    const h = Math.max((d.revenue / maxRev) * 100, 2);
                    return (
                      <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div
                          title={`${d.date}: AED ${fmt(d.revenue)} (${d.orders} orders)`}
                          style={{ width: '100%', maxWidth: 18, height: `${h}%`, borderRadius: 3, background: d.orders > 0 ? 'linear-gradient(180deg, var(--admin-cyan), var(--admin-accent))' : 'var(--admin-glass-border)', transition: 'height 0.4s ease', cursor: 'pointer' }}
                        />
                        {i % 5 === 0 && <span style={{ fontSize: 9, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>{d.date.slice(5)}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={styles['glass-panel']}>
            <div className={styles['glass-panel-header']}>
              <h3>Orders by Status</h3>
              <Link to="/admin/orders" className={styles['btn-ghost']} style={{ fontSize: 12 }}>View All →</Link>
            </div>
            <div className={styles['glass-panel-body']}>
              {(ob?.byStatus ?? s?.ordersByStatus ?? []).length === 0 ? (
                <div className={styles['empty-state']} style={{ padding: 30 }}><p>No order data yet</p></div>
              ) : (
                <>
                  {(ob?.byStatus ?? []).map(os => {
                    const total = (ob?.byStatus ?? []).reduce((a, x) => a + x.count, 0) || 1;
                    return (
                      <div key={os.label} className={styles['status-bar-row']}>
                        <span className={styles['status-bar-label']}>{os.label}</span>
                        <div className={styles['status-bar-track']}>
                          <div className={styles['status-bar-fill']} style={{ width: `${(os.count / total) * 100}%`, background: STATUS_COLORS[os.label] ?? 'var(--admin-text-dim)' }} />
                        </div>
                        <span className={styles['status-bar-value']}>{os.count}</span>
                        <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', minWidth: 60, textAlign: 'right' }}>AED {fmt(os.revenue)}</span>
                      </div>
                    );
                  })}
                  {(ob?.byPayment ?? []).length > 0 && (
                    <>
                      <div style={{ margin: '16px 0 8px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--admin-text-muted)', fontWeight: 700 }}>By Payment Method</div>
                      {ob!.byPayment.map(p => {
                        const total = ob!.byPayment.reduce((a, x) => a + x.count, 0) || 1;
                        return (
                          <div key={p.label} className={styles['status-bar-row']}>
                            <span className={styles['status-bar-label']}>{p.label || 'N/A'}</span>
                            <div className={styles['status-bar-track']}>
                              <div className={styles['status-bar-fill']} style={{ width: `${(p.count / total) * 100}%`, background: 'var(--admin-violet)' }} />
                            </div>
                            <span className={styles['status-bar-value']}>{p.count}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ═══ ROW 5: Top Products + Category Performance ═══ */}
        <div className={`${styles['dash-grid']} ${styles['dash-grid-2']}`} style={{ marginBottom: 20 }}>
          <div className={styles['glass-panel']}>
            <div className={styles['glass-panel-header']}>
              <h3>Top Products by Revenue</h3>
              <Link to="/admin/products" className={styles['btn-ghost']} style={{ fontSize: 12 }}>Catalog →</Link>
            </div>
            <div className={styles['glass-panel-body']}>
              {(report?.topProducts ?? s?.topProducts ?? []).length === 0 ? (
                <div className={styles['empty-state']} style={{ padding: 30 }}><p>No product data yet</p></div>
              ) : (
                (report?.topProducts ?? []).slice(0, 8).map((p, i) => (
                  <div key={p.productId ?? i} className={styles['top-product-row']}>
                    <div className={styles['top-product-rank']}>{i + 1}</div>
                    <div className={styles['top-product-info']}>
                      <div className={styles['top-product-name']}>{p.name}</div>
                      <div className={styles['top-product-sku']}>{p.sku}</div>
                    </div>
                    <div className={styles['top-product-stat']}>
                      AED {fmt(p.totalRevenue)}
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 400 }}>{p.totalOrders} orders · {p.totalQty} units</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles['glass-panel']}>
            <div className={styles['glass-panel-header']}>
              <h3>Category Performance</h3>
              <span className={styles['count-chip']}>{cats.length} categories</span>
            </div>
            <div className={styles['glass-panel-body']}>
              {cats.length === 0 ? (
                <div className={styles['empty-state']} style={{ padding: 30 }}><p>No category data yet</p></div>
              ) : (
                cats.slice(0, 8).map((c, i) => {
                  const maxRev = Math.max(...cats.map(x => x.revenue), 1);
                  return (
                    <div key={c.categoryId} className={styles['status-bar-row']}>
                      <span className={styles['status-bar-label']} style={{ minWidth: 120 }}>{i + 1}. {c.name}</span>
                      <div className={styles['status-bar-track']}>
                        <div className={styles['status-bar-fill']} style={{ width: `${(c.revenue / maxRev) * 100}%`, background: 'var(--admin-cyan)' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, minWidth: 80, textAlign: 'right' }}>AED {fmt(c.revenue)}</span>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', minWidth: 50, textAlign: 'right' }}>{c.qty} units</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ═══ ROW 6: Inventory Health + Customer Intelligence ═══ */}
        <div className={`${styles['dash-grid']} ${styles['dash-grid-2']}`} style={{ marginBottom: 20 }}>
          <div className={styles['glass-panel']}>
            <div className={styles['glass-panel-header']}>
              <h3>Inventory Health</h3>
              <span className={styles['count-chip']}>{fmt(stk?.totalStockUnits ?? 0)} units</span>
            </div>
            <div className={styles['glass-panel-body']}>
              {stk ? (
                <>
                  {stk.distribution.map(b => {
                    const maxC = Math.max(...stk.distribution.map(x => x.count), 1);
                    let barColor: string;
                    if (b.label.includes('Out')) barColor = 'var(--admin-rose)';
                    else if (b.label.includes('Critical')) barColor = 'var(--admin-accent)';
                    else if (b.label.includes('Low')) barColor = 'var(--admin-blue)';
                    else if (b.label.includes('Normal')) barColor = 'var(--admin-emerald)';
                    else barColor = 'var(--admin-cyan)';
                    return (
                      <div key={b.label} className={styles['status-bar-row']}>
                        <span className={styles['status-bar-label']} style={{ minWidth: 110 }}>{b.label}</span>
                        <div className={styles['status-bar-track']}>
                          <div className={styles['status-bar-fill']} style={{ width: `${(b.count / maxC) * 100}%`, background: barColor }} />
                        </div>
                        <span className={styles['status-bar-value']}>{b.count}</span>
                      </div>
                    );
                  })}
                  {stk.lowStockItems.length > 0 && (
                    <>
                      <div style={{ margin: '16px 0 8px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--admin-text-muted)', fontWeight: 700 }}>⚠️ Low Stock Items ({stk.lowStockItems.length})</div>
                      {stk.lowStockItems.slice(0, 6).map(item => (
                        <div key={item.variantId} className={styles['low-stock-item']}>
                          <div className={styles['top-product-info']}>
                            <div className={styles['top-product-name']}>{item.productName}</div>
                            <div className={styles['top-product-sku']}>{item.sku}</div>
                          </div>
                          <div className={styles['low-stock-badge']}>{item.stockQty <= 0 ? 'OUT' : `${item.stockQty} left`}</div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <div className={styles['empty-state']} style={{ padding: 30 }}><p>No stock data</p></div>
              )}
            </div>
          </div>

          <div className={styles['glass-panel']}>
            <div className={styles['glass-panel-header']}>
              <h3>Customer Intelligence</h3>
              <Link to="/admin/customers" className={styles['btn-ghost']} style={{ fontSize: 12 }}>All Customers →</Link>
            </div>
            <div className={styles['glass-panel-body']}>
              {cust ? (
                <>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'First-Time', val: cust.segments.firstTime },
                      { label: 'Returning', val: cust.segments.returning },
                      { label: 'New Today', val: cust.newCustomersToday },
                    ].map(seg => (
                      <div key={seg.label} style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: 'var(--admin-glass)', border: '1px solid var(--admin-glass-border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{seg.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{seg.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--admin-text-muted)', fontWeight: 700, marginBottom: 8 }}>Top Spenders</div>
                  {cust.topSpenders.slice(0, 5).map((sp, i) => (
                    <div key={sp.userId} className={styles['top-product-row']}>
                      <div className={styles['top-product-rank']}>{i + 1}</div>
                      <div className={styles['top-product-info']}>
                        <div className={styles['top-product-name']}>{sp.name}</div>
                        <div className={styles['top-product-sku']}>{sp.email}</div>
                      </div>
                      <div className={styles['top-product-stat']}>
                        AED {fmt(sp.totalSpent)}
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 400 }}>{sp.orderCount} orders</div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className={styles['empty-state']} style={{ padding: 30 }}><p>No customer data</p></div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ ROW 7: Recent Orders + Recent Activity ═══ */}
        <div className={`${styles['dash-grid']} ${styles['dash-grid-2']}`} style={{ marginBottom: 20 }}>
          <div className={styles['glass-panel']}>
            <div className={styles['glass-panel-header']}>
              <h3>Recent Orders</h3>
              <Link to="/admin/orders" className={styles['btn-ghost']} style={{ fontSize: 12 }}>All Orders →</Link>
            </div>
            <table className={styles['table-v2']}>
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {(s?.recentOrders ?? []).length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 28, color: 'var(--admin-text-muted)' }}>No orders yet</td></tr>
                ) : (
                  (s?.recentOrders ?? []).map(o => {
                    const ORDER_TAG_MAP: Record<string, string> = {
                      delivered: 'table-tag-green',
                      shipped: 'table-tag-violet',
                      processing: 'table-tag-blue',
                      cancelled: 'table-tag-red',
                    };
                    const tagClass = ORDER_TAG_MAP[o.status.toLowerCase()] ?? 'table-tag-yellow';
                    return (
                      <tr key={o.id}>
                        <td><Link to={`/admin/orders/${o.id}`} className={styles['table-name']}>#{o.orderNumber}</Link></td>
                        <td>{o.customerName}</td>
                        <td style={{ fontWeight: 600 }}>AED {Number(o.total).toFixed(2)}</td>
                        <td><span className={`${styles['table-tag']} ${styles[tagClass]}`}>{o.status}</span></td>
                        <td style={{ color: 'var(--admin-text-dim)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className={styles['glass-panel']}>
            <div className={styles['glass-panel-header']}>
              <h3>Recent Activity</h3>
            </div>
            <div className={styles['glass-panel-body']}>
              {(s?.recentActivity ?? []).length === 0 ? (
                <div className={styles['empty-state']} style={{ padding: 30 }}><p>No recent activity</p></div>
              ) : (
                (s?.recentActivity ?? []).slice(0, 10).map(a => (
                  <div key={a.id} className={styles['activity-item']}>
                    <div className={styles['activity-dot']} style={{ background: ACTIVITY_COLORS[a.type] ?? 'var(--admin-text-muted)' }} />
                    <div className={styles['activity-content']}>
                      <div className={styles['activity-title']}>{a.title}</div>
                      {a.subtitle && <div className={styles['activity-sub']}>{a.subtitle}</div>}
                    </div>
                    <div className={styles['activity-time']}>{timeAgo(a.timestamp)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ═══ OPERATIONS & INTELLIGENCE KPI STRIP ═══ */}
        {report && (
          <div className={styles['stats-grid']} style={{ marginBottom: 20 }}>
            <div className={`${styles['stat-card']} ${styles['stat-card-emerald']}`}>
              <div className={`${styles['stat-icon']} ${styles['stat-icon-emerald']}`}>📦</div>
              <div className={styles['stat-label']}>Inventory Value</div>
              <div className={styles['stat-value']}>AED {fmt(report.inventoryValue.totalRetailValue)}</div>
              <div className={styles['stat-sub']}>{fmt(report.inventoryValue.totalUnits)} units · Cost AED {fmt(report.inventoryValue.totalCostValue)}</div>
            </div>
            <div className={`${styles['stat-card']} ${styles['stat-card-blue']}`}>
              <div className={`${styles['stat-icon']} ${styles['stat-icon-blue']}`}>🚚</div>
              <div className={styles['stat-label']}>Fulfillment SLA</div>
              <div className={styles['stat-value']}>{report.fulfillment.avgOrderToShipDays}d</div>
              <div className={styles['stat-sub']}>Order→Ship · Ship→Deliver {report.fulfillment.avgShipToDeliverDays}d</div>
            </div>
            <div className={`${styles['stat-card']} ${styles['stat-card-violet']}`}>
              <div className={`${styles['stat-icon']} ${styles['stat-icon-violet']}`}>🔁</div>
              <div className={styles['stat-label']}>Repeat Buyer Rate</div>
              <div className={styles['stat-value']}>{report.repeatRate.repeatRatePercent}%</div>
              <div className={styles['stat-sub']}>{report.repeatRate.repeatBuyers} of {report.repeatRate.uniqueBuyers} buyers · {report.repeatRate.avgOrdersPerBuyer} avg orders</div>
            </div>
            <div className={`${styles['stat-card']} ${styles['stat-card-cyan']}`}>
              <div className={`${styles['stat-icon']} ${styles['stat-icon-cyan']}`}>🎁</div>
              <div className={styles['stat-label']}>Loyalty Wallets</div>
              <div className={styles['stat-value']}>{fmt(report.loyalty.totalWallets)}</div>
              <div className={styles['stat-sub']}>AED {fmt(report.loyalty.totalBalanceInCirculation)} balance · {report.loyalty.redemptionRatePercent}% redemption</div>
            </div>
          </div>
        )}

        {/* ═══ CATALOG HEALTH + STUCK ORDERS ═══ */}
        {report && (
          <div className={styles['two-col']} style={{ marginBottom: 20 }}>
            <div className={styles['glass-panel']}>
              <div className={styles['glass-panel-header']}>
                <h3>Catalog Health</h3>
                {(() => {
                  const score = report.catalogHealth.completenessScore;
                  let scoreColor = 'var(--admin-rose)';
                  if (score >= 90) scoreColor = 'var(--admin-emerald)';
                  else if (score >= 70) scoreColor = 'var(--admin-accent)';
                  return (
                    <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>Score: <strong style={{ color: scoreColor }}>{score}%</strong></span>
                  );
                })()}
              </div>
              <div className={styles['glass-panel-body']}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, fontSize: 13 }}>
                  {[
                    { label: 'Total Products', value: report.catalogHealth.total, danger: false },
                    { label: 'Active', value: report.catalogHealth.active, danger: false },
                    { label: 'Inactive', value: report.catalogHealth.inactive, danger: report.catalogHealth.inactive > 0 },
                    { label: 'Discontinued', value: report.catalogHealth.discontinued, danger: false },
                    { label: 'Missing Images', value: report.catalogHealth.issues.missingImages, danger: report.catalogHealth.issues.missingImages > 0 },
                    { label: 'Missing Description', value: report.catalogHealth.issues.missingDescription, danger: report.catalogHealth.issues.missingDescription > 0 },
                    { label: 'Missing Pricing', value: report.catalogHealth.issues.missingPricing, danger: report.catalogHealth.issues.missingPricing > 0 },
                    { label: 'Missing SEO Title', value: report.catalogHealth.issues.missingMetaTitle, danger: report.catalogHealth.issues.missingMetaTitle > 0 },
                    { label: 'Missing SEO Desc', value: report.catalogHealth.issues.missingMetaDescription, danger: report.catalogHealth.issues.missingMetaDescription > 0 },
                    { label: 'Missing Brand', value: report.catalogHealth.issues.missingBrand, danger: report.catalogHealth.issues.missingBrand > 0 },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                      <span style={{ color: 'var(--admin-text-dim)' }}>{row.label}</span>
                      <strong style={{ color: row.danger ? 'var(--admin-rose)' : 'var(--admin-text)' }}>{fmt(row.value)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles['glass-panel']}>
              <div className={styles['glass-panel-header']}>
                <h3>Stuck Orders</h3>
                <Link to="/admin/orders" className={styles['btn-ghost']} style={{ fontSize: 12 }}>All Orders →</Link>
              </div>
              <div className={styles['glass-panel-body']}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
                  <div style={{ padding: 10, background: 'rgba(245,158,11,0.08)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-accent)' }}>{report.stuckOrders.over3DaysCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>&gt; 3 days</div>
                  </div>
                  <div style={{ padding: 10, background: 'rgba(244,63,94,0.08)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-rose)' }}>{report.stuckOrders.over7DaysCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>&gt; 7 days</div>
                  </div>
                  <div style={{ padding: 10, background: 'rgba(244,63,94,0.15)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-rose)' }}>{report.stuckOrders.over14DaysCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>&gt; 14 days</div>
                  </div>
                </div>
                {report.stuckOrders.items.length === 0 ? (
                  <div className={styles['empty-state']} style={{ padding: 20 }}><p>No stuck orders 🎉</p></div>
                ) : (
                  <table className={styles['table-v2']}>
                    <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Age</th></tr></thead>
                    <tbody>
                      {report.stuckOrders.items.slice(0, 8).map(o => (
                        <tr key={o.id}>
                          <td><Link to={`/admin/orders/${o.id}`} className={styles['table-name']}>#{o.orderNumber}</Link></td>
                          <td style={{ fontSize: 12 }}>{o.customerName}</td>
                          <td><span className={`${styles['table-tag']} ${styles['table-tag-yellow']}`}>{o.status}</span></td>
                          <td style={{ color: o.ageDays > 7 ? 'var(--admin-rose)' : 'var(--admin-accent)', fontWeight: 600 }}>{o.ageDays}d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ ABANDONED CARTS + REFUNDS ═══ */}
        {report && (
          <div className={styles['two-col']} style={{ marginBottom: 20 }}>
            <div className={styles['glass-panel']}>
              <div className={styles['glass-panel-header']}>
                <h3>Abandoned Carts (last 7d)</h3>
                <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>Lost: AED {fmt(report.abandonedCarts.totalLostValue)}</span>
              </div>
              <div className={styles['glass-panel-body']}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
                  <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{report.abandonedCarts.abandonedCartCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>Carts</div>
                  </div>
                  <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>AED {fmt(report.abandonedCarts.avgCartValue)}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>Avg Value</div>
                  </div>
                  <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{report.abandonedCarts.registeredCarts}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>Registered</div>
                  </div>
                </div>
                {report.abandonedCarts.topCarts.length > 0 && (
                  <table className={styles['table-v2']}>
                    <thead><tr><th>Customer</th><th>Items</th><th>Value</th><th>Age</th></tr></thead>
                    <tbody>
                      {report.abandonedCarts.topCarts.slice(0, 6).map(c => (
                        <tr key={c.id}>
                          <td style={{ fontSize: 12 }}>{c.customerName}{c.isGuest && <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, color: 'var(--admin-text-dim)' }}>guest</span>}</td>
                          <td>{c.itemCount}</td>
                          <td style={{ fontWeight: 600 }}>AED {fmt(c.estimatedValue)}</td>
                          <td style={{ color: 'var(--admin-text-dim)', fontSize: 12 }}>{c.ageHours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className={styles['glass-panel']}>
              <div className={styles['glass-panel-header']}>
                <h3>Returns & Refunds (last {report.refunds.periodDays}d)</h3>
                <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>Rate: <strong style={{ color: report.refunds.refundRatePercent > 5 ? 'var(--admin-rose)' : 'var(--admin-emerald)' }}>{report.refunds.refundRatePercent}%</strong></span>
              </div>
              <div className={styles['glass-panel-body']}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
                  <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{report.refunds.totalReturns}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>Returns</div>
                  </div>
                  <div style={{ padding: 10, background: 'rgba(244,63,94,0.08)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-rose)' }}>AED {fmt(report.refunds.totalRefundAmount)}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>Refunded</div>
                  </div>
                  <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{report.refunds.avgProcessingDays}d</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>Avg Process</div>
                  </div>
                </div>
                {report.refunds.byReason.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Top Reasons</div>
                    {report.refunds.byReason.slice(0, 5).map(r => (
                      <div key={r.reason} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                        <span>{r.reason.replace(/_/g, ' ')}</span>
                        <span><strong>{r.count}</strong> · AED {fmt(r.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ ROW 8: Promo Code Performance ═══ */}
        {(report?.promos ?? []).length > 0 && (
          <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
            <div className={styles['glass-panel-header']}>
              <h3>Promo Code Performance</h3>
              <Link to="/admin/promo-codes" className={styles['btn-ghost']} style={{ fontSize: 12 }}>Manage →</Link>
            </div>
            <table className={styles['table-v2']}>
              <thead>
                <tr><th>Code</th><th>Type</th><th>Value</th><th>Usage</th><th>Orders</th><th>Revenue</th><th>Discount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {report!.promos.slice(0, 10).map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.code}</td>
                    <td>{p.discountType}</td>
                    <td>{p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `AED ${fmt(p.discountValue)}`}</td>
                    <td>{p.usageCount}{p.usageLimit ? ` / ${p.usageLimit}` : ''}</td>
                    <td>{p.orderCount}</td>
                    <td style={{ fontWeight: 600 }}>AED {fmt(p.totalRevenue)}</td>
                    <td style={{ color: 'var(--admin-rose)' }}>AED {fmt(p.totalDiscount)}</td>
                    <td><span className={`${styles['table-tag']} ${p.isActive ? styles['table-tag-green'] : styles['table-tag-gray']}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </>
  );
}
