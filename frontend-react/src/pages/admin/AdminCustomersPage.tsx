import { useState, useEffect } from 'react';
import { customersApi } from '@/api/customers';
import type { CustomerDetailsDto } from '@/types';
import styles from './Admin.module.css';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CustomerDetailsDto | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const limit = 15;

  const load = () => {
    customersApi.getCustomers({ page, limit, search: search || undefined, includeInactive: statusFilter !== 'active' })
      .then(r => {
        let rows = r.data ?? [];
        if (statusFilter === 'inactive') rows = rows.filter((c: any) => c.isActive === false);
        setCustomers(rows);
        setTotal(statusFilter === 'inactive' ? rows.length : (r.total ?? 0));
      })
      .catch(() => {});
  };
  useEffect(load, [page, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const create = async () => {
    setSaving(true);
    try {
      await customersApi.createCustomer(form);
      setShowModal(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', phone: '' });
      load();
    } catch { /* */ }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Deactivate this customer? They will no longer be able to log in, but their account and data will be preserved. You can reactivate them later from the "Inactive" filter.')) return;
    await customersApi.deleteCustomer(id).catch(() => {});
    load();
  };

  const reactivate = async (id: string) => {
    if (!confirm('Reactivate this customer? They will be able to log in again.')) return;
    try {
      await customersApi.updateCustomer(id, { isActive: true } as any);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to reactivate');
    }
  };

  const openProfile = async (id: string) => {
    setProfileLoading(true);
    setProfile({ id } as any);
    try {
      const detail = await customersApi.getCustomer(id);
      setProfile(detail);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to load customer profile');
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const formatAed = (n?: number | null) =>
    `AED ${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Customers</h1>
          <span className={styles['header-v2-sub']}>View and manage customer accounts</span>
        </div>
        <button className={styles['btn-primary']} onClick={() => setShowModal(true)}>+ Add Customer</button>
      </div>
      <div className={styles['admin-body']}>

        {/* Toolbar */}
        <div className={styles['toolbar-v2']}>
          <div className={styles['search-box']}>
            <span className={styles['search-icon']}>🔍</span>
            <input placeholder="Search customers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--admin-text-dim)' }}>
            <span>Status:</span>
            <div style={{ display: 'inline-flex', border: '1px solid var(--admin-border)', borderRadius: 6, overflow: 'hidden' }}>
              {(['active', 'inactive', 'all'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setStatusFilter(opt); setPage(1); }}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    border: 'none',
                    cursor: 'pointer',
                    background: statusFilter === opt ? 'var(--admin-accent, #2563eb)' : 'transparent',
                    color: statusFilter === opt ? '#fff' : 'var(--admin-text-dim)',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </label>
          <span className={styles['count-chip']}>{total} customers</span>
        </div>

        {/* Table */}
        <div className={styles['table-v2-wrap']}>
          <table className={styles['table-v2']}>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>City</th><th>Orders</th><th>Loyalty</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No customers found</td></tr>
              ) : (
                customers.map(c => {
                  // Backend returns computed `status` (ACTIVE/UNVERIFIED/INACTIVE).
                  // Fall back to flag-based derivation for older payloads.
                  const status: string = (c as any).status
                    ?? (c.isActive === false ? 'INACTIVE'
                      : (c as any).emailVerified === false ? 'UNVERIFIED'
                      : 'ACTIVE');
                  const badge =
                    status === 'INACTIVE' ? { bg: '#fde2e2', fg: '#a02020', label: 'INACTIVE' } :
                    status === 'UNVERIFIED' ? { bg: '#fef3c7', fg: '#92400e', label: 'UNVERIFIED' } :
                    null;
                  const loyaltyAmount = Number(c.loyaltyBalanceAed ?? 0);
                  return (
                  <tr key={c.id} style={status !== 'ACTIVE' ? { opacity: 0.7 } : undefined}>
                    <td>
                      <div className={styles['table-name']}>
                        <button
                          type="button"
                          onClick={() => openProfile(c.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            font: 'inherit',
                            color: 'var(--admin-accent, #2563eb)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            textUnderlineOffset: 2,
                          }}
                          title="View full profile"
                        >
                          {c.firstName} {c.lastName}
                        </button>
                        {badge && (
                          <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 6px', borderRadius: 4, background: badge.bg, color: badge.fg, fontWeight: 600 }}>{badge.label}</span>
                        )}
                      </div>
                      <div className={styles['table-sub']}>{c.role ?? 'customer'}</div>
                    </td>
                    <td style={{ color: 'var(--admin-cyan)' }}>{c.email}</td>
                    <td>{c.phone ?? '—'}</td>
                    <td>{c.defaultCity ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{c.orderCount ?? 0}</td>
                    <td style={{ fontWeight: 600, color: loyaltyAmount > 0 ? '#B8860B' : 'var(--admin-text-muted)' }}>
                      {formatAed(loyaltyAmount)}
                    </td>
                    <td style={{ color: 'var(--admin-text-dim)' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles['table-actions']} style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {c.isActive === false ? (
                          <button
                            onClick={() => reactivate(c.id)}
                            title="Reactivate customer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '6px 12px', fontSize: 12, fontWeight: 600,
                              borderRadius: 6, border: '1px solid #16a34a',
                              background: '#dcfce7', color: '#15803d', cursor: 'pointer',
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
                              <path d="M21 3v5h-5" />
                              <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
                              <path d="M3 21v-5h5" />
                            </svg>
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => remove(c.id)}
                            title="Deactivate customer (soft-delete)"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '6px 12px', fontSize: 12, fontWeight: 600,
                              borderRadius: 6, border: '1px solid #dc2626',
                              background: '#fee2e2', color: '#b91c1c', cursor: 'pointer',
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="9" />
                              <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
                            </svg>
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles['pagination']}>
            <button className={styles['page-btn']} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>← Prev</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <button key={p} className={`${styles['page-btn']} ${p === page ? styles['page-btn-active'] : ''}`} onClick={() => setPage(p)}>{p}</button>
              );
            })}
            <button className={styles['page-btn']} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next →</button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <>
          <button type="button" aria-label="Close" className={styles['modal-backdrop']} onClick={() => setShowModal(false)} />
          <div className={styles['modal']}>
            <div className={styles['modal-header']}>
              <h2>Add Customer</h2>
              <button className={styles['modal-close']} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              <div className={styles['field-row']}>
                <div className={styles['field']}>
                  <label htmlFor="first-name">First Name</label>
                  <input id="first-name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="last-name">Last Name</label>
                  <input id="last-name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div className={styles['field']}>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className={styles['field']}>
                <label htmlFor="password">Password</label>
                <input id="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className={styles['field']}>
                <label htmlFor="phone">Phone</label>
                <input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button className={styles['btn-secondary']} onClick={() => setShowModal(false)}>Cancel</button>
                <button className={styles['btn-primary']} disabled={saving || !form.email} onClick={create}>
                  {saving ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Profile Modal */}
      {profile && (
        <>
          <button type="button" aria-label="Close" className={styles['modal-backdrop']} onClick={() => setProfile(null)} />
          <div
            className={styles['modal']}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1001,
              maxWidth: 720,
              width: '92%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className={styles['modal-header']}>
              <h2>
                {profileLoading
                  ? 'Loading…'
                  : `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || profile.email || 'Customer'}
              </h2>
              <button className={styles['modal-close']} onClick={() => setProfile(null)}>✕</button>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', flex: 1, minHeight: 0 }}>
              {profileLoading ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                  Loading profile…
                </div>
              ) : (
                <>
                  {/* Contact */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginBottom: 2 }}>Email</div>
                      <div style={{ color: 'var(--admin-cyan)' }}>{profile.email}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginBottom: 2 }}>Phone</div>
                      <div>{profile.phone ?? '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginBottom: 2 }}>Status</div>
                      <div>{profile.status ?? (profile.isActive ? 'ACTIVE' : 'INACTIVE')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginBottom: 2 }}>Joined</div>
                      <div>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</div>
                    </div>
                  </div>

                  {/* Loyalty card */}
                  <div style={{
                    border: '1px solid var(--admin-border, #e5e7eb)',
                    borderRadius: 8,
                    padding: 14,
                    marginBottom: 20,
                    background: 'linear-gradient(135deg, #fffbe6 0%, #fff 100%)',
                  }}>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#92400e', marginBottom: 8, fontWeight: 600 }}>
                      Loyalty Wallet
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Available</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#B8860B' }}>
                          {formatAed(profile.loyalty?.balanceAed)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Pending</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#c27c0e' }}>
                          {formatAed(profile.loyalty?.pendingBalanceAed)}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', marginTop: 2 }}>awaiting delivery</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Total earned</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{formatAed(profile.loyalty?.totalEarnedAed)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Total redeemed</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{formatAed(profile.loyalty?.totalRedeemedAed)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginBottom: 8 }}>
                      Shipping Addresses ({profile.addresses?.length ?? 0})
                    </h3>
                    {!profile.addresses?.length ? (
                      <div style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>No saved addresses.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: 10 }}>
                        {profile.addresses.map(a => (
                          <div key={a.id} style={{
                            border: '1px solid var(--admin-border, #e5e7eb)',
                            borderRadius: 6,
                            padding: 10,
                            background: a.isDefault ? '#f0f9ff' : 'transparent',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                              <strong>{a.label ?? 'Address'}</strong>
                              {a.isDefault && (
                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#0369a1', color: '#fff', fontWeight: 600 }}>DEFAULT</span>
                              )}
                            </div>
                            <div style={{ fontSize: 13 }}>
                              {a.firstName} {a.lastName}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--admin-text-dim)' }}>
                              {a.addressLine1}
                              {a.addressLine2 ? `, ${a.addressLine2}` : ''}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--admin-text-dim)' }}>
                              {[a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ')}
                            </div>
                            {a.phone && <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>📞 {a.phone}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent orders */}
                  <div>
                    <h3 style={{ fontSize: 14, textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginBottom: 8 }}>
                      Recent Orders ({profile.orders?.length ?? 0})
                    </h3>
                    {!profile.orders?.length ? (
                      <div style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>No orders yet.</div>
                    ) : (
                      <table className={styles['admin-table']} style={{ fontSize: 13 }}>
                        <thead>
                          <tr><th>Order</th><th>Status</th><th>Total</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                          {profile.orders.slice(0, 10).map(o => (
                            <tr key={o.id}>
                              <td>{o.orderNumber}</td>
                              <td>{o.status}</td>
                              <td>{formatAed(o.total)}</td>
                              <td style={{ color: 'var(--admin-text-dim)' }}>
                                {new Date(o.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
