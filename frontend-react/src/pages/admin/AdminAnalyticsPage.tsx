import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/api/admin';
import type { FullReportDto } from '@/types';
import styles from './Admin.module.css';

function fmt(n: number, dec = 0): string {
  return n.toLocaleString('en-AE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

const PERIOD_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '365 days', value: 365 },
];

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<FullReportDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi.getReports(days)
      .then(r => setReport(r))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [days]);

  const f = report?.financial;
  const rev = report?.revenueSeries ?? [];
  const ob = report?.orderBreakdown;
  const stk = report?.stock;
  const cust = report?.customers;
  const vat = report?.vat;
  const cats = report?.categoryPerformance ?? [];
  const promos = report?.promos ?? [];
  const topProducts = report?.topProducts ?? [];

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Analytics</h1>
          <span className={styles['header-v2-sub']}>Deep-dive business intelligence</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p.value}
              className={days === p.value ? styles['btn-primary'] : styles['btn-secondary']}
              onClick={() => setDays(p.value)}
              type="button"
            >
              {p.label}
            </button>
          ))}
          <Link to="/admin" className={styles['btn-ghost']}>← Dashboard</Link>
        </div>
      </div>
      <div className={styles['admin-body']}>
        {loading && <div className="loading-spinner" style={{ margin: '40px auto' }} />}
        {!loading && !report && (
          <div className={styles['empty-state']} style={{ padding: 60 }}>
            <p>Unable to load analytics data. The reports API may require orders in the system.</p>
          </div>
        )}
        {!loading && report && (
          <>
            {/* ═══ Financial Summary Grid ═══ */}
            <div className={styles['stats-grid']} style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
              {([
                { label: 'Total Revenue', val: `AED ${fmt(f?.allTime.revenue ?? 0)}`, sub: `Month: AED ${fmt(f?.month.revenue ?? 0)}`, color: 'accent' },
                { label: 'Total Orders', val: fmt(f?.totalOrders ?? 0), sub: `Month: ${f?.month.orders ?? 0} · Growth: ${(f?.monthGrowthPercent ?? 0) > 0 ? '+' : ''}${(f?.monthGrowthPercent ?? 0).toFixed(1)}%`, color: 'cyan' },
                { label: 'Avg Order Value', val: `AED ${fmt(f?.avgOrderValue ?? 0, 2)}`, sub: `All-time average`, color: 'emerald' },
                { label: 'Total Customers', val: fmt(f?.totalCustomers ?? 0), sub: `New today: ${cust?.newCustomersToday ?? 0}`, color: 'violet' },
              ] as const).map(c => (
                <div key={c.label} className={`${styles['stat-card']} ${styles['stat-card-' + c.color]}`}>
                  <div className={styles['stat-label']}>{c.label}</div>
                  <div className={styles['stat-value']} style={{ fontSize: 22 }}>{c.val}</div>
                  <div className={styles['stat-sub']}>{c.sub}</div>
                </div>
              ))}
            </div>

            {/* ═══ Revenue Time Series ═══ */}
            <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
              <div className={styles['glass-panel-header']}>
                <h3>Revenue Time Series ({days} days)</h3>
                <span className={styles['count-chip']}>AED {fmt(rev.reduce((a, d) => a + d.revenue, 0))} total</span>
              </div>
              <div className={styles['glass-panel-body']}>
                {rev.length === 0 ? (
                  <div className={styles['empty-state']} style={{ padding: 30 }}><p>No revenue data</p></div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 200 }}>
                      {rev.map((d, i) => {
                        const maxRev = Math.max(...rev.map(r => r.revenue), 1);
                        const h = Math.max((d.revenue / maxRev) * 100, 1);
                        const labelEvery = Math.max(1, Math.floor(rev.length / 15));
                        return (
                          <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div
                              title={`${d.date}\nRevenue: AED ${fmt(d.revenue)}\nOrders: ${d.orders}\nVAT: AED ${fmt(d.vat)}\nDiscount: AED ${fmt(d.discount)}`}
                              style={{ width: '100%', maxWidth: 24, height: `${h}%`, borderRadius: 3, background: d.orders > 0 ? 'linear-gradient(180deg, var(--admin-cyan), var(--admin-accent))' : 'var(--admin-glass-border)', transition: 'height 0.4s ease', cursor: 'pointer' }}
                            />
                            {i % labelEvery === 0 && <span style={{ fontSize: 9, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>{d.date.slice(5)}</span>}
                          </div>
                        );
                      })}
                    </div>
                    {/* Summary row below chart */}
                    <div style={{ display: 'flex', gap: 20, marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--admin-glass-border)' }}>
                      {[
                        { label: 'Revenue', val: `AED ${fmt(rev.reduce((a, d) => a + d.revenue, 0))}` },
                        { label: 'Orders', val: fmt(rev.reduce((a, d) => a + d.orders, 0)) },
                        { label: 'VAT', val: `AED ${fmt(rev.reduce((a, d) => a + d.vat, 0))}` },
                        { label: 'Discounts', val: `AED ${fmt(rev.reduce((a, d) => a + d.discount, 0))}` },
                        { label: 'Shipping', val: `AED ${fmt(rev.reduce((a, d) => a + d.shipping, 0))}` },
                      ].map(m => (
                        <div key={m.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ═══ Order Breakdown (all 3 dimensions) ═══ */}
            <div className={`${styles['dash-grid']} ${styles['dash-grid-2']}`} style={{ marginBottom: 20 }}>
              {/* By Status */}
              <div className={styles['glass-panel']}>
                <div className={styles['glass-panel-header']}><h3>Orders by Status</h3></div>
                <div className={styles['glass-panel-body']}>
                  {(ob?.byStatus ?? []).length === 0 ? (
                    <div className={styles['empty-state']} style={{ padding: 30 }}><p>No data</p></div>
                  ) : (
                    <table className={styles['table-v2']}>
                      <thead><tr><th>Status</th><th>Count</th><th>Revenue</th><th>Share</th></tr></thead>
                      <tbody>
                        {ob!.byStatus.map(b => {
                          const total = ob!.byStatus.reduce((a, x) => a + x.count, 0) || 1;
                          return (
                            <tr key={b.label}>
                              <td style={{ fontWeight: 600 }}>{b.label}</td>
                              <td>{b.count}</td>
                              <td>AED {fmt(b.revenue)}</td>
                              <td>{((b.count / total) * 100).toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              {/* By Payment + Shipping */}
              <div className={styles['glass-panel']}>
                <div className={styles['glass-panel-header']}><h3>Payment & Shipping</h3></div>
                <div className={styles['glass-panel-body']}>
                  {(ob?.byPayment ?? []).length > 0 && (
                    <>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--admin-text-muted)', fontWeight: 700, marginBottom: 8 }}>Payment Methods</div>
                      {ob!.byPayment.map(p => {
                        const total = ob!.byPayment.reduce((a, x) => a + x.count, 0) || 1;
                        return (
                          <div key={p.label} className={styles['status-bar-row']}>
                            <span className={styles['status-bar-label']}>{p.label || 'N/A'}</span>
                            <div className={styles['status-bar-track']}>
                              <div className={styles['status-bar-fill']} style={{ width: `${(p.count / total) * 100}%`, background: 'var(--admin-violet)' }} />
                            </div>
                            <span className={styles['status-bar-value']}>{p.count}</span>
                            <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', minWidth: 60, textAlign: 'right' }}>AED {fmt(p.revenue)}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                  {(ob?.byShipping ?? []).length > 0 && (
                    <>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--admin-text-muted)', fontWeight: 700, margin: '16px 0 8px' }}>Shipping Methods</div>
                      {ob!.byShipping.map(sh => {
                        const total = ob!.byShipping.reduce((a, x) => a + x.count, 0) || 1;
                        return (
                          <div key={sh.label} className={styles['status-bar-row']}>
                            <span className={styles['status-bar-label']}>{sh.label || 'N/A'}</span>
                            <div className={styles['status-bar-track']}>
                              <div className={styles['status-bar-fill']} style={{ width: `${(sh.count / total) * 100}%`, background: 'var(--admin-cyan)' }} />
                            </div>
                            <span className={styles['status-bar-value']}>{sh.count}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                  {(ob?.byPayment ?? []).length === 0 && (ob?.byShipping ?? []).length === 0 && (
                    <div className={styles['empty-state']} style={{ padding: 30 }}><p>No data</p></div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ Customer Analytics ═══ */}
            <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
              <div className={styles['glass-panel-header']}>
                <h3>Customer Growth ({days} days)</h3>
                <span className={styles['count-chip']}>{fmt(cust?.totalCustomers ?? 0)} total</span>
              </div>
              <div className={styles['glass-panel-body']}>
                {(cust?.growthSeries ?? []).length === 0 ? (
                  <div className={styles['empty-state']} style={{ padding: 30 }}><p>No growth data</p></div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
                      {cust!.growthSeries.map((d, i) => {
                        const maxNew = Math.max(...cust!.growthSeries.map(x => x.newCustomers), 1);
                        const h = Math.max((d.newCustomers / maxNew) * 100, 2);
                        const labelEvery = Math.max(1, Math.floor(cust!.growthSeries.length / 10));
                        return (
                          <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div title={`${d.date}: ${d.newCustomers} new (${d.cumulative} total)`} style={{ width: '100%', maxWidth: 24, height: `${h}%`, borderRadius: 3, background: 'var(--admin-emerald)', opacity: 0.7, transition: 'height 0.4s ease', cursor: 'pointer' }} />
                            {i % labelEvery === 0 && <span style={{ fontSize: 9, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>{d.date.slice(5)}</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--admin-glass-border)' }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>First-Time</div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{cust!.segments.firstTime}</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Returning</div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{cust!.segments.returning}</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>New Today</div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{cust!.newCustomersToday}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ═══ Top Spenders ═══ */}
            {(cust?.topSpenders ?? []).length > 0 && (
              <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
                <div className={styles['glass-panel-header']}>
                  <h3>Top Spenders</h3>
                  <Link to="/admin/customers" className={styles['btn-ghost']} style={{ fontSize: 12 }}>All Customers →</Link>
                </div>
                <table className={styles['table-v2']}>
                  <thead><tr><th>#</th><th>Customer</th><th>Email</th><th>Orders</th><th>Total Spent</th></tr></thead>
                  <tbody>
                    {cust!.topSpenders.slice(0, 10).map((sp, i) => (
                      <tr key={sp.userId}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{sp.name}</td>
                        <td style={{ color: 'var(--admin-text-muted)' }}>{sp.email}</td>
                        <td>{sp.orderCount}</td>
                        <td style={{ fontWeight: 700 }}>AED {fmt(sp.totalSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ═══ VAT Report ═══ */}
            {vat && (
              <div className={`${styles['dash-grid']} ${styles['dash-grid-2']}`} style={{ marginBottom: 20 }}>
                <div className={styles['glass-panel']}>
                  <div className={styles['glass-panel-header']}><h3>VAT Summary</h3></div>
                  <div className={styles['glass-panel-body']}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      {[
                        { label: 'VAT Collected', val: `AED ${fmt(vat.totalVatCollected)}` },
                        { label: 'Net Revenue', val: `AED ${fmt(vat.netRevenue ?? (vat.totalRevenue - vat.totalVatCollected))}` },
                        { label: 'Gross Total', val: `AED ${fmt(vat.totalRevenue)}` },
                        { label: 'VAT Rate', val: '5.00%' },
                      ].map(m => (
                        <div key={m.label} style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: 'var(--admin-glass)', border: '1px solid var(--admin-glass-border)' }}>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{m.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles['glass-panel']}>
                  <div className={styles['glass-panel-header']}><h3>Monthly VAT Series</h3></div>
                  <div className={styles['glass-panel-body']}>
                    {vat.monthlySeries.length === 0 ? (
                      <div className={styles['empty-state']} style={{ padding: 30 }}><p>No VAT data</p></div>
                    ) : (
                      <table className={styles['table-v2']}>
                        <thead><tr><th>Month</th><th>VAT Collected</th><th>Revenue</th><th>Orders</th></tr></thead>
                        <tbody>
                          {vat.monthlySeries.map(m => (
                            <tr key={m.month}>
                              <td style={{ fontWeight: 600 }}>{m.month}</td>
                              <td>AED {fmt(m.vatCollected)}</td>
                              <td>AED {fmt(m.totalRevenue)}</td>
                              <td>{m.orderCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ Full Top Products Table ═══ */}
            <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
              <div className={styles['glass-panel-header']}>
                <h3>Product Performance</h3>
                <span className={styles['count-chip']}>{topProducts.length} products</span>
              </div>
              {topProducts.length === 0 ? (
                <div className={styles['glass-panel-body']}><div className={styles['empty-state']} style={{ padding: 30 }}><p>No product data</p></div></div>
              ) : (
                <table className={styles['table-v2']}>
                  <thead><tr><th>#</th><th>Product</th><th>SKU</th><th>Revenue</th><th>Qty Sold</th><th>Orders</th></tr></thead>
                  <tbody>
                    {topProducts.slice(0, 20).map((p, i) => (
                      <tr key={p.productId ?? i}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td style={{ color: 'var(--admin-text-muted)' }}>{p.sku}</td>
                        <td style={{ fontWeight: 700 }}>AED {fmt(p.totalRevenue)}</td>
                        <td>{p.totalQty}</td>
                        <td>{p.totalOrders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ═══ Category Performance Table ═══ */}
            <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
              <div className={styles['glass-panel-header']}>
                <h3>Category Performance</h3>
                <span className={styles['count-chip']}>{cats.length} categories</span>
              </div>
              {cats.length === 0 ? (
                <div className={styles['glass-panel-body']}><div className={styles['empty-state']} style={{ padding: 30 }}><p>No category data</p></div></div>
              ) : (
                <table className={styles['table-v2']}>
                  <thead><tr><th>#</th><th>Category</th><th>Revenue</th><th>Qty Sold</th><th>Orders</th><th>Share</th></tr></thead>
                  <tbody>
                    {cats.map((c, i) => {
                      const totalRev = cats.reduce((a, x) => a + x.revenue, 0) || 1;
                      return (
                        <tr key={c.categoryId}>
                          <td>{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td style={{ fontWeight: 700 }}>AED {fmt(c.revenue)}</td>
                          <td>{c.qty}</td>
                          <td>{c.orders}</td>
                          <td>{((c.revenue / totalRev) * 100).toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* ═══ Inventory Detail ═══ */}
            {stk && (
              <div className={`${styles['dash-grid']} ${styles['dash-grid-2']}`} style={{ marginBottom: 20 }}>
                <div className={styles['glass-panel']}>
                  <div className={styles['glass-panel-header']}><h3>Stock Distribution</h3></div>
                  <div className={styles['glass-panel-body']}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      {[
                        { label: 'Total Variants', val: stk.totalVariants },
                        { label: 'Out of Stock', val: stk.outOfStockCount },
                        { label: 'Low Stock', val: stk.lowStockCount },
                        { label: 'Healthy', val: stk.healthyCount },
                      ].map(m => (
                        <div key={m.label} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'var(--admin-glass)', border: '1px solid var(--admin-glass-border)', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{m.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{m.val}</div>
                        </div>
                      ))}
                    </div>
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
                  </div>
                </div>
                <div className={styles['glass-panel']}>
                  <div className={styles['glass-panel-header']}>
                    <h3>Low Stock Items</h3>
                    <span className={styles['count-chip']}>{stk.lowStockItems.length} items</span>
                  </div>
                  <div className={styles['glass-panel-body']}>
                    {stk.lowStockItems.length === 0 ? (
                      <div className={styles['empty-state']} style={{ padding: 30 }}><p>All stock levels healthy</p></div>
                    ) : (
                      <table className={styles['table-v2']}>
                        <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Status</th></tr></thead>
                        <tbody>
                          {stk.lowStockItems.slice(0, 15).map(item => (
                            <tr key={`${item.productId}-${item.variantId ?? 'p'}`}>
                              <td><Link to={`/admin/products?edit=${item.productId}`} className={styles['table-name']}>{item.productName}</Link></td>
                              <td style={{ color: 'var(--admin-text-muted)' }}>{item.sku}</td>
                              <td>{item.stockQty}</td>
                              <td>
                                <span className={`${styles['table-tag']} ${item.stockQty <= 0 ? styles['table-tag-red'] : styles['table-tag-yellow']}`}>
                                  {item.stockQty <= 0 ? 'OUT' : 'LOW'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ Promo Codes ═══ */}
            {promos.length > 0 && (
              <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
                <div className={styles['glass-panel-header']}>
                  <h3>Promo Code Effectiveness</h3>
                  <Link to="/admin/promo-codes" className={styles['btn-ghost']} style={{ fontSize: 12 }}>Manage →</Link>
                </div>
                <table className={styles['table-v2']}>
                  <thead>
                    <tr><th>Code</th><th>Type</th><th>Value</th><th>Usage</th><th>Limit</th><th>Orders</th><th>Revenue</th><th>Discount Given</th><th>ROI</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {promos.map(p => {
                      const roi = p.totalDiscount > 0 ? ((p.totalRevenue / p.totalDiscount) - 1) * 100 : 0;
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 700 }}>{p.code}</td>
                          <td>{p.discountType}</td>
                          <td>{p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `AED ${fmt(p.discountValue)}`}</td>
                          <td>{p.usageCount}</td>
                          <td>{p.usageLimit ?? '∞'}</td>
                          <td>{p.orderCount}</td>
                          <td style={{ fontWeight: 600 }}>AED {fmt(p.totalRevenue)}</td>
                          <td style={{ color: 'var(--admin-rose)' }}>AED {fmt(p.totalDiscount)}</td>
                          <td style={{ color: roi > 0 ? 'var(--admin-emerald)' : 'var(--admin-text-muted)' }}>{roi > 0 ? `${roi.toFixed(0)}x` : '—'}</td>
                          <td><span className={`${styles['table-tag']} ${p.isActive ? styles['table-tag-green'] : styles['table-tag-gray']}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                EXTENDED HOLISTIC ANALYTICS — Deep dives across the platform
                ════════════════════════════════════════════════════════════════ */}

            {/* ═══ Refund / Returns Analytics ═══ */}
            <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
              <div className={styles['glass-panel-header']}>
                <h3>Returns & Refunds Deep-Dive</h3>
                <span className={styles['count-chip']}>Rate: {report.refunds.refundRatePercent}%</span>
              </div>
              <div className={styles['glass-panel-body']}>
                <div className={styles['stats-grid']} style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 16 }}>
                  <div className={`${styles['stat-card']} ${styles['stat-card-cyan']}`}><div className={styles['stat-label']}>Total Returns</div><div className={styles['stat-value']} style={{ fontSize: 22 }}>{report.refunds.totalReturns}</div></div>
                  <div className={`${styles['stat-card']} ${styles['stat-card-rose']}`}><div className={styles['stat-label']}>Refunded Amount</div><div className={styles['stat-value']} style={{ fontSize: 22 }}>AED {fmt(report.refunds.totalRefundAmount)}</div></div>
                  <div className={`${styles['stat-card']} ${styles['stat-card-accent']}`}><div className={styles['stat-label']}>Refund Rate</div><div className={styles['stat-value']} style={{ fontSize: 22 }}>{report.refunds.refundRatePercent}%</div></div>
                  <div className={`${styles['stat-card']} ${styles['stat-card-emerald']}`}><div className={styles['stat-label']}>Avg Process</div><div className={styles['stat-value']} style={{ fontSize: 22 }}>{report.refunds.avgProcessingDays}d</div></div>
                  <div className={`${styles['stat-card']} ${styles['stat-card-violet']}`}><div className={styles['stat-label']}>Refunded Orders</div><div className={styles['stat-value']} style={{ fontSize: 22 }}>{report.refunds.refundedOrdersCount}</div><div className={styles['stat-sub']}>AED {fmt(report.refunds.refundedOrdersValue)}</div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>By Reason</div>
                    {report.refunds.byReason.length === 0 ? <div style={{ color: 'var(--admin-text-muted)' }}>No data</div> : (
                      <table className={styles['table-v2']}>
                        <thead><tr><th>Reason</th><th>Count</th><th>Amount</th></tr></thead>
                        <tbody>
                          {report.refunds.byReason.map(r => (
                            <tr key={r.reason}><td>{r.reason.replace(/_/g, ' ')}</td><td>{r.count}</td><td>AED {fmt(r.amount)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>By Status</div>
                    {report.refunds.byStatus.length === 0 ? <div style={{ color: 'var(--admin-text-muted)' }}>No data</div> : (
                      <table className={styles['table-v2']}>
                        <thead><tr><th>Status</th><th>Count</th><th>Amount</th></tr></thead>
                        <tbody>
                          {report.refunds.byStatus.map(r => (
                            <tr key={r.status}><td>{r.status}</td><td>{r.count}</td><td>AED {fmt(r.amount)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ Inventory Valuation ═══ */}
            <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
              <div className={styles['glass-panel-header']}>
                <h3>Inventory Valuation</h3>
                <span className={styles['count-chip']}>{fmt(report.inventoryValue.productCount)} SKUs</span>
              </div>
              <div className={styles['glass-panel-body']}>
                <div className={styles['stats-grid']} style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
                  <div className={`${styles['stat-card']} ${styles['stat-card-emerald']}`}><div className={styles['stat-label']}>Total Units</div><div className={styles['stat-value']} style={{ fontSize: 22 }}>{fmt(report.inventoryValue.totalUnits)}</div></div>
                  <div className={`${styles['stat-card']} ${styles['stat-card-blue']}`}><div className={styles['stat-label']}>Cost Value</div><div className={styles['stat-value']} style={{ fontSize: 22 }}>AED {fmt(report.inventoryValue.totalCostValue)}</div></div>
                  <div className={`${styles['stat-card']} ${styles['stat-card-accent']}`}><div className={styles['stat-label']}>Retail Value</div><div className={styles['stat-value']} style={{ fontSize: 22 }}>AED {fmt(report.inventoryValue.totalRetailValue)}</div></div>
                  <div className={`${styles['stat-card']} ${styles['stat-card-violet']}`}><div className={styles['stat-label']}>Potential Margin</div><div className={styles['stat-value']} style={{ fontSize: 22 }}>AED {fmt(report.inventoryValue.potentialMargin)}</div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>By Category (Top 10 by Retail Value)</div>
                    <table className={styles['table-v2']}>
                      <thead><tr><th>Category</th><th>Units</th><th>Retail</th></tr></thead>
                      <tbody>
                        {report.inventoryValue.byCategory.slice(0, 10).map(c => (
                          <tr key={c.name}><td>{c.name}</td><td>{fmt(c.units)}</td><td>AED {fmt(c.retail)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>By Brand (Top 10)</div>
                    <table className={styles['table-v2']}>
                      <thead><tr><th>Brand</th><th>Units</th><th>Retail</th></tr></thead>
                      <tbody>
                        {report.inventoryValue.byBrand.slice(0, 10).map(b => (
                          <tr key={b.name}><td>{b.name}</td><td>{fmt(b.units)}</td><td>AED {fmt(b.retail)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Top SKUs by Retail Value</div>
                  <table className={styles['table-v2']}>
                    <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Cost Value</th><th>Retail Value</th></tr></thead>
                    <tbody>
                      {report.inventoryValue.topByValue.slice(0, 15).map(p => (
                        <tr key={p.productId}>
                          <td><Link to={`/admin/products?edit=${p.productId}`} className={styles['table-name']}>{p.name}</Link></td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.sku}</td>
                          <td>{fmt(p.stockQty)}</td>
                          <td>AED {fmt(p.costValue)}</td>
                          <td style={{ fontWeight: 600 }}>AED {fmt(p.retailValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ═══ Catalog Health Scorecard ═══ */}
            <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
              <div className={styles['glass-panel-header']}>
                <h3>Catalog Health Scorecard</h3>
                {(() => {
                  const score = report.catalogHealth.completenessScore;
                  let color = 'var(--admin-rose)';
                  if (score >= 90) color = 'var(--admin-emerald)';
                  else if (score >= 70) color = 'var(--admin-accent)';
                  return <span className={styles['count-chip']} style={{ color }}>Completeness: {score}%</span>;
                })()}
              </div>
              <div className={styles['glass-panel-body']}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Total', value: report.catalogHealth.total },
                    { label: 'Active', value: report.catalogHealth.active },
                    { label: 'Inactive', value: report.catalogHealth.inactive },
                    { label: 'Discontinued', value: report.catalogHealth.discontinued },
                    { label: 'Featured', value: report.catalogHealth.featured },
                    { label: 'New Arrivals', value: report.catalogHealth.isNew },
                    { label: 'Best Sellers', value: report.catalogHealth.bestSeller },
                    { label: 'Issues Count', value: Object.values(report.catalogHealth.issues).reduce((a: number, b) => a + (b as number), 0) },
                  ].map(c => (
                    <div key={c.label} style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(c.value)}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>{c.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Data Quality Issues</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {Object.entries(report.catalogHealth.issues).map(([key, val]) => (
                    <div key={key} style={{ padding: '8px 12px', background: (val as number) > 0 ? 'rgba(244,63,94,0.06)' : 'rgba(16,185,129,0.04)', borderLeft: `3px solid ${(val as number) > 0 ? 'var(--admin-rose)' : 'var(--admin-emerald)'}`, borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--admin-text-dim)' }}>{key.replace(/missing|([A-Z])/g, m => m === 'missing' ? 'Missing' : ' ' + m).trim()}</span>
                      <strong style={{ color: (val as number) > 0 ? 'var(--admin-rose)' : 'var(--admin-emerald)' }}>{fmt(val as number)}</strong>
                    </div>
                  ))}
                </div>
                {report.catalogHealth.missingImagesSample.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Sample: Products Missing Images</div>
                    <table className={styles['table-v2']}>
                      <thead><tr><th>Product</th><th>SKU</th><th>Status</th></tr></thead>
                      <tbody>
                        {report.catalogHealth.missingImagesSample.map(p => (
                          <tr key={p.id}>
                            <td><Link to={`/admin/products?edit=${p.id}`} className={styles['table-name']}>{p.productName}</Link></td>
                            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.sku}</td>
                            <td><span className={`${styles['table-tag']} ${p.isActive ? styles['table-tag-green'] : styles['table-tag-gray']}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ Slow Movers ═══ */}
            {report.slowMovers.items.length > 0 && (
              <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
                <div className={styles['glass-panel-header']}>
                  <h3>Slow Movers (no sales in {report.slowMovers.periodDays}d)</h3>
                  <span className={styles['count-chip']}>{report.slowMovers.slowMoverCount} SKUs · AED {fmt(report.slowMovers.tiedUpValue)} tied up</span>
                </div>
                <table className={styles['table-v2']}>
                  <thead><tr><th>Product</th><th>SKU</th><th>Brand</th><th>Category</th><th>Stock</th><th>Retail Value</th><th>Age</th></tr></thead>
                  <tbody>
                    {report.slowMovers.items.slice(0, 30).map(p => (
                      <tr key={p.productId}>
                        <td><Link to={`/admin/products?edit=${p.productId}`} className={styles['table-name']}>{p.name}</Link></td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.sku}</td>
                        <td>{p.brand ?? '—'}</td>
                        <td>{p.category ?? '—'}</td>
                        <td>{fmt(p.stockQty)}</td>
                        <td style={{ fontWeight: 600 }}>AED {fmt(p.retailValue)}</td>
                        <td style={{ color: 'var(--admin-text-dim)' }}>{p.ageDays}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ═══ Returns by Product ═══ */}
            {report.returnsByProduct.length > 0 && (
              <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
                <div className={styles['glass-panel-header']}>
                  <h3>Returns by Product</h3>
                </div>
                <table className={styles['table-v2']}>
                  <thead><tr><th>Product</th><th>SKU</th><th>Returns</th><th>Returned Qty</th><th>Sold Qty</th><th>Return Rate</th><th>Refunded</th></tr></thead>
                  <tbody>
                    {report.returnsByProduct.map((p, i) => (
                      <tr key={p.productId ?? i}>
                        <td>{p.productId ? <Link to={`/admin/products?edit=${p.productId}`} className={styles['table-name']}>{p.name}</Link> : p.name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.sku}</td>
                        <td>{p.returnCount}</td>
                        <td>{p.returnedQty}</td>
                        <td>{p.soldQty}</td>
                        <td style={{ color: p.returnRatePercent > 10 ? 'var(--admin-rose)' : 'var(--admin-text)' }}>{p.returnRatePercent}%</td>
                        <td>AED {fmt(p.refundedAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ═══ Revenue by Brand + Subcategory Performance ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {report.revenueByBrand.length > 0 && (
                <div className={styles['glass-panel']}>
                  <div className={styles['glass-panel-header']}><h3>Revenue by Brand</h3></div>
                  <div className={styles['glass-panel-body']}>
                    {(() => {
                      const max = Math.max(...report.revenueByBrand.map(b => b.revenue), 1);
                      return report.revenueByBrand.map(b => (
                        <div key={b.brandId} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span>{b.name}</span>
                            <span><strong>AED {fmt(b.revenue)}</strong> · {b.qty} units</span>
                          </div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${(b.revenue / max) * 100}%`, height: '100%', background: 'var(--admin-cyan)' }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
              {report.subcategoryPerformance.length > 0 && (
                <div className={styles['glass-panel']}>
                  <div className={styles['glass-panel-header']}><h3>Subcategory Performance</h3></div>
                  <div className={styles['glass-panel-body']}>
                    <table className={styles['table-v2']}>
                      <thead><tr><th>Subcategory</th><th>Category</th><th>Revenue</th><th>Qty</th></tr></thead>
                      <tbody>
                        {report.subcategoryPerformance.slice(0, 15).map(s => (
                          <tr key={s.subcategoryId}>
                            <td style={{ fontWeight: 600 }}>{s.name}</td>
                            <td style={{ color: 'var(--admin-text-dim)', fontSize: 12 }}>{s.category}</td>
                            <td>AED {fmt(s.revenue)}</td>
                            <td>{s.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* ═══ Fulfillment SLA ═══ */}
            <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
              <div className={styles['glass-panel-header']}>
                <h3>Fulfillment SLA</h3>
                <span className={styles['count-chip']}>{report.fulfillment.ordersAnalyzed} orders analyzed</span>
              </div>
              <div className={styles['glass-panel-body']}>
                <div className={styles['stats-grid']} style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                  <div className={`${styles['stat-card']} ${styles['stat-card-blue']}`}>
                    <div className={styles['stat-label']}>Order → Ship</div>
                    <div className={styles['stat-value']} style={{ fontSize: 22 }}>{report.fulfillment.avgOrderToShipDays}d <span style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>avg</span></div>
                    <div className={styles['stat-sub']}>Median: {report.fulfillment.medianOrderToShipDays}d</div>
                  </div>
                  <div className={`${styles['stat-card']} ${styles['stat-card-emerald']}`}>
                    <div className={styles['stat-label']}>Ship → Deliver</div>
                    <div className={styles['stat-value']} style={{ fontSize: 22 }}>{report.fulfillment.avgShipToDeliverDays}d <span style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>avg</span></div>
                    <div className={styles['stat-sub']}>Median: {report.fulfillment.medianShipToDeliverDays}d</div>
                  </div>
                  <div className={`${styles['stat-card']} ${styles['stat-card-cyan']}`}>
                    <div className={styles['stat-label']}>End-to-End</div>
                    <div className={styles['stat-value']} style={{ fontSize: 22 }}>{report.fulfillment.avgEndToEndDays}d</div>
                    <div className={styles['stat-sub']}>{report.fulfillment.deliveredCount} delivered</div>
                  </div>
                  <div className={`${styles['stat-card']} ${styles['stat-card-violet']}`}>
                    <div className={styles['stat-label']}>Shipped Speed</div>
                    <div className={styles['stat-value']} style={{ fontSize: 22 }}>{report.fulfillment.shippedWithin24h}<span style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}> in 24h</span></div>
                    <div className={styles['stat-sub']}>{report.fulfillment.shippedWithin48h} within 48h</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ Loyalty Program Health ═══ */}
            <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
              <div className={styles['glass-panel-header']}>
                <h3>Loyalty Program Health</h3>
                <span className={styles['count-chip']}>Enrolment: {report.loyalty.enrollmentRatePercent}%</span>
              </div>
              <div className={styles['glass-panel-body']}>
                <div className={styles['stats-grid']} style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
                  <div className={`${styles['stat-card']} ${styles['stat-card-cyan']}`}><div className={styles['stat-label']}>Wallets</div><div className={styles['stat-value']} style={{ fontSize: 22 }}>{fmt(report.loyalty.totalWallets)}</div></div>
                  <div className={`${styles['stat-card']} ${styles['stat-card-emerald']}`}><div className={styles['stat-label']}>Total Earned</div><div className={styles['stat-value']} style={{ fontSize: 22 }}>AED {fmt(report.loyalty.totalEverEarned)}</div></div>
                  <div className={`${styles['stat-card']} ${styles['stat-card-rose']}`}><div className={styles['stat-label']}>Total Redeemed</div><div className={styles['stat-value']} style={{ fontSize: 22 }}>AED {fmt(report.loyalty.totalEverRedeemed)}</div></div>
                  <div className={`${styles['stat-card']} ${styles['stat-card-accent']}`}><div className={styles['stat-label']}>In Circulation</div><div className={styles['stat-value']} style={{ fontSize: 22 }}>AED {fmt(report.loyalty.totalBalanceInCirculation)}</div><div className={styles['stat-sub']}>{report.loyalty.redemptionRatePercent}% redemption</div></div>
                </div>
                {report.loyalty.topEarners.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Top Earners</div>
                    <table className={styles['table-v2']}>
                      <thead><tr><th>Customer</th><th>Email</th><th>Balance</th><th>Earned</th><th>Redeemed</th></tr></thead>
                      <tbody>
                        {report.loyalty.topEarners.map(e => (
                          <tr key={e.email}>
                            <td>{e.name}</td>
                            <td style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>{e.email}</td>
                            <td style={{ fontWeight: 600 }}>AED {fmt(e.balance)}</td>
                            <td>AED {fmt(e.totalEarned)}</td>
                            <td>AED {fmt(e.totalRedeemed)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ Signup Funnel + Repeat Rate ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
              <div className={styles['glass-panel']}>
                <div className={styles['glass-panel-header']}>
                  <h3>Signup → Purchase Funnel ({report.signupFunnel.periodDays}d)</h3>
                  <span className={styles['count-chip']}>Conversion: {report.signupFunnel.conversionRatePercent}%</span>
                </div>
                <div className={styles['glass-panel-body']}>
                  {(() => {
                    const max = Math.max(...report.signupFunnel.funnel.map(s => s.count), 1);
                    return report.signupFunnel.funnel.map(s => (
                      <div key={s.stage} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span>{s.stage}</span>
                          <strong>{s.count}</strong>
                        </div>
                        <div style={{ height: 18, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${(s.count / max) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--admin-cyan), var(--admin-violet))' }} />
                        </div>
                      </div>
                    ));
                  })()}
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--admin-text-dim)' }}>
                    Avg days to first purchase: <strong style={{ color: 'var(--admin-text)' }}>{report.signupFunnel.avgDaysToFirstPurchase}d</strong>
                  </div>
                </div>
              </div>
              <div className={styles['glass-panel']}>
                <div className={styles['glass-panel-header']}>
                  <h3>Repeat Buyer Rate</h3>
                </div>
                <div className={styles['glass-panel-body']} style={{ textAlign: 'center', padding: 24 }}>
                  <div style={{ fontSize: 56, fontWeight: 700, color: 'var(--admin-violet)', lineHeight: 1 }}>{report.repeatRate.repeatRatePercent}%</div>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-dim)', marginTop: 8 }}>{report.repeatRate.repeatBuyers} of {report.repeatRate.uniqueBuyers} buyers</div>
                  <div style={{ marginTop: 16, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{report.repeatRate.avgOrdersPerBuyer}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>Avg orders per buyer</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ Bulk Orders + Invoice Activity + Failed Payments ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div className={styles['glass-panel']}>
                <div className={styles['glass-panel-header']}>
                  <h3>Bulk Order Requests</h3>
                  <span className={styles['count-chip']}>{report.bulkOrders.total}</span>
                </div>
                <div className={styles['glass-panel-body']}>
                  {report.bulkOrders.byStatus.map(s => (
                    <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                      <span>{s.status}</span>
                      <strong>{s.count}</strong>
                    </div>
                  ))}
                  {report.bulkOrders.recent.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Recent</div>
                      {report.bulkOrders.recent.slice(0, 5).map(b => (
                        <div key={b.id} style={{ padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
                          <div style={{ fontWeight: 600 }}>{b.name}</div>
                          <div style={{ color: 'var(--admin-text-dim)' }}>{b.lineCount} lines · {b.totalQuantity} units · {b.status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles['glass-panel']}>
                <div className={styles['glass-panel-header']}>
                  <h3>Invoice Activity</h3>
                  <span className={styles['count-chip']}>{report.invoices.issuedCount} issued</span>
                </div>
                <div className={styles['glass-panel-body']}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                    <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>Total Invoiced (incl. VAT)</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>AED {fmt(report.invoices.totalInvoicedInclVat)}</div>
                    </div>
                    <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>VAT Collected</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>AED {fmt(report.invoices.totalVatInvoiced)}</div>
                    </div>
                    {report.invoices.missingPdfCount > 0 && (
                      <div style={{ padding: 10, background: 'rgba(244,63,94,0.08)', borderRadius: 6, borderLeft: '3px solid var(--admin-rose)' }}>
                        <div style={{ fontSize: 11, color: 'var(--admin-rose)' }}>Missing PDFs</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-rose)' }}>{report.invoices.missingPdfCount}</div>
                      </div>
                    )}
                  </div>
                  {report.invoices.byStatus.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      {report.invoices.byStatus.map(s => (
                        <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                          <span>{s.status}</span><strong>{s.count}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles['glass-panel']}>
                <div className={styles['glass-panel-header']}>
                  <h3>Failed Payments</h3>
                  <span className={styles['count-chip']} style={{ color: report.failedPayments.failureRatePercent > 5 ? 'var(--admin-rose)' : undefined }}>{report.failedPayments.failureRatePercent}%</span>
                </div>
                <div className={styles['glass-panel-body']}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div style={{ padding: 10, background: 'rgba(244,63,94,0.06)', borderRadius: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--admin-rose)' }}>{report.failedPayments.failedCount}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>Failed</div>
                    </div>
                    <div style={{ padding: 10, background: 'rgba(244,63,94,0.06)', borderRadius: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--admin-rose)' }}>AED {fmt(report.failedPayments.totalLostRevenue)}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-dim)' }}>Lost</div>
                    </div>
                  </div>
                  {report.failedPayments.byMethod.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>By Method</div>
                      {report.failedPayments.byMethod.map(m => (
                        <div key={m.method} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                          <span>{m.method}</span><strong>{m.count}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ Order Pipeline (daily by status) ═══ */}
            {(() => {
              const activeDays = report.orderPipeline.filter(d =>
                Object.keys(d).some(k => k !== 'date' && Number(d[k]) > 0)
              );
              const statusKeys = Array.from(
                new Set(activeDays.flatMap(d => Object.keys(d).filter(k => k !== 'date')))
              ).sort((a, b) => a.localeCompare(b));
              const rows = activeDays.slice(-30);
              const totals: Record<string, number> = {};
              for (const d of activeDays) {
                for (const k of statusKeys) totals[k] = (totals[k] || 0) + (Number(d[k]) || 0);
              }
              const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
              return (
                <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
                  <div className={styles['glass-panel-header']}>
                    <h3>Order Pipeline (daily by status)</h3>
                    <span className={styles['count-chip']}>
                      {activeDays.length} active day{activeDays.length === 1 ? '' : 's'} · {grandTotal} order{grandTotal === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className={styles['glass-panel-body']} style={{ overflowX: 'auto' }}>
                    {rows.length === 0 ? (
                      <p style={{ color: '#888', margin: 0 }}>No orders in the selected period.</p>
                    ) : (
                      <table className={styles['table-v2']}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            {statusKeys.map(k => <th key={k}>{k}</th>)}
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map(d => {
                            const dayTotal = statusKeys.reduce((s, k) => s + (Number(d[k]) || 0), 0);
                            return (
                              <tr key={d.date}>
                                <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{d.date}</td>
                                {statusKeys.map(k => (
                                  <td key={k}>{(Number(d[k]) || 0) || '—'}</td>
                                ))}
                                <td style={{ fontWeight: 600 }}>{dayTotal}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <th>Total</th>
                            {statusKeys.map(k => <th key={k}>{totals[k] || 0}</th>)}
                            <th>{grandTotal}</th>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                    {activeDays.length > 30 && (
                      <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
                        Showing the most recent 30 active days out of {activeDays.length}.
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ═══ Featured / New / Best Seller Performance ═══ */}
            <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
              <div className={styles['glass-panel-header']}>
                <h3>Featured / New / Best Seller Performance</h3>
                <span className={styles['count-chip']}>Total: AED {fmt(report.featuredPerformance.totalRevenue)}</span>
              </div>
              <div className={styles['glass-panel-body']}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                  {[
                    { key: 'featured', label: 'Featured', data: report.featuredPerformance.featured, color: 'var(--admin-accent)' },
                    { key: 'isNew', label: 'New Arrivals', data: report.featuredPerformance.isNew, color: 'var(--admin-cyan)' },
                    { key: 'bestSeller', label: 'Best Sellers', data: report.featuredPerformance.bestSeller, color: 'var(--admin-emerald)' },
                  ].map(b => (
                    <div key={b.key} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderTop: `3px solid ${b.color}`, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{b.label}</div>
                      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>AED {fmt(b.data.revenue)}</div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-dim)', marginTop: 4 }}>{fmt(b.data.qty)} units · <strong style={{ color: b.color }}>{b.data.sharePercent}%</strong> of revenue</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </>
  );
}
