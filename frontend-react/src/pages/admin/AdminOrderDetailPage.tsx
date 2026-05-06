import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import { downloadOrderInvoice } from '@/api/invoices';
import styles from './Admin.module.css';

/* ─── Status Pipeline ─── */
const PIPELINE = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;
const PIPELINE_IDX: Record<string, number> = { PENDING: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3 };

const STATUS_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  PENDING:     { label: 'Pending',    icon: '⏳', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  PROCESSING:  { label: 'Processing', icon: '⚙️', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  SHIPPED:     { label: 'Shipped',    icon: '🚚', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  DELIVERED:   { label: 'Delivered',  icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  CANCELLED:   { label: 'Cancelled',  icon: '✕',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  REFUNDED:    { label: 'Refunded',   icon: '↩',  color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingError, setTrackingError] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  const load = () => {
    adminApi.getOrder(id!).then(o => {
      setOrder(o);
      setTrackingNumber(o?.trackingNumber || '');
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const changeStatus = async (status: string) => {
    if (status === 'SHIPPED' && !trackingNumber.trim()) {
      setTrackingError(true);
      toast.error('Tracking number is required to mark as Shipped');
      return;
    }
    setTrackingError(false);
    setUpdating(true);
    try {
      const payload: { status: string; trackingNumber?: string } = { status };
      if (trackingNumber.trim()) payload.trackingNumber = trackingNumber.trim();
      await adminApi.updateOrderStatus(id!, payload);
      toast.success(`Order marked as ${STATUS_META[status]?.label || status}`);
      setConfirmTarget(null);
      load();
    } catch {
      toast.error('Failed to update status');
    }
    setUpdating(false);
  };

  if (loading) return <div className={styles['admin-body']}><div className="loading-spinner" /></div>;
  if (!order) return <div className={styles['admin-body']}><p>Order not found</p></div>;

  const items = order.items ?? [];
  const addr = order.shippingAddress;
  const currentStatus = order.status as string;
  const isCancelled = currentStatus === 'CANCELLED';
  const isRefunded = currentStatus === 'REFUNDED';
  const isTerminal = isCancelled || isRefunded;
  const pipelineIdx = PIPELINE_IDX[currentStatus] ?? -1;

  return (
    <>
      {/* ─── Header ─── */}
      <div className={styles['header-v2']}>
        <div>
          <h1>Order #{order.orderNumber}</h1>
          <span className={styles['header-v2-sub']}>
            <Link to="/admin/orders" className={styles['btn-ghost']} style={{ fontSize: 12 }}>← Back to Orders</Link>
          </span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
        }}>
          <button
            type="button"
            onClick={() => downloadOrderInvoice(order.id, order.orderNumber).catch(() => toast.error('Failed to download invoice'))}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              color: '#fff', background: '#B8860B', border: 'none', cursor: 'pointer',
            }}
          >
            ⬇ Invoice PDF
          </button>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 20, fontSize: 14, fontWeight: 600,
            color: STATUS_META[currentStatus]?.color || '#888',
            background: STATUS_META[currentStatus]?.bg || 'rgba(128,128,128,0.1)',
            border: `1px solid ${STATUS_META[currentStatus]?.color || '#888'}33`,
          }}>
            <span>{STATUS_META[currentStatus]?.icon}</span>
            {STATUS_META[currentStatus]?.label || currentStatus}
          </div>
        </div>
      </div>

      <div className={styles['admin-body']}>
        {/* ═══ Status Flow Stepper ═══ */}
        <div className={styles['glass-panel']} style={{ marginBottom: 20 }}>
          <div className={styles['glass-panel-header']} style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <h3>Order Status Flow</h3>
          </div>
          <div className={styles['glass-panel-body']} style={{ padding: '16px 24px 24px' }}>

            {/* Pipeline visualization */}
            <div style={{ position: 'relative', margin: '8px 0 40px' }}>
              {/* Background track */}
              <div style={{
                position: 'absolute', top: 22, left: 28, right: 28, height: 3,
                background: 'var(--admin-border)', borderRadius: 2,
              }} />
              {/* Progress track */}
              {pipelineIdx > 0 && (
                <div style={{
                  position: 'absolute', top: 22, left: 28, height: 3, borderRadius: 2,
                  width: `calc((100% - 56px) * ${pipelineIdx / (PIPELINE.length - 1)})`,
                  background: STATUS_META[currentStatus]?.color || '#888',
                  transition: 'width 0.4s ease',
                }} />
              )}
              {/* Nodes row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {PIPELINE.map((step, i) => {
                  const meta = STATUS_META[step];
                  const isActive = currentStatus === step;
                  const isPast = pipelineIdx > i;
                  const isClickable = !isTerminal && !isActive;
                  const isSelected = confirmTarget === step;
                  let nodeBg: string;
                  if (isActive) nodeBg = `linear-gradient(135deg, ${meta.color}, ${meta.color}dd)`;
                  else if (isPast) nodeBg = meta.bg;
                  else nodeBg = 'var(--admin-surface-2, var(--admin-surface))';
                  let nodeColor: string;
                  if (isActive) nodeColor = '#fff';
                  else if (isPast) nodeColor = meta.color;
                  else nodeColor = 'var(--admin-text-muted)';
                  let nodeShadow: string;
                  if (isActive) nodeShadow = `0 0 16px ${meta.color}44, 0 4px 10px ${meta.color}33`;
                  else if (isSelected) nodeShadow = `0 0 12px ${meta.color}44`;
                  else nodeShadow = 'none';
                  let labelColor: string;
                  if (isActive || isPast) labelColor = meta.color;
                  else labelColor = 'var(--admin-text-dim)';

                  return (
                    <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 56 }}>
                      <button
                        onClick={() => isClickable ? setConfirmTarget(step) : null}
                        disabled={!isClickable || updating}
                        style={{
                          width: isActive ? 48 : 40, height: isActive ? 48 : 40,
                          borderRadius: '50%', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: isActive ? 20 : 16,
                          cursor: isClickable ? 'pointer' : 'default',
                          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                          background: nodeBg,
                          color: nodeColor,
                          boxShadow: nodeShadow,
                          outline: isSelected ? `2px solid ${meta.color}` : 'none',
                          outlineOffset: 3,
                          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                          opacity: (isTerminal && !isPast && !isActive) ? 0.35 : 1,
                        }}
                        title={isClickable ? `Move to ${meta.label}` : meta.label}
                      >
                        {isPast ? '✓' : meta.icon}
                      </button>
                      <span style={{
                        marginTop: 6, fontSize: 11, fontWeight: isActive ? 700 : 500,
                        whiteSpace: 'nowrap',
                        color: labelColor,
                      }}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tracking number input — only when moving to SHIPPED (mandatory there) */}
            {confirmTarget === 'SHIPPED' && (
              <div style={{
                background: 'var(--admin-surface-2, var(--admin-surface))', borderRadius: 12, padding: 16, marginBottom: 16,
                border: trackingError ? '1px solid #ef4444' : '1px solid var(--admin-border)',
                transition: 'border-color 0.2s',
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#8b5cf6' }}>
                  🚚 Tracking Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={e => { setTrackingNumber(e.target.value); setTrackingError(false); }}
                  placeholder="Enter tracking number (required for shipping)..."
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 14,
                    border: trackingError ? '1px solid #ef4444' : '1px solid var(--admin-border)',
                    borderRadius: 8, background: 'var(--admin-surface)', color: 'var(--admin-text)',
                    outline: 'none', fontFamily: 'inherit', letterSpacing: '0.02em',
                  }}
                />
                {trackingError && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>Tracking number is required to ship this order</p>}
              </div>
            )}

            {/* Confirm action area */}
            {confirmTarget && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                background: STATUS_META[confirmTarget]?.bg || 'var(--admin-surface-2, var(--admin-surface))',
                borderRadius: 12, border: `1px solid ${STATUS_META[confirmTarget]?.color || '#888'}33`,
              }}>
                <span style={{ fontSize: 20 }}>{STATUS_META[confirmTarget]?.icon}</span>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--admin-text)' }}>
                  Move order to <strong style={{ color: STATUS_META[confirmTarget]?.color }}>{STATUS_META[confirmTarget]?.label}</strong>?
                  {PIPELINE_IDX[confirmTarget] !== undefined && pipelineIdx > PIPELINE_IDX[confirmTarget] && (
                    <span style={{ fontSize: 12, color: '#f59e0b', marginLeft: 8 }}>⚠ This will revert to a previous status</span>
                  )}
                </span>
                <button
                  onClick={() => setConfirmTarget(null)}
                  style={{
                    padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                    border: '1px solid var(--admin-border)', background: 'var(--admin-surface)',
                    color: 'var(--admin-text)', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => changeStatus(confirmTarget)}
                  disabled={updating}
                  style={{
                    padding: '8px 20px', fontSize: 13, fontWeight: 700, borderRadius: 8,
                    border: 'none', cursor: updating ? 'not-allowed' : 'pointer',
                    background: `linear-gradient(135deg, ${STATUS_META[confirmTarget]?.color || '#888'}, ${STATUS_META[confirmTarget]?.color || '#888'}cc)`,
                    color: '#fff',
                    boxShadow: `0 2px 8px ${STATUS_META[confirmTarget]?.color || '#888'}44`,
                  }}
                >
                  {updating ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            )}

            {/* Cancel / Refund actions */}
            {!isTerminal && !confirmTarget && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginRight: 4 }}>
                  Update status:
                </span>
                {PIPELINE.filter(s => s !== currentStatus).map(s => {
                  const meta = STATUS_META[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setConfirmTarget(s)}
                      style={{
                        padding: '8px 14px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                        border: `1px solid ${meta.color}55`,
                        background: meta.bg, color: meta.color, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <span>{meta.icon}</span> Mark as {meta.label}
                    </button>
                  );
                })}
                <span style={{ flex: 1 }} />
                <button
                  onClick={() => setConfirmTarget('CANCELLED')}
                  style={{
                    padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                    border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)',
                    color: '#ef4444', cursor: 'pointer',
                  }}
                >
                  ✕ Cancel Order
                </button>
                {currentStatus === 'DELIVERED' && (
                  <button
                    onClick={() => setConfirmTarget('REFUNDED')}
                    style={{
                      padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                      border: '1px solid rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.08)',
                      color: '#f97316', cursor: 'pointer',
                    }}
                  >
                    ↩ Refund Order
                  </button>
                )}
              </div>
            )}

            {/* Terminal state message */}
            {isTerminal && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
                background: STATUS_META[currentStatus]?.bg, borderRadius: 12,
                border: `1px solid ${STATUS_META[currentStatus]?.color}33`,
              }}>
                <span style={{ fontSize: 18 }}>{STATUS_META[currentStatus]?.icon}</span>
                <span style={{ fontSize: 14, color: STATUS_META[currentStatus]?.color, fontWeight: 600 }}>
                  This order has been {STATUS_META[currentStatus]?.label.toLowerCase()}.
                </span>
                <button
                  onClick={() => setConfirmTarget('PENDING')}
                  style={{
                    marginLeft: 'auto', padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                    border: '1px solid var(--admin-border)', background: 'var(--admin-surface)',
                    color: 'var(--admin-text)', cursor: 'pointer',
                  }}
                >
                  Reopen Order
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Detail Grid ═══ */}
        <div className={styles['detail-grid']}>
          {/* Main Column */}
          <div>
            {/* Items */}
            <div className={styles['glass-panel']}>
              <div className={styles['glass-panel-header']}>
                <h3>Items ({items.length})</h3>
              </div>
              <table className={styles['table-v2']}>
                <thead>
                  <tr><th>Product</th><th>SKU</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                  {items.map((it: any) => (
                    <tr key={it.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {it.imageUrl ? <img src={it.imageUrl} alt="" className={styles['table-thumb']} /> : null}
                          <div className={styles['table-name']}>{it.name ?? 'Product'}</div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--admin-text-dim)' }}>{it.sku ?? '—'}</td>
                      <td>{it.quantity}</td>
                      <td>AED {Number(it.unitPrice || it.price || 0).toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>AED {Number(it.subtotal || (it.quantity * Number(it.unitPrice || it.price || 0))).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <div className={styles['detail-sidebar']}>
            {/* Summary */}
            <div className={styles['detail-card']}>
              <h4 style={{ marginBottom: 12, color: 'var(--admin-text)' }}>Summary</h4>
              <div className={styles['detail-row']}>
                <span className={styles['detail-row-label']}>Subtotal (excl. VAT)</span>
                <span>AED {Number(order.subtotalExclVat ?? order.subtotal ?? order.total).toFixed(2)}</span>
              </div>
              {Number(order.vatAmount ?? order.vat ?? 0) > 0 && (
                <div className={styles['detail-row']}>
                  <span className={styles['detail-row-label']}>VAT ({Number(order.vatRateSnapshot || 0.05) * 100}%)</span>
                  <span>AED {Number(order.vatAmount ?? order.vat).toFixed(2)}</span>
                </div>
              )}
              {Number(order.discount ?? 0) > 0 && (
                <div className={styles['detail-row']}>
                  <span className={styles['detail-row-label']}>
                    Discount{order.promoCode ? <> <span style={{ fontFamily: 'inherit', fontSize: 11, background: 'rgba(16,185,129,0.12)', color: 'var(--admin-emerald)', borderRadius: 4, padding: '1px 5px' }}>{order.promoCode}</span></> : ''}
                  </span>
                  <span style={{ color: 'var(--admin-emerald)' }}>- AED {Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              {Number(order.shippingCost ?? 0) > 0 && (
                <div className={styles['detail-row']}>
                  <span className={styles['detail-row-label']}>Shipping</span>
                  <span>AED {Number(order.shippingCost).toFixed(2)}</span>
                </div>
              )}
              <div className={styles['detail-row']} style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 10, fontWeight: 700 }}>
                <span className={styles['detail-row-label']}>Total</span>
                <span style={{ color: 'var(--admin-accent)' }}>AED {Number(order.total).toFixed(2)}</span>
              </div>
              {Number(order.loyaltyEarnAed ?? 0) > 0 && (() => {
                const status = order.loyaltyAwardStatus || (order.status === 'DELIVERED' ? 'AWARDED' : 'PENDING');
                let meta: { label: string; color: string; bg: string };
                if (status === 'AWARDED') {
                  meta = { label: 'Awarded', color: 'var(--admin-emerald)', bg: 'rgba(16,185,129,0.12)' };
                } else if (status === 'REVERSED') {
                  meta = { label: 'Reversed', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
                } else {
                  meta = { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
                }
                return (
                  <div className={styles['detail-row']} style={{ marginTop: 6 }}>
                    <span className={styles['detail-row-label']}>
                      Loyalty Points{' '}
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 10, background: meta.bg, color: meta.color, marginLeft: 4 }}>
                        {meta.label}
                      </span>
                    </span>
                    <span style={{ color: meta.color, fontWeight: 600 }}>
                      {status === 'REVERSED' ? '-' : '+'} AED {Number(order.loyaltyEarnAed).toFixed(2)}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Customer */}
            <div className={styles['detail-card']}>
              <h4 style={{ marginBottom: 12, color: 'var(--admin-text)' }}>Customer</h4>
              <div className={styles['detail-row']}>
                <span className={styles['detail-row-label']}>Name</span>
                <span>{order.customer?.firstName ?? order.user?.firstName} {order.customer?.lastName ?? order.user?.lastName}</span>
              </div>
              <div className={styles['detail-row']}>
                <span className={styles['detail-row-label']}>Email</span>
                <span style={{ color: 'var(--admin-cyan)' }}>{order.customer?.email ?? order.user?.email}</span>
              </div>
            </div>

            {/* Shipping */}
            {addr && (
              <div className={styles['detail-card']}>
                <h4 style={{ marginBottom: 12, color: 'var(--admin-text)' }}>Shipping Address</h4>
                <p style={{ color: 'var(--admin-text-dim)', lineHeight: 1.6, fontSize: 13 }}>
                  {addr.firstName} {addr.lastName}<br />
                  {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                  {addr.city}{addr.postalCode ? `, ${addr.postalCode}` : ''}
                  {addr.phone && <><br />{addr.phone}</>}
                </p>
              </div>
            )}

            {/* Tracking */}
            {order.trackingNumber && (
              <div className={styles['detail-card']}>
                <h4 style={{ marginBottom: 12, color: 'var(--admin-text)' }}>Tracking</h4>
                <div className={styles['detail-row']}>
                  <span className={styles['detail-row-label']}>Number</span>
                  <span style={{ fontFamily: 'inherit', color: 'var(--admin-cyan)' }}>{order.trackingNumber}</span>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className={styles['detail-card']}>
              <h4 style={{ marginBottom: 12, color: 'var(--admin-text)' }}>Timeline</h4>
              <div className={styles['detail-row']}>
                <span className={styles['detail-row-label']}>Created</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div className={styles['detail-row']}>
                <span className={styles['detail-row-label']}>Updated</span>
                <span>{new Date(order.updatedAt).toLocaleString()}</span>
              </div>
              {order.paidAt && (
                <div className={styles['detail-row']}>
                  <span className={styles['detail-row-label']}>Paid</span>
                  <span>{new Date(order.paidAt).toLocaleString()}</span>
                </div>
              )}
              {order.shippedAt && (
                <div className={styles['detail-row']}>
                  <span className={styles['detail-row-label']}>Shipped</span>
                  <span>{new Date(order.shippedAt).toLocaleString()}</span>
                </div>
              )}
              {order.deliveredAt && (
                <div className={styles['detail-row']}>
                  <span className={styles['detail-row-label']}>Delivered</span>
                  <span>{new Date(order.deliveredAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
