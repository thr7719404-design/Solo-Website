import { useEffect, useRef, useState } from 'react';
import type { CategoryDto } from '@/types';

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name_asc', label: 'Name: A → Z' },
  { value: 'name_desc', label: 'Name: Z → A' },
  { value: 'price_asc', label: 'Price: low → high' },
  { value: 'price_desc', label: 'Price: high → low' },
  { value: 'popularity', label: 'Most popular' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'out_of_stock', label: 'Out of stock' },
];

const STOCK_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'true', label: 'In stock' },
  { value: 'low', label: 'Low (≤ 10)' },
  { value: 'false', label: 'Out of stock' },
];

const TAG_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'featured', label: 'Featured' },
  { value: 'bestSeller', label: 'Best seller' },
  { value: 'newArrival', label: 'New arrival' },
];

interface Props {
  search: string;
  onSearch: (v: string) => void;
  sortBy: string;
  onSortChange: (v: string) => void;
  filterStatus: string;
  onStatusChange: (v: string) => void;
  filterStock: string;
  onStockChange: (v: string) => void;
  filterCategory: string;
  onCategoryChange: (v: string) => void;
  filterTag: string;
  onTagChange: (v: string) => void;
  categories: CategoryDto[];
  shown: number;
  total: number;
  onResetAll: () => void;
}

export function DataToolbar(props: Readonly<Props>) {
  const {
    search, onSearch, sortBy, onSortChange,
    filterStatus, onStatusChange,
    filterStock, onStockChange,
    filterCategory, onCategoryChange,
    filterTag, onTagChange,
    categories, shown, total, onResetAll,
  } = props;

  const [openMenu, setOpenMenu] = useState<null | 'filter' | 'sort'>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openMenu]);

  const activeChips: Array<{ key: string; label: string; value: string; onClear: () => void }> = [];
  if (filterStatus && filterStatus !== 'all') {
    activeChips.push({
      key: 'status', label: 'Status',
      value: STATUS_OPTIONS.find(o => o.value === filterStatus)?.label ?? filterStatus,
      onClear: () => onStatusChange('all'),
    });
  }
  if (filterStock) {
    activeChips.push({
      key: 'stock', label: 'Stock',
      value: STOCK_OPTIONS.find(o => o.value === filterStock)?.label ?? filterStock,
      onClear: () => onStockChange(''),
    });
  }
  if (filterCategory) {
    activeChips.push({
      key: 'category', label: 'Category',
      value: categories.find(c => c.id === filterCategory)?.name ?? filterCategory,
      onClear: () => onCategoryChange(''),
    });
  }
  if (filterTag) {
    activeChips.push({
      key: 'tag', label: 'Tag',
      value: TAG_OPTIONS.find(o => o.value === filterTag)?.label ?? filterTag,
      onClear: () => onTagChange(''),
    });
  }

  const filterCount = activeChips.length;
  const hasActive = filterCount > 0 || sortBy !== 'newest' || !!search;
  const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Sort';

  // Inline styles (scoped, avoids touching shared CSS)
  const s = {
    bar: {
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const,
      padding: '10px 12px', marginBottom: 12,
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    },
    searchWrap: {
      position: 'relative' as const, flex: '1 1 280px', minWidth: 220, maxWidth: 480,
    },
    searchIcon: {
      position: 'absolute' as const, left: 10, top: '50%', transform: 'translateY(-50%)',
      pointerEvents: 'none' as const, fontSize: 14, color: '#9ca3af',
    },
    searchInput: {
      width: '100%', padding: '8px 12px 8px 32px', fontSize: 13,
      border: '1px solid #d1d5db', borderRadius: 8, outline: 'none', background: '#fff',
    },
    btn: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '7px 12px', fontSize: 13, fontWeight: 500,
      border: '1px solid #d1d5db', borderRadius: 8, background: '#fff',
      cursor: 'pointer', color: '#374151',
    } as React.CSSProperties,
    btnActive: { borderColor: '#2563eb', color: '#2563eb', background: '#eff6ff' } as React.CSSProperties,
    badge: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 18, height: 18, padding: '0 5px',
      fontSize: 11, fontWeight: 600, borderRadius: 999,
      background: '#2563eb', color: '#fff',
    } as React.CSSProperties,
    menu: {
      position: 'absolute' as const, top: 'calc(100% + 6px)', right: 0, zIndex: 30,
      minWidth: 280, padding: 12,
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    },
    menuRow: {
      display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center',
      gap: 8, marginBottom: 8,
    } as React.CSSProperties,
    label: { fontSize: 12, color: '#6b7280', fontWeight: 500 } as React.CSSProperties,
    select: {
      width: '100%', padding: '6px 8px', fontSize: 13,
      border: '1px solid #d1d5db', borderRadius: 6, background: '#fff',
    } as React.CSSProperties,
    sortItem: (active: boolean) => ({
      display: 'block', width: '100%', textAlign: 'left' as const,
      padding: '7px 10px', fontSize: 13,
      border: 0, background: active ? '#eff6ff' : 'transparent',
      color: active ? '#2563eb' : '#374151', fontWeight: active ? 600 : 400,
      borderRadius: 6, cursor: 'pointer',
    }) as (a: boolean) => React.CSSProperties,
    chip: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 4px 4px 10px', fontSize: 12,
      background: '#eff6ff', color: '#1e40af',
      border: '1px solid #bfdbfe', borderRadius: 999,
    } as React.CSSProperties,
    chipX: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 18, height: 18, border: 0, borderRadius: 999,
      background: 'transparent', color: '#1e40af', cursor: 'pointer', fontSize: 14, lineHeight: 1,
    } as React.CSSProperties,
    reset: {
      padding: '6px 10px', fontSize: 12, color: '#6b7280',
      background: 'transparent', border: 0, cursor: 'pointer', textDecoration: 'underline',
    } as React.CSSProperties,
    count: { marginLeft: 'auto', fontSize: 12, color: '#6b7280' } as React.CSSProperties,
  };

  return (
    <div ref={wrapRef} style={s.bar}>
      {/* Search */}
      <div style={s.searchWrap}>
        <span style={s.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Search products by name or SKU…"
          value={search}
          onChange={e => onSearch(e.target.value)}
          style={s.searchInput}
        />
      </div>

      {/* Filter button */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === 'filter' ? null : 'filter')}
          style={{ ...s.btn, ...(filterCount > 0 ? s.btnActive : {}) }}
        >
          <span style={{ fontSize: 14 }}>⚙</span>
          Filters
          {filterCount > 0 && <span style={s.badge}>{filterCount}</span>}
          <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
        </button>
        {openMenu === 'filter' && (
          <div style={s.menu}>
            <div style={s.menuRow}>
              <label htmlFor="dt-status" style={s.label}>Status</label>
              <select id="dt-status" style={s.select} value={filterStatus} onChange={e => onStatusChange(e.target.value)}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={s.menuRow}>
              <label htmlFor="dt-stock" style={s.label}>Stock</label>
              <select id="dt-stock" style={s.select} value={filterStock} onChange={e => onStockChange(e.target.value)}>
                {STOCK_OPTIONS.map(o => <option key={o.value || 'any'} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={s.menuRow}>
              <label htmlFor="dt-cat" style={s.label}>Category</label>
              <select id="dt-cat" style={s.select} value={filterCategory} onChange={e => onCategoryChange(e.target.value)}>
                <option value="">Any</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={s.menuRow}>
              <label htmlFor="dt-tag" style={s.label}>Tag</label>
              <select id="dt-tag" style={s.select} value={filterTag} onChange={e => onTagChange(e.target.value)}>
                {TAG_OPTIONS.map(o => <option key={o.value || 'any'} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {filterCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f3f4f6', paddingTop: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => { onStatusChange('all'); onStockChange(''); onCategoryChange(''); onTagChange(''); }}
                  style={s.reset}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sort button */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')}
          style={{ ...s.btn, ...(sortBy !== 'newest' ? s.btnActive : {}) }}
        >
          <span style={{ fontSize: 14 }}>↕</span>
          Sort: <span style={{ fontWeight: 600 }}>{sortLabel}</span>
          <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
        </button>
        {openMenu === 'sort' && (
          <div style={{ ...s.menu, minWidth: 200, padding: 6 }}>
            {SORT_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onSortChange(o.value); setOpenMenu(null); }}
                style={s.sortItem(sortBy === o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.map(chip => (
        <span key={chip.key} style={s.chip}>
          <span style={{ opacity: 0.7 }}>{chip.label}:</span>
          <strong style={{ fontWeight: 600 }}>{chip.value}</strong>
          <button type="button" onClick={chip.onClear} aria-label={`Remove ${chip.label} filter`} style={s.chipX}>×</button>
        </span>
      ))}

      {hasActive && (
        <button type="button" onClick={onResetAll} style={s.reset}>
          Reset all
        </button>
      )}

      <span style={s.count}>
        Showing <strong style={{ color: '#111827' }}>{shown}</strong> of <strong style={{ color: '#111827' }}>{total}</strong>
      </span>
    </div>
  );
}
