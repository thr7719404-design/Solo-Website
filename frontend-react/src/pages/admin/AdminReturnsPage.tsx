import { useEffect, useState } from 'react';
import { adminReturnsApi, type ReturnDto, type ReturnStatsDto, type AdminUpdateReturnRequest } from '@/api/returns';

const STATUSES = ['ALL', 'REQUESTED', 'APPROVED', 'ITEMS_RECEIVED', 'REFUND_PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'];
const STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#f59e0b',
  APPROVED: '#3b82f6',
  REJECTED: '#ef4444',
  ITEMS_RECEIVED: '#8b5cf6',
  REFUND_PROCESSING: '#6366f1',
  COMPLETED: '#16a34a',
  CANCELLED: '#9ca3af',
};

const NEXT_STATUSES: Record<string, string[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['ITEMS_RECEIVED', 'CANCELLED'],
  ITEMS_RECEIVED: ['REFUND_PROCESSING'],
  REFUND_PROCESSING: ['COMPLETED'],
};

const REFUND_METHODS = [
  { value: 'ORIGINAL_PAYMENT', label: 'Original Payment Method' },
  { value: 'LOYALTY_CASH', label: 'Loyalty Cash' },
  { value: 'STORE_CREDIT', label: 'Store Credit' },
];

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnDto[]>([]);
  const [stats, setStats] = useState<ReturnStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<ReturnDto | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState<AdminUpdateReturnRequest>({ status: '' });

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;
      const result = await adminReturnsApi.getAll(params as any);
      setReturns(result.data);
      setTotalPages(result.meta.totalPages);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStats(await adminReturnsApi.getStats());
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchReturns(); }, [statusFilter, page]);
  useEffect(() => { fetchStats(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReturns();
  };

  const openDetail = async (id: string) => {
    try {
      const detail = await adminReturnsApi.getById(id);
      setSelected(detail);
      const nextStatuses = NEXT_STATUSES[detail.status] ?? [];
      setUpdateForm({
        status: nextStatuses[0] ?? '',
        adminNotes: detail.adminNotes ?? '',
        refundMethod: detail.refundMethod ?? 'ORIGINAL_PAYMENT',
        refundAmount: Number(detail.refundAmount),
      });
    } catch {
      alert('Failed to load return details');
    }
  };

  const handleUpdate = async () => {
    if (!selected || !updateForm.status) return;
    setUpdating(true);
    try {
      const updated = await adminReturnsApi.update(selected.id, updateForm);
      setSelected(updated);
      setReturns(prev => prev.map(r => r.id === updated.id ? updated : r));
      fetchStats();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(Array.isArray(msg) ? msg[0] : (msg || 'Failed to update'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Returns Management</h1>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Pending', value: stats.requested, color: '#f59e0b' },
            { label: 'Approved', value: stats.approved, color: '#3b82f6' },
            { label: 'Processing', value: stats.processing, color: '#8b5cf6' },
            { label: 'Completed', value: stats.completed, color: '#16a34a' },
            { label: 'Total', value: stats.total, color: '#374151' },
          ].map(s => (
            <div key={s.label} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: statusFilter === s ? 700 : 400,
                border: `1px solid ${statusFilter === s ? '#B8860B' : '#e5e7eb'}`,
                borderRadius: 20,
                background: statusFilter === s ? '#B8860B' : '#fff',
                color: statusFilter === s ? '#fff' : '#374151',
                cursor: 'pointer',
              }}
            >
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search RMA #, order #, email..."
            style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, width: 240 }}
          />
          <button type="submit" className="btn btn-accent" style={{ fontSize: 12, padding: '6px 14px' }}>Search</button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-spinner" style={{ margin: '40px auto' }} />
      ) : returns.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>No returns found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '10px 8px' }}>Return #</th>
              <th style={{ padding: '10px 8px' }}>Order</th>
              <th style={{ padding: '10px 8px' }}>Customer</th>
              <th style={{ padding: '10px 8px' }}>Items</th>
              <th style={{ padding: '10px 8px' }}>Refund</th>
              <th style={{ padding: '10px 8px' }}>Status</th>
              <th style={{ padding: '10px 8px' }}>Date</th>
              <th style={{ padding: '10px 8px' }}></th>
            </tr>
          </thead>
          <tbody>
            {returns.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{r.returnNumber}</td>
                <td style={{ padding: '10px 8px' }}>#{r.order?.orderNumber ?? '—'}</td>
                <td style={{ padding: '10px 8px' }}>
                  {r.user ? `${r.user.firstName} ${r.user.lastName}` : '—'}
                  {r.user?.email && <div style={{ fontSize: 11, color: '#888' }}>{r.user.email}</div>}
                </td>
                <td style={{ padding: '10px 8px' }}>{r.items.length} item{r.items.length !== 1 ? 's' : ''}</td>
                <td style={{ padding: '10px 8px' }}>${Number(r.refundAmount).toFixed(2)}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 10px',
                    borderRadius: 20,
                    background: `${STATUS_COLORS[r.status] ?? '#888'}18`,
                    color: STATUS_COLORS[r.status] ?? '#888',
                  }}>
                    {r.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', color: '#888' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '10px 8px' }}>
                  <button
                    onClick={() => openDetail(r.id)}
                    style={{ fontSize: 12, color: '#B8860B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 12px', cursor: 'pointer' }}>Prev</button>
          <span style={{ padding: '4px 8px', fontSize: 14 }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 12px', cursor: 'pointer' }}>Next</button>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 640, width: '95%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{selected.returnNumber}</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 16 }}>
              <div><strong>Order:</strong> #{selected.order?.orderNumber}</div>
              <div><strong>Customer:</strong> {selected.user ? `${selected.user.firstName} ${selected.user.lastName} (${selected.user.email})` : '—'}</div>
              <div><strong>Status:</strong> <span style={{ color: STATUS_COLORS[selected.status] }}>{selected.status.replace(/_/g, ' ')}</span></div>
              <div><strong>Reason:</strong> {selected.reason.replace(/_/g, ' ')}</div>
              <div><strong>Refund Amount:</strong> ${Number(selected.refundAmount).toFixed(2)}</div>
              <div><strong>Refund Method:</strong> {(selected.refundMethod ?? 'ORIGINAL_PAYMENT').replace(/_/g, ' ')}</div>
              <div><strong>Submitted:</strong> {new Date(selected.createdAt).toLocaleString()}</div>
              {selected.approvedAt && <div><strong>Approved:</strong> {new Date(selected.approvedAt).toLocaleString()}</div>}
              {selected.receivedAt && <div><strong>Items Received:</strong> {new Date(selected.receivedAt).toLocaleString()}</div>}
              {selected.completedAt && <div><strong>Completed:</strong> {new Date(selected.completedAt).toLocaleString()}</div>}
              {selected.stockRestored && <div><strong>Stock Restored:</strong> Yes</div>}
              {selected.loyaltyDeducted && <div><strong>Loyalty Deducted:</strong> ${Number(selected.loyaltyDeducted).toFixed(2)}</div>}
            </div>

            {selected.customerNotes && (
              <div style={{ marginBottom: 12, fontSize: 13, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                <strong>Customer Notes:</strong> {selected.customerNotes}
              </div>
            )}

            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Return Items</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '6px 4px' }}>Item</th>
                  <th style={{ padding: '6px 4px' }}>SKU</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Unit</th>
                  <th style={{ padding: '6px 4px', textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '6px 4px' }}>{item.name}</td>
                    <td style={{ padding: '6px 4px', color: '#888' }}>{item.sku ?? '—'}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right' }}>${Number(item.unitPrice).toFixed(2)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600 }}>${Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Update form */}
            {(NEXT_STATUSES[selected.status] ?? []).length > 0 && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, background: '#fffbeb' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Update Status</h3>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>New Status</label>
                  <select
                    value={updateForm.status}
                    onChange={e => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6 }}
                  >
                    {(NEXT_STATUSES[selected.status] ?? []).map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                {(updateForm.status === 'COMPLETED' || updateForm.status === 'REFUND_PROCESSING') && (
                  <>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Refund Method</label>
                      <select
                        value={updateForm.refundMethod}
                        onChange={e => setUpdateForm(prev => ({ ...prev, refundMethod: e.target.value }))}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6 }}
                      >
                        {REFUND_METHODS.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Refund Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={updateForm.refundAmount ?? ''}
                        onChange={e => setUpdateForm(prev => ({ ...prev, refundAmount: Number(e.target.value) }))}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6 }}
                      />
                    </div>
                  </>
                )}

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Admin Notes</label>
                  <textarea
                    value={updateForm.adminNotes ?? ''}
                    onChange={e => setUpdateForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                    rows={2}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, resize: 'vertical' }}
                  />
                </div>

                <button className="btn btn-accent" onClick={handleUpdate} disabled={updating} style={{ fontSize: 13 }}>
                  {updating ? 'Updating…' : `Update to ${updateForm.status.replace(/_/g, ' ')}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
