import { useState, useEffect } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { accountApi } from '@/api/account';
import { authApi } from '@/api/auth';
import { returnsApi, type ReturnDto, type CreateReturnRequest } from '@/api/returns';
import type { OrderDto, AddressDto, LoyaltyDto } from '@/types';
import styles from './AccountPage.module.css';

type Tab = 'profile' | 'orders' | 'addresses' | 'loyalty' | 'returns' | 'security';

export default function AccountPage() {
  const [params] = useSearchParams();
  const initialTab = (params.get('tab') as Tab) || 'profile';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [returnOrder, setReturnOrder] = useState<OrderDto | null>(null);

  return (
    <div className={styles['account-page']}>
      <h1>My Account</h1>
      <div className={styles['account-layout']}>
        <ul className={styles['account-nav']}>
          {([
            ['profile', 'Profile'],
            ['orders', 'Orders'],
            ['returns', 'Returns'],
            ['addresses', 'Addresses'],
            ['loyalty', 'Loyalty'],
            ['security', 'Security'],
          ] as [Tab, string][]).map(([key, label]) => (
            <li key={key}>
              <button
                className={tab === key ? styles.active : ''}
                onClick={() => setTab(key)}
                style={tab === key ? { color: 'var(--color-accent)', fontWeight: 600 } : {}}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
        <div className={styles['account-content']}>
          {tab === 'profile' && <ProfileTab />}
          {tab === 'orders' && <OrdersTab onRequestReturn={(order) => { setReturnOrder(order); setTab('returns'); }} />}
          {tab === 'addresses' && <AddressesTab />}
          {tab === 'loyalty' && <LoyaltyTab />}
          {tab === 'returns' && <ReturnsTab initialOrder={returnOrder} onClearOrder={() => setReturnOrder(null)} />}
          {tab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

/* ── Profile ── */
function ProfileTab() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      await accountApi.updateProfile({ firstName, lastName });
      setMsg('Profile updated.');
    } catch {
      setMsg('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h2>Profile</h2>
      <div className={styles['profile-form']}>
        <div className={styles['form-group']}>
          <label>First Name</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div className={styles['form-group']}>
          <label>Last Name</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
        <div className={styles['form-group']}>
          <label>Email</label>
          <input value={email} disabled />
        </div>
        {msg && <p style={{ marginBottom: 12, fontSize: 13, color: msg.includes('Failed') ? '#991b1b' : '#065f46' }}>{msg}</p>}
        <button className="btn btn-accent" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </>
  );
}

/* ── Orders ── */
function OrdersTab({ onRequestReturn }: { onRequestReturn: (order: OrderDto) => void }) {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountApi.getOrders().then(r => { setOrders(Array.isArray(r) ? r : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner" />;
  if (orders.length === 0) return <><h2>Orders</h2><p>No orders yet.</p></>;

  return (
    <>
      <h2>Orders</h2>
      <div className={styles['orders-list']}>
        {orders.map(o => (
          <div key={o.id} className={styles['order-card']}>
            <div className={styles['order-card-info']}>
              <h3>Order #{o.orderNumber ?? o.id.slice(0, 8)}</h3>
              <p>{new Date(o.createdAt).toLocaleDateString()} · {o.items?.length ?? 0} items · ${Number(o.total).toFixed(2)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {o.status === 'DELIVERED' && (
                <button
                  className="btn btn-outline"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={() => onRequestReturn(o)}
                >
                  Request Return
                </button>
              )}
              <span className={`${styles['order-status']} ${styles['status-' + (o.status ?? 'pending').toLowerCase()]}`}>
                {o.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Addresses ── */
function AddressesTab() {
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountApi.getAddresses().then(r => { setAddresses(Array.isArray(r) ? r : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const setDefault = async (id: string) => {
    await accountApi.setDefaultAddress(id);
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const remove = async (id: string) => {
    await accountApi.deleteAddress(id);
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <>
      <h2>Addresses</h2>
      {addresses.length === 0 && <p>No addresses saved.</p>}
      <div className={styles['address-grid']}>
        {addresses.map(a => (
          <div key={a.id} className={`${styles['address-card']} ${a.isDefault ? styles.default : ''}`}>
            {a.isDefault && <span className={styles['address-default-badge']}>Default</span>}
            <h4>{a.firstName} {a.lastName}</h4>
            <p>{a.addressLine1}{a.addressLine2 ? ', ' + a.addressLine2 : ''}<br />{a.city}, {a.state} {a.postalCode}<br />{a.country}</p>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              {!a.isDefault && <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => setDefault(a.id)}>Set Default</button>}
              <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 8px', color: '#991b1b' }} onClick={() => remove(a.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Loyalty ── */
function LoyaltyTab() {
  const [loyalty, setLoyalty] = useState<LoyaltyDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountApi.getLoyalty().then(r => { setLoyalty(r); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner" />;
  if (!loyalty) return <><h2>Loyalty</h2><p>Loyalty program not available.</p></>;

  const balance = Number(loyalty.balanceAed ?? 0);
  const totalEarned = Number(loyalty.totalEarnedAed ?? 0);
  const totalRedeemed = Number(loyalty.totalRedeemedAed ?? 0);

  return (
    <>
      <h2>Loyalty Cash</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'linear-gradient(135deg, #D4A843, #B8860B)', color: '#fff', padding: 20, textAlign: 'center', borderRadius: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>AED {balance.toFixed(2)}</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>Available Balance</div>
        </div>
        <div style={{ border: '1px solid var(--color-border)', padding: 20, textAlign: 'center', borderRadius: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>AED {totalEarned.toFixed(2)}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Total Earned</div>
        </div>
        <div style={{ border: '1px solid var(--color-border)', padding: 20, textAlign: 'center', borderRadius: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>AED {totalRedeemed.toFixed(2)}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Total Redeemed</div>
        </div>
      </div>
      {(loyalty.transactions ?? []).length > 0 && (
        <>
          <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Transaction History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '8px 0' }}>Description</th>
                <th style={{ padding: '8px 0' }}>Date</th>
                <th style={{ padding: '8px 0', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loyalty.transactions.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 0' }}>{t.description || t.type}</td>
                  <td style={{ padding: '8px 0', color: '#888' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: t.type === 'EARNED' ? '#16a34a' : t.type === 'REDEEMED' ? '#2563eb' : '#B8860B' }}>
                    {Number(t.amountAed) >= 0 ? '+' : ''}{Number(t.amountAed).toFixed(2)} AED
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

/* ── Returns ── */
const RETURN_REASONS = [
  { value: 'DEFECTIVE', label: 'Defective / Not Working' },
  { value: 'WRONG_ITEM', label: 'Wrong Item Received' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not As Described' },
  { value: 'CHANGED_MIND', label: 'Changed My Mind' },
  { value: 'ARRIVED_LATE', label: 'Arrived Late' },
  { value: 'DAMAGED_IN_SHIPPING', label: 'Damaged in Shipping' },
  { value: 'OTHER', label: 'Other' },
];

const RETURN_STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#f59e0b',
  APPROVED: '#3b82f6',
  REJECTED: '#ef4444',
  ITEMS_RECEIVED: '#8b5cf6',
  REFUND_PROCESSING: '#6366f1',
  COMPLETED: '#16a34a',
  CANCELLED: '#9ca3af',
};

function ReturnsTab({ initialOrder, onClearOrder }: { initialOrder: OrderDto | null; onClearOrder: () => void }) {
  const [returns, setReturns] = useState<ReturnDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(!!initialOrder);
  const [formOrder, setFormOrder] = useState<OrderDto | null>(initialOrder);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrder?.id ?? '');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    returnsApi.getAll().then(setReturns).finally(() => setLoading(false));
    accountApi.getOrders().then(r => setOrders((Array.isArray(r) ? r : []).filter((o: OrderDto) => o.status === 'DELIVERED')));
  }, []);

  useEffect(() => {
    if (initialOrder) {
      setShowForm(true);
      setFormOrder(initialOrder);
      setSelectedOrderId(initialOrder.id);
      // Pre-select all items
      const items: Record<string, number> = {};
      initialOrder.items?.forEach((it) => { items[it.id] = it.quantity; });
      setSelectedItems(items);
    }
  }, [initialOrder]);

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find(o => o.id === orderId) ?? null;
    setFormOrder(order);
    if (order) {
      const items: Record<string, number> = {};
      order.items?.forEach((it) => { items[it.id] = it.quantity; });
      setSelectedItems(items);
    } else {
      setSelectedItems({});
    }
  };

  const toggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      if (prev[itemId]) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: maxQty };
    });
  };

  const submitReturn = async () => {
    setError('');
    if (!selectedOrderId) { setError('Please select an order'); return; }
    if (!reason) { setError('Please select a reason'); return; }
    const items = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (items.length === 0) { setError('Please select at least one item to return'); return; }

    setSubmitting(true);
    try {
      const created = await returnsApi.create({
        orderId: selectedOrderId,
        reason,
        customerNotes: notes || undefined,
        items,
      });
      setReturns(prev => [created, ...prev]);
      setShowForm(false);
      setFormOrder(null);
      setSelectedOrderId('');
      setReason('');
      setNotes('');
      setSelectedItems({});
      onClearOrder();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg || 'Failed to submit return request'));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelReturn = async (id: string) => {
    if (!confirm('Cancel this return request?')) return;
    try {
      await returnsApi.cancel(id);
      setReturns(prev => prev.map(r => r.id === id ? { ...r, status: 'CANCELLED' } : r));
    } catch {
      alert('Failed to cancel return');
    }
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Returns</h2>
        {!showForm && (
          <button className="btn btn-accent" style={{ fontSize: 13 }} onClick={() => setShowForm(true)}>
            Request a Return
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 20, marginBottom: 24, background: '#fafafa' }}>
          <h3 style={{ marginBottom: 16 }}>New Return Request</h3>

          {!initialOrder && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Select Order</label>
              <select
                value={selectedOrderId}
                onChange={e => handleOrderChange(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}
              >
                <option value="">— Choose a delivered order —</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    #{o.orderNumber ?? o.id.slice(0, 8)} — {new Date(o.createdAt).toLocaleDateString()} — ${Number(o.total).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formOrder && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Items to Return</label>
                {formOrder.items?.map(item => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!selectedItems[item.id]}
                      onChange={() => toggleItem(item.id, item.quantity)}
                    />
                    <span style={{ flex: 1 }}>
                      {item.name ?? item.productName} — Qty: {item.quantity} — ${Number(item.price).toFixed(2)} each
                    </span>
                    {selectedItems[item.id] && item.quantity > 1 && (
                      <select
                        value={selectedItems[item.id]}
                        onChange={e => setSelectedItems(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                        style={{ width: 60, padding: '2px 4px', border: '1px solid #ddd', borderRadius: 4 }}
                        onClick={e => e.stopPropagation()}
                      >
                        {Array.from({ length: item.quantity }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    )}
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Reason</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}
                >
                  <option value="">— Select reason —</option>
                  {RETURN_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13 }}>Additional Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, resize: 'vertical' }}
                  placeholder="Describe the issue in more detail..."
                />
              </div>
            </>
          )}

          {error && <p style={{ color: '#991b1b', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-accent" onClick={submitReturn} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Return'}
            </button>
            <button className="btn btn-outline" onClick={() => { setShowForm(false); onClearOrder(); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {returns.length === 0 && !showForm && (
        <p style={{ color: '#888' }}>No return requests yet.</p>
      )}

      {returns.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {returns.map(r => (
            <div key={r.id} style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{r.returnNumber}</span>
                  <span style={{ color: '#888', fontSize: 13, marginLeft: 8 }}>
                    Order #{r.order?.orderNumber ?? r.orderId.slice(0, 8)}
                  </span>
                </div>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: 20,
                  background: `${RETURN_STATUS_COLORS[r.status] ?? '#888'}18`,
                  color: RETURN_STATUS_COLORS[r.status] ?? '#888',
                }}>
                  {r.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
                <span>Reason: {RETURN_REASONS.find(rr => rr.value === r.reason)?.label ?? r.reason}</span>
                <span style={{ marginLeft: 16 }}>Refund: ${Number(r.refundAmount).toFixed(2)}</span>
                <span style={{ marginLeft: 16 }}>Submitted: {new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: 13 }}>
                {r.items.map(item => (
                  <span key={item.id} style={{ display: 'inline-block', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, marginRight: 6, marginTop: 4 }}>
                    {item.name} x{item.quantity}
                  </span>
                ))}
              </div>
              {r.adminNotes && (
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8, fontStyle: 'italic' }}>
                  Admin note: {r.adminNotes}
                </p>
              )}
              {r.status === 'REQUESTED' && (
                <button
                  className="btn btn-outline"
                  style={{ fontSize: 12, padding: '4px 10px', marginTop: 8, color: '#991b1b' }}
                  onClick={() => cancelReturn(r.id)}
                >
                  Cancel Return
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Security ── */
function SecurityTab() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { setMsg('Passwords do not match.'); return; }
    setSaving(true);
    setMsg('');
    try {
      await authApi.changePassword(current, next);
      setMsg('Password changed successfully.');
      setCurrent(''); setNext(''); setConfirm('');
    } catch {
      setMsg('Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h2>Change Password</h2>
      <form onSubmit={submit} className={styles['profile-form']}>
        <div className={styles['form-group']}>
          <label>Current Password</label>
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required />
        </div>
        <div className={styles['form-group']}>
          <label>New Password</label>
          <input type="password" value={next} onChange={e => setNext(e.target.value)} required minLength={8} />
        </div>
        <div className={styles['form-group']}>
          <label>Confirm New Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} />
        </div>
        {msg && <p style={{ marginBottom: 12, fontSize: 13, color: msg.includes('Failed') || msg.includes('match') ? '#991b1b' : '#065f46' }}>{msg}</p>}
        <button className="btn btn-accent" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Change Password'}</button>
      </form>
    </>
  );
}
