import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/api/admin';
import styles from './Admin.module.css';

const ACTION_TAG: Record<string, string> = {
  LOGIN_SUCCESS: 'table-tag-green',
  LOGIN_FAILED: 'table-tag-red',
  PRODUCT_CREATED: 'table-tag-green',
  PRODUCT_UPDATED: 'table-tag-cyan',
  PRODUCT_DELETED: 'table-tag-red',
  ORDER_UPDATED: 'table-tag-violet',
  ORDER_STATUS_CHANGED: 'table-tag-violet',
  PROMO_CODE_CREATED: 'table-tag-green',
  PROMO_CODE_UPDATED: 'table-tag-cyan',
  PROMO_CODE_DELETED: 'table-tag-red',
  BANNER_CREATED: 'table-tag-green',
  BANNER_UPDATED: 'table-tag-cyan',
  BANNER_DELETED: 'table-tag-red',
  CATEGORY_CREATED: 'table-tag-green',
  CATEGORY_UPDATED: 'table-tag-cyan',
  CATEGORY_DELETED: 'table-tag-red',
};

const ACTION_PILLS = [
  { label: 'All Actions', value: '' },
  { label: 'Login', value: 'LOGIN' },
  { label: 'Products', value: 'PRODUCT' },
  { label: 'Orders', value: 'ORDER' },
  { label: 'Banners', value: 'BANNER' },
  { label: 'Categories', value: 'CATEGORY' },
  { label: 'Promo Codes', value: 'PROMO_CODE' },
];

const ENTITY_TYPES = [
  '', 'Product', 'Order', 'PromoCode', 'Banner', 'Category', 'Brand',
  'Customer', 'User', 'Auth', 'Loyalty', 'Shipping', 'Vat', 'CmsPage',
];

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-AE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function formatEntityId(id: string | null): string {
  if (!id) return '\u2014';
  if (id.length <= 8) return id;
  return `${id.slice(0, 8)}\u2026`;
}

function eventCountLabel(loading: boolean, total: number): string {
  if (loading) return 'Loading\u2026';
  return `${total.toLocaleString()} event${total === 1 ? '' : 's'}`;
}

export default function AdminAuditLogPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    userEmail: '',
    action: '',
    entityType: '',
    from: '',
    to: '',
  });

  const LIMIT = 50;

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const fromIso = filters.from ? new Date(filters.from).toISOString() : undefined;
      const toIso = filters.to ? new Date(filters.to).toISOString() : undefined;
      const res = await adminApi.getAuditLogs({
        page: pg,
        limit: LIMIT,
        userEmail: filters.userEmail || undefined,
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
        from: fromIso,
        to: toIso,
      });
      setRows(res.data ?? []);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
      setPage(pg);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to load audit logs';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(1); }, [load]);

  const clearFilters = () => {
    setFilters({ userEmail: '', action: '', entityType: '', from: '', to: '' });
  };

  const hasActiveFilters = !!(filters.userEmail || filters.action || filters.entityType || filters.from || filters.to);

  return (
    <div className={styles['admin-page']}>
      <div className={styles['admin-page-header']}>
        <div>
          <h1 className={styles['admin-page-title']}>Audit Trail</h1>
          <span className={styles['admin-page-subtitle']}>
            {eventCountLabel(loading, total)}
          </span>
        </div>
        <button
          className={styles['btn-ghost']}
          onClick={() => load(page)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          marginBottom: 16, padding: '12px 16px',
          background: 'var(--admin-rose-glow)', border: '1px solid var(--admin-rose)',
          borderRadius: 8, color: 'var(--admin-rose)', fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className={styles['filter-bar']} style={{ gridTemplateColumns: '1fr 1fr 1fr auto', marginBottom: 12 }}>
        {/* Email search */}
        <div className={styles['filter-group']}>
          <span className={styles['filter-label']}>User Email</span>
          <input
            className={styles['filter-input']}
            placeholder="Search by email…"
            value={filters.userEmail}
            onChange={e => setFilters(f => ({ ...f, userEmail: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && load(1)}
          />
        </div>

        {/* Entity type */}
        <div className={styles['filter-group']}>
          <span className={styles['filter-label']}>Entity Type</span>
          <select
            className={styles['filter-select']}
            value={filters.entityType}
            onChange={e => setFilters(f => ({ ...f, entityType: e.target.value }))}
          >
            {ENTITY_TYPES.map(et => (
              <option key={et} value={et}>{et || 'All types'}</option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className={styles['filter-group']}>
          <span className={styles['filter-label']}>Date Range</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="datetime-local"
              className={styles['filter-input']}
              value={filters.from}
              onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
              style={{ flex: 1 }}
            />
            <span style={{ color: 'var(--admin-text-dim)', fontSize: 12, flexShrink: 0 }}>to</span>
            <input
              type="datetime-local"
              className={styles['filter-input']}
              value={filters.to}
              onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
              style={{ flex: 1 }}
            />
          </div>
        </div>

        {/* Clear button */}
        <div className={styles['filter-group']} style={{ justifyContent: 'flex-end' }}>
          <span className={styles['filter-label']}>&nbsp;</span>
          {hasActiveFilters
            ? (
              <button className={styles['filter-clear']} type="button" onClick={clearFilters}>
                ✕ Clear Filters
              </button>
            )
            : (
              <button className={styles['filter-clear']} type="button" disabled style={{ opacity: 0.4, cursor: 'default' }}>
                Clear Filters
              </button>
            )}
        </div>
      </div>

      {/* ── Action pills ── */}
      <div className={styles['filter-pills']} style={{ marginBottom: 20 }}>
        {ACTION_PILLS.map(pill => (
          <button
            key={pill.value}
            type="button"
            className={`${styles['filter-pill']} ${filters.action === pill.value ? styles['filter-pill-active'] : ''}`}
            onClick={() => setFilters(f => ({ ...f, action: pill.value }))}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className={styles['table-wrap']}>
        <table className={styles['admin-table']}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity Type</th>
              <th>Entity ID</th>
              <th>Description</th>
              <th>IP Address</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading…</td>
              </tr>
            )}
            {!loading && rows.length === 0 && !error && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-text-dim)' }}>
                  No audit events found.
                </td>
              </tr>
            )}
            {!loading && rows.map(row => (
              <>
                <tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{fmt(row.createdAt)}</td>
                  <td style={{ fontSize: '0.85rem' }}>{row.userEmail ?? <span style={{ color: 'var(--admin-text-dim)' }}>—</span>}</td>
                  <td>
                    <span className={`${styles['table-tag']} ${styles[ACTION_TAG[row.action] ?? 'table-tag-amber']}`}>
                      {row.action}
                    </span>
                  </td>
                  <td>{row.entityType ?? '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {formatEntityId(row.entityId)}
                  </td>
                  <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.description ?? '—'}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.ipAddress ?? '—'}</td>
                  <td>
                    <button
                      className={styles['btn-ghost']}
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      onClick={e => { e.stopPropagation(); setExpandedId(expandedId === row.id ? null : row.id); }}
                    >
                      {expandedId === row.id ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
                {expandedId === row.id && (
                  <tr key={`${row.id}-detail`} style={{ background: 'var(--admin-glass)' }}>
                    <td colSpan={8} style={{ padding: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: 'var(--admin-text-dim)', textTransform: 'uppercase' }}>Request Data</strong>
                          <pre style={{ margin: '6px 0 0', fontSize: '0.75rem', overflow: 'auto', maxHeight: 200, background: 'rgba(0,0,0,0.3)', color: 'var(--admin-cyan)', padding: '10px', borderRadius: 6 }}>
                            {row.requestData ? JSON.stringify(row.requestData, null, 2) : 'none'}
                          </pre>
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: 'var(--admin-text-dim)', textTransform: 'uppercase' }}>Response Data</strong>
                          <pre style={{ margin: '6px 0 0', fontSize: '0.75rem', overflow: 'auto', maxHeight: 200, background: 'rgba(0,0,0,0.3)', color: 'var(--admin-cyan)', padding: '10px', borderRadius: 6 }}>
                            {row.responseData ? JSON.stringify(row.responseData, null, 2) : 'none'}
                          </pre>
                        </div>
                      </div>
                      {row.userAgent && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--admin-text-dim)', borderTop: '1px solid var(--admin-glass-border)', paddingTop: '0.5rem' }}>
                          <strong>User-Agent:</strong> {row.userAgent}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className={styles['pagination']}>
          <button
            className={styles['btn-ghost']}
            disabled={page <= 1}
            onClick={() => load(page - 1)}
          >
            ← Prev
          </button>
          <span style={{ padding: '0 1rem', fontSize: '0.9rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className={styles['btn-ghost']}
            disabled={page >= totalPages}
            onClick={() => load(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
