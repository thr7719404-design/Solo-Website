import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productsApi } from '@/api/products';
import { categoriesApi } from '@/api/categories';
import { brandsApi } from '@/api/brands';
import { mediaApi, productGroupsApi, type ProductGroupDto } from '@/api/admin';
import type { ProductDto, CategoryDto, BrandDto } from '@/types';
import styles from './Admin.module.css';
import { DataToolbar } from './DataToolbar';

const STATUS_MAP: Record<string, string> = {
  active: 'table-tag-green',
  draft: 'table-tag-yellow',
  archived: 'table-tag-gray',
  'out-of-stock': 'table-tag-red',
};

const TABS = ['Basic', 'Pricing & Stock', 'Media', 'Variants', 'SEO'] as const;
type Tab = typeof TABS[number];

const emptyForm = () => ({
  name: '', slug: '', sku: '', description: '', shortDescription: '',
  price: '', compareAtPrice: '', costPrice: '',
  categoryIds: [] as string[], subcategoryIds: [] as string[], brandId: '',
  stockQuantity: '0', lowStockThreshold: '5',
  isFeatured: false, isNew: false, isBestSeller: false,
  status: 'active',
  metaTitle: '', metaDescription: '',
  specifications: '',
  highlights: '',
  // Variants
  productGroupId: '',
  variantColor: '',
  variantColorHex: '',
  variantColorImageIndex: '',
  variantSize: '',
  variantSortOrder: '0',
});;

type ProductFlagField = 'isFeatured' | 'isNew' | 'isBestSeller';

interface TogglePillProps {
  label: string;
  field: ProductFlagField;
  form: ReturnType<typeof emptyForm>;
  set: (field: ProductFlagField, value: boolean) => void;
}

function TogglePill({ label, field, form, set }: Readonly<TogglePillProps>) {
  const checked = Boolean((form as Record<string, unknown>)[field]);
  return (
    <label className={`${styles['toggle-pill']} ${checked ? styles['toggle-pill-on'] : ''}`}>
      <input type="checkbox" checked={checked} onChange={e => set(field, e.target.checked)} />
      <span className={styles['toggle-dot']}>{checked ? '✓' : ''}</span>
      {label}
    </label>
  );
}

interface VariantCardProps {
  product: NonNullable<ProductGroupDto['products']>[number];
  groupId: string;
  isCurrent: boolean;
  onChanged: () => void;
}

function VariantCard({ product, groupId, isCurrent, onChanged }: Readonly<VariantCardProps>) {
  const a = product.variantAttributes ?? {};
  const [colorName, setColorName] = useState<string>(String(a.colorName ?? a.color ?? ''));
  const [colorHex, setColorHex] = useState<string>(String(a.colorHex ?? '#cccccc'));
  const [size, setSize] = useState<string>(String(a.size ?? ''));
  const [sortOrder, setSortOrder] = useState<string>(String(product.variantSortOrder ?? 0));
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);

  const save = async () => {
    setBusy(true);
    try {
      const attrs: Record<string, any> = {};
      if (colorName) attrs.colorName = colorName;
      if (colorHex) attrs.colorHex = colorHex;
      if (size) attrs.size = size;
      await productGroupsApi.setProductVariant(product.id, {
        productGroupId: groupId,
        variantAttributes: Object.keys(attrs).length ? attrs : null,
        variantSortOrder: Number.parseInt(sortOrder, 10) || 0,
      });
      setDirty(false);
      onChanged();
    } catch {
      alert(`Failed to save ${product.productName}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Remove "${product.productName}" from this variant group?\n\nThe product becomes a standalone product (NOT deleted).`)) return;
    setBusy(true);
    try {
      await productGroupsApi.setProductVariant(product.id, { productGroupId: null });
      onChanged();
    } catch {
      alert(`Failed to remove ${product.productName}`);
    } finally {
      setBusy(false);
    }
  };

  const missing = !(colorName) || !size;
  let borderColor = 'rgba(148,163,184,0.25)';
  if (dirty) borderColor = '#fbbf24';
  else if (missing) borderColor = '#fecaca';
  const cardStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '44px 1fr auto',
    gap: 12,
    alignItems: 'center',
    padding: 10,
    border: `1px solid ${borderColor}`,
    borderRadius: 10,
    background: dirty ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.02)',
    transition: 'border-color 0.15s, background 0.15s',
  };
  const inputBase: React.CSSProperties = {
    padding: '6px 8px',
    fontSize: 12,
    border: '1px solid rgba(148,163,184,0.35)',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.04)',
    color: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={cardStyle}>
      {/* Color swatch */}
      <label style={{ position: 'relative', width: 44, height: 44, borderRadius: 8, background: colorHex || '#cccccc', border: '2px solid rgba(255,255,255,0.15)', cursor: busy ? 'not-allowed' : 'pointer', overflow: 'hidden', display: 'block', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)' }} title="Click to change color">
        <input
          type="color"
          value={colorHex || '#cccccc'}
          onChange={e => { setColorHex(e.target.value); markDirty(); }}
          disabled={busy}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'inherit' }}
          aria-label="Color hex"
        />
      </label>

      {/* Middle: name + inputs */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {product.productName}
          </span>
          <span style={{ fontSize: 10, fontFamily: 'inherit', color: '#94a3b8', padding: '1px 6px', borderRadius: 3, background: 'rgba(148,163,184,0.12)' }}>
            {product.sku}
          </span>
          {isCurrent && (
            <span style={{ fontSize: 10, fontWeight: 600, color: '#0891b2', padding: '1px 6px', borderRadius: 3, background: 'rgba(8,145,178,0.15)', border: '1px solid rgba(8,145,178,0.3)' }}>
              THIS PRODUCT
            </span>
          )}
          <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 'auto' }}>
            Stock: {product.stockQty}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 60px', gap: 6 }}>
          <input
            type="text"
            value={colorName}
            onChange={e => { setColorName(e.target.value); markDirty(); }}
            placeholder="Color name"
            style={inputBase}
            disabled={busy}
          />
          <input
            type="text"
            value={size}
            onChange={e => { setSize(e.target.value); markDirty(); }}
            placeholder="Size"
            style={inputBase}
            disabled={busy}
          />
          <input
            type="number"
            value={sortOrder}
            onChange={e => { setSortOrder(e.target.value); markDirty(); }}
            style={inputBase}
            disabled={busy}
            title="Display order"
            aria-label="Display order"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            background: dirty ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(148,163,184,0.15)',
            color: dirty ? '#fff' : '#94a3b8',
            border: 'none',
            borderRadius: 6,
            cursor: dirty && !busy ? 'pointer' : 'not-allowed',
            boxShadow: dirty ? '0 1px 3px rgba(37,99,235,0.4)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {busy ? '…' : 'Save'}
        </button>
        {!isCurrent && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            title="Remove from group"
            style={{
              padding: '4px 10px',
              fontSize: 11,
              background: 'transparent',
              color: '#f87171',
              border: '1px solid rgba(248,113,113,0.4)',
              borderRadius: 6,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(20);
  const totalPages = Math.ceil(total / limit);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDto | null>(null);
  const [tab, setTab] = useState<Tab>('Basic');
  const [form, setForm] = useState(emptyForm());
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Lookups
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [brands, setBrands] = useState<BrandDto[]>([]);
  const [lookupsLoaded, setLookupsLoaded] = useState(false);
  const [productGroups, setProductGroups] = useState<ProductGroupDto[]>([]);

  // Filter state
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStock, setFilterStock] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Multi-select for bulk grouping
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkGroupName, setBulkGroupName] = useState('');
  const [bulkExistingGroupId, setBulkExistingGroupId] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAllVisible = (check: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      products.forEach(p => {
        if (check) next.add(String(p.id));
        else next.delete(String(p.id));
      });
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const submitBulkGroup = async () => {
    const ids = Array.from(selectedIds).map(s => Number(s)).filter(n => Number.isFinite(n));
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      let targetId = bulkExistingGroupId;
      if (!targetId) {
        if (!bulkGroupName.trim()) {
          alert('Choose an existing group or enter a name');
          setBulkBusy(false);
          return;
        }
        const created = await productGroupsApi.create({
          name: bulkGroupName.trim(),
          productIds: ids,
        });
        targetId = created.id;
      } else {
        // Add each variant to existing group
        for (const productId of ids) {
          await productGroupsApi.addVariant(targetId, { productId });
        }
      }
      setBulkOpen(false);
      setBulkGroupName('');
      setBulkExistingGroupId('');
      clearSelection();
      // Refresh groups + products
      const fresh = await productGroupsApi.list();
      setProductGroups(fresh.data ?? []);
      loadProducts();
      alert(`Grouped ${ids.length} product(s).`);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to group');
    } finally {
      setBulkBusy(false);
    }
  };

  const loadProducts = () => {
    setLoading(true);
    const filters: any = { page, limit, search: search || undefined, status: filterStatus || 'all', sortBy };
    if (filterStock) filters.inStock = filterStock;
    if (filterCategory) filters.categoryId = filterCategory;
    if (filterTag === 'featured') filters.isFeatured = true;
    else if (filterTag === 'bestSeller') filters.isBestSeller = true;
    else if (filterTag === 'newArrival') filters.isNew = true;
    productsApi.getAll(filters)
      .then(r => { setProducts(r.items ?? []); setTotal(r.total ?? 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(loadProducts, [page, search, filterStatus, filterStock, filterCategory, filterTag, limit, sortBy]);

  const loadLookups = () => {
    // Always refetch: admins frequently toggle subcategory isActive in
    // another tab and re-open the product drawer; without a refresh the
    // checklist would silently omit the newly-active subcategory.
    Promise.all([categoriesApi.getAll({ includeSubcategories: true }), brandsApi.getAll()]).then(([c, b]) => {
      setCategories(Array.isArray(c) ? c : []);
      setBrands(Array.isArray(b) ? b : []);
      setLookupsLoaded(true);
    });
    productGroupsApi.list()
      .then(r => setProductGroups(r.data ?? []))
      .catch(() => setProductGroups([]));
  };

  // Load categories/brands on mount for filter dropdowns
  useEffect(loadLookups, []);

  // Deep-link: open the edit drawer when arriving with ?edit=<id>
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    openEdit({ id: Number(editId) } as unknown as ProductDto);
    // strip the param so reopening on close works cleanly
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const autoSlug = (name: string) =>
    name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');

  const openCreate = () => {
    loadLookups();
    setEditing(null);
    setForm(emptyForm());
    setImageUrls([]);
    setMainImageIndex(0);
    setTab('Basic');
    setDrawerOpen(true);
  };

  const openEdit = (p: ProductDto) => {
    loadLookups();
    setEditing(p);
    setTab('Basic');
    setDrawerLoading(true);
    setDrawerOpen(true);
    productsApi.getById(`${p.id}`).then((full: any) => {
      const va = full.variantAttributes || {};
      setForm({
        name: full.name, slug: full.slug ?? '', sku: full.sku ?? '',
        description: full.description ?? '', shortDescription: full.shortDescription ?? '',
        price: String(full.price ?? ''), compareAtPrice: (full.compareAtPrice != null && full.compareAtPrice > 0) ? String(full.compareAtPrice) : '',
        costPrice: String(full.costPrice ?? ''),
        categoryIds: ((full.categoryIds && full.categoryIds.length > 0)
          ? full.categoryIds.map((x: any) => String(x))
          : (full.categories?.map((c: any) => String(c.id))
              ?? (full.category?.id ? [String(full.category.id)] : []))),
        brandId: String(full.brand?.id ?? full.brandId ?? ''),
        subcategoryIds: ((full.subcategoryIds && full.subcategoryIds.length > 0)
          ? full.subcategoryIds.map((x: any) => String(x))
          : (full.subcategories?.map((s: any) => String(s.id))
              ?? (full.subcategory?.id ? [String(full.subcategory.id)] : []))),
        stockQuantity: String(full.stockQuantity ?? full.stockQty ?? 0), lowStockThreshold: String(full.lowStockThreshold ?? 5),
        isFeatured: full.isFeatured ?? false, isNew: full.isNew ?? false, isBestSeller: full.isBestSeller ?? false,
        // Normalise the API's computed status ('out-of-stock' is not a selectable form value;
        // it just means stock=0 on an active product, so keep the form status as 'active').
        status: (() => {
          if (full.isActive === false) return 'draft';
          if (full.isDiscontinued === true || full.status === 'archived') return 'archived';
          return 'active';
        })(),
        metaTitle: full.metaTitle ?? '', metaDescription: full.metaDescription ?? '',
        specifications: typeof full.specifications === 'string' ? full.specifications : JSON.stringify(full.specifications ?? '', null, 2),
        highlights: Array.isArray(full.highlights) ? full.highlights.join('\n') : (full.highlights ?? ''),
        productGroupId: String(full.productGroup?.id ?? ''),
        variantColor: String(va.colorName ?? va.color ?? ''),
        variantColorHex: String(va.colorHex ?? ''),
        variantColorImageIndex: '',
        variantSize: String(va.size ?? ''),
        variantSortOrder: String(full.variantSortOrder ?? 0),
      });
      setImageUrls((full.images ?? []).map(i => i.url));
      setMainImageIndex(0);
      setDrawerLoading(false);
    });
  };

  const closeDrawer = () => { setDrawerOpen(false); setEditing(null); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        const res = await mediaApi.upload(file);
        setImageUrls(prev => [...prev, res.data?.url ?? res.url]);
      } catch { /* skip failed upload */ }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const save = async () => {
    // Required-field validation (matches backend DTO @IsNotEmpty fields)
    const missing: string[] = [];
    if (!form.name.trim()) missing.push('Name');
    if (!form.sku.trim()) missing.push('SKU');
    if (!form.description.trim()) missing.push('Description');
    if (!form.categoryIds || form.categoryIds.length === 0) missing.push('Category');
    if (!form.brandId) missing.push('Brand');
    if (!form.price || Number.isNaN(Number.parseFloat(form.price))) missing.push('Price');
    if (missing.length) {
      alert(`Please fill in the required field(s): ${missing.join(', ')}`);
      return;
    }
    // Compare At Price must be strictly greater than Price (it's the "was" / strikethrough price).
    if (form.compareAtPrice && form.compareAtPrice !== '0') {
      const price = Number.parseFloat(form.price);
      const compareAt = Number.parseFloat(form.compareAtPrice);
      if (!Number.isNaN(compareAt) && !Number.isNaN(price) && compareAt > 0 && compareAt <= price) {
        alert('Compare At Price must be higher than the selling Price (it represents the original / strikethrough price).');
        return;
      }
    }
    // Each selected category that HAS subcategories must have at least one selected.
    const catsMissingSubs: string[] = [];
    for (const cid of form.categoryIds) {
      const cat = categories.find(c => String(c.id) === cid);
      if (!cat) continue;
      const subs = (cat.subcategories ?? []) as any[];
      if (subs.length === 0) continue;
      const hasSelected = subs.some(s => form.subcategoryIds.includes(String(s.id)));
      if (!hasSelected) catsMissingSubs.push(cat.name);
    }
    if (catsMissingSubs.length) {
      alert(`Please select at least one subcategory for: ${catsMissingSubs.join(', ')}`);
      return;
    }

    setSaving(true);
    // Strip variant-only fields — they are sent separately to the product-groups endpoint
    const {
      productGroupId: _pg,
      variantColor: _vc,
      variantColorHex: _vch,
      variantColorImageIndex: _vci,
      variantSize: _vs,
      variantSortOrder: _vso,
      ...productFields
    } = form;
    // Drop empty-string optional fields so backend `@IsOptional` validators (e.g. URL/length on optional fields) skip them.
    const cleaned: any = {};
    for (const [k, v] of Object.entries(productFields)) {
      if (typeof v === 'string' && v.trim() === '') continue;
      cleaned[k] = v;
    }
    const payload: any = {
      ...cleaned,
      // Mirror first selected id into legacy single FK for back-compat with DTO/required field
      categoryId: form.categoryIds?.[0] ?? undefined,
      subcategoryId: form.subcategoryIds?.[0] ?? undefined,
      categoryIds: form.categoryIds ?? [],
      subcategoryIds: form.subcategoryIds ?? [],
      price: Number.parseFloat(form.price) || 0,
      compareAtPrice: form.compareAtPrice ? Number.parseFloat(form.compareAtPrice) : 0,
      costPrice: form.costPrice ? Number.parseFloat(form.costPrice) : undefined,
      stockQuantity: Number.parseInt(form.stockQuantity) || 0,
      lowStockThreshold: Number.parseInt(form.lowStockThreshold) || 5,
      images: (mainImageIndex === 0 ? imageUrls : [imageUrls[mainImageIndex], ...imageUrls.filter((_, i) => i !== mainImageIndex)])
        .map((url, i) => ({ url, displayOrder: i, altText: form.name })),
      highlights: form.highlights.split('\n').filter(Boolean),
    };
    if (!form.slug && form.name) payload.slug = autoSlug(form.name);
    try { if (form.specifications) payload.specifications = JSON.parse(form.specifications); } catch { /* leave as string */ }
    try {
      let savedId: string | number;
      if (editing) {
        await productsApi.update(editing.id, payload);
        savedId = editing.id;
      } else {
        const created: any = await productsApi.create(payload);
        savedId = created?.id ?? created?.data?.id;
      }
      // Variant linkage (if a group is selected, or to clear it)
      if (savedId !== undefined && savedId !== null) {
        const variantAttrs: Record<string, any> = {};
        if (form.variantColor) variantAttrs.colorName = form.variantColor;
        if (form.variantColorHex) variantAttrs.colorHex = form.variantColorHex;
        if (form.variantSize) variantAttrs.size = form.variantSize;
        try {
          await productGroupsApi.setProductVariant(Number(savedId), {
            productGroupId: form.productGroupId || null,
            variantAttributes: Object.keys(variantAttrs).length ? variantAttrs : null,
            variantSortOrder: Number.parseInt(form.variantSortOrder, 10) || 0,
          });
        } catch { /* non-fatal */ }
      }
      closeDrawer();
      loadProducts();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const detail = Array.isArray(msg) ? msg.join('\n• ') : (msg ?? err?.message ?? 'Unknown error');
      alert(`Failed to save product:\n• ${detail}`);
    }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this product?\n\nThe SKU will be retired and removed from the catalog, but kept in the database for sales reconciliation. Products with on-hand or reserved stock cannot be deleted.')) return;
    try {
      await productsApi.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setTotal(t => t - 1);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      alert(`Cannot delete product:\n\n${msg}`);
    }
  };

  const pageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const sortIndicator = (col: 'name' | 'price') => {
    if (sortBy === `${col}_asc`) return '▲';
    if (sortBy === `${col}_desc`) return '▼';
    return '↕';
  };

  /* ── Toggle pill helper (component defined at module scope below) ── */

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Products</h1>
          <span className={styles['header-v2-sub']}>{total} products in your catalog</span>
        </div>
        <button className={styles['btn-primary']} onClick={openCreate}>+ New Product</button>
      </div>

      <div className={styles['admin-body']}>
        <DataToolbar
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          sortBy={sortBy}
          onSortChange={(v) => { setSortBy(v); setPage(1); }}
          filterStatus={filterStatus}
          onStatusChange={(v) => { setFilterStatus(v); setPage(1); }}
          filterStock={filterStock}
          onStockChange={(v) => { setFilterStock(v); setPage(1); }}
          filterCategory={filterCategory}
          onCategoryChange={(v) => { setFilterCategory(v); setPage(1); }}
          filterTag={filterTag}
          onTagChange={(v) => { setFilterTag(v); setPage(1); }}
          categories={categories}
          shown={products.length}
          total={total}
          onResetAll={() => { setSearch(''); setFilterStatus('all'); setFilterStock(''); setFilterCategory(''); setFilterTag(''); setSortBy('newest'); setPage(1); }}
        />

        {(() => {
          if (loading) return <div className="loading-spinner" />;
          if (products.length === 0) {
            return (
          <div className={styles['empty-state']}>
            <div className={styles['empty-state-icon']}>📦</div>
            <h3>{search ? 'No products match your search' : 'No products yet'}</h3>
            <p>{search ? 'Try a different search term' : 'Add your first product to get started'}</p>
          </div>
            );
          }
          return (
          <div className={styles['table-v2-wrap']}>
            {selectedIds.size > 0 && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 12px', marginBottom: 8,
                  background: 'rgba(37,99,235,0.08)', borderRadius: 6,
                  border: '1px solid rgba(37,99,235,0.3)',
                }}
              >
                <strong>{selectedIds.size} selected</strong>
                <button className={styles['btn-primary']} onClick={() => setBulkOpen(true)} style={{ fontSize: 12 }}>
                  🧩 Group Selected
                </button>
                <button className={styles['btn-secondary']} onClick={clearSelection} style={{ fontSize: 12 }}>
                  Clear
                </button>
              </div>
            )}
            <table className={styles['table-v2']}>
              <thead>
                <tr>
                  <th style={{ width: 32 }}>
                    <input
                      type="checkbox"
                      aria-label="Select all visible"
                      checked={products.length > 0 && products.every(p => selectedIds.has(String(p.id)))}
                      onChange={e => toggleSelectAllVisible(e.target.checked)}
                    />
                  </th>
                  <th style={{ width: 60 }}></th>
                  <th>
                    <button
                      type="button"
                      onClick={() => { setSortBy(prev => prev === 'name_asc' ? 'name_desc' : 'name_asc'); setPage(1); }}
                      title="Sort by name"
                      style={{ background: 'none', border: 0, padding: 0, font: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, color: 'inherit' }}
                    >
                      Product
                      <span style={{ fontSize: 10, opacity: sortBy.startsWith('name_') ? 1 : 0.35 }}>{sortIndicator('name')}</span>
                    </button>
                  </th>
                  <th>SKU</th>
                  <th>Group</th>
                  <th style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => { setSortBy(prev => prev === 'price_asc' ? 'price_desc' : 'price_asc'); setPage(1); }}
                      title="Sort by price"
                      style={{ background: 'none', border: 0, padding: 0, font: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, color: 'inherit' }}
                    >
                      Price
                      <span style={{ fontSize: 10, opacity: sortBy.startsWith('price_') ? 1 : 0.35 }}>{sortIndicator('price')}</span>
                    </button>
                  </th>
                  <th style={{ textAlign: 'center' }}>Stock</th>
                  <th>Status</th>
                  <th>Tags</th>
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const status = (p.status ?? 'active').toLowerCase();
                  const tagClass = STATUS_MAP[status] ?? 'table-tag-gray';
                  const isSelected = selectedIds.has(String(p.id));
                  const va = (p.variantAttributes ?? {}) as Record<string, any>;
                  const colorLabel = va.color ?? va.colorName;
                  const colorHex = typeof va.colorHex === 'string' ? va.colorHex : null;
                  return (
                    <tr key={p.id} onDoubleClick={() => openEdit(p)}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${p.name}`}
                          checked={isSelected}
                          onChange={() => toggleSelect(String(p.id))}
                          onClick={e => e.stopPropagation()}
                        />
                      </td>
                      <td>
                        <img src={p.images?.[0]?.url ?? '/placeholder.svg'} alt="" className={styles['table-thumb']} />
                      </td>
                      <td>
                        <button onClick={() => openEdit(p)} className={styles['table-name']} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                          {p.name}
                        </button>
                        {p.sku && <div className={styles['table-sub']}>{p.sku}</div>}
                      </td>
                      <td><code style={{ fontSize: 13, color: '#6b7280' }}>{p.sku ?? '—'}</code></td>
                      <td>
                        {p.productGroup ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Link
                              to={`/admin/product-groups/${p.productGroup.id}`}
                              style={{ fontSize: 12, fontWeight: 600 }}
                            >
                              {p.productGroup.name}
                            </Link>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {p.isDefaultVariant && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#1e40af' }}>★ default</span>
                              )}
                              {(colorLabel || va.size) && (
                                <span
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 3,
                                    fontSize: 10, padding: '1px 5px', borderRadius: 8,
                                    background: 'rgba(148,163,184,0.15)',
                                  }}
                                >
                                  {colorHex && (
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorHex, border: '1px solid #0002' }} />
                                  )}
                                  {[colorLabel, va.size].filter(Boolean).join(' / ')}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>AED {Number(p.price).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={styles['table-tag'] + ' ' + styles[
                          (p.stockQuantity ?? 0) > 10 ? 'table-tag-green' :
                          (p.stockQuantity ?? 0) > 0 ? 'table-tag-yellow' : 'table-tag-red'
                        ]}>{p.stockQuantity ?? 0}</span>
                      </td>
                      <td>
                        <span className={styles['table-tag'] + ' ' + styles[tagClass]}>{status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {p.isFeatured && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: '#fef3c7', color: '#92400e', fontWeight: 600, whiteSpace: 'nowrap' }}>Featured</span>}
                          {p.isBestSeller && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: '#dbeafe', color: '#1e40af', fontWeight: 600, whiteSpace: 'nowrap' }}>Best Seller</span>}
                          {p.isNew && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: '#d1fae5', color: '#065f46', fontWeight: 600, whiteSpace: 'nowrap' }}>New Arrival</span>}
                        </div>
                      </td>
                      <td>
                        <div className={styles['table-actions']}>
                          <button className={styles['table-action-btn']} title="Edit" onClick={() => openEdit(p)}>✏️</button>
                          <button className={`${styles['table-action-btn']} ${styles['table-action-btn-danger']}`} title="Delete" onClick={() => remove(p.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          );
        })()}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <div className={styles['per-page']}>
              <span>Show</span>
              <select className={styles['per-page-select']} value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
            </div>
            <div className={styles['page-nav']}>
              <button className={styles['page-btn']} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              {pageNumbers().map((n, i) =>
                n === '...' ? (
                  <span key={`e${i}`} className={styles['page-btn']} style={{ cursor: 'default', opacity: 0.5 }}>…</span>
                ) : (
                  <button key={n} className={`${styles['page-btn']} ${n === page ? styles['page-btn-active'] : ''}`} onClick={() => setPage(n as number)}>{n}</button>
                )
              )}
              <button className={styles['page-btn']} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ Product Drawer ══════════ */}
      {drawerOpen && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={closeDrawer} />
          <div className={`${styles.drawer} ${styles['drawer-wide']}`}>
            <div className={styles['drawer-header']}>
              <h2>{editing ? 'Edit Product' : 'New Product'}</h2>
              <button className={styles['drawer-close']} onClick={closeDrawer}>✕</button>
            </div>

            {/* Tabs */}
            <div className={styles['drawer-tabs']}>
              {TABS.map(t => (
                <button key={t} className={`${styles['drawer-tab']} ${tab === t ? styles['drawer-tab-active'] : ''}`} onClick={() => setTab(t)}>
                  {t}
                </button>
              ))}
            </div>

            <div className={styles['drawer-body']}>
              {drawerLoading ? <div className="loading-spinner" /> : (
                <>
                  {/* ── Tab: Basic ── */}
                  {tab === 'Basic' && (
                    <>
                      <div className={styles['field-row']}>
                        <div className={styles.field}>
                          <label htmlFor="name">Name *</label>
                          <input id="name" value={form.name} onChange={e => { set('name', e.target.value); if (!editing) set('slug', autoSlug(e.target.value)); }} placeholder="Product name" />
                        </div>
                        <div className={styles.field}>
                          <label htmlFor="sku">SKU</label>
                          <input id="sku" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. KIT-001" />
                        </div>
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="slug">Slug</label>
                        <input id="slug" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-generated" />
                        <span className={styles['field-hint']}>URL-friendly identifier</span>
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="short-description">Short Description</label>
                        <input id="short-description" value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} placeholder="Brief one-liner" />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="description">Description</label>
                        <textarea id="description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detailed product description…" />
                      </div>
                      <div className={styles['field-row']}>
                        <div className={styles.field}>
                          <label>Categories</label>
                          <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #d6d8db', borderRadius: 6, padding: 8, background: '#fff' }}>
                            {categories.length === 0 && <div style={{ color: '#888', fontSize: 13 }}>No categories available</div>}
                            {categories.map(c => {
                              const id = String(c.id);
                              const checked = form.categoryIds.includes(id);
                              return (
                                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontWeight: 'normal', cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 14, color: 'var(--admin-text, #222)', margin: 0 }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setForm((f: any) => {
                                        const next = checked
                                          ? f.categoryIds.filter((x: string) => x !== id)
                                          : [...f.categoryIds, id];
                                        // Drop subcategories that no longer belong to a selected category
                                        const remainingSubs = (f.subcategoryIds as string[]).filter((sid: string) => {
                                          return categories.some(cat => next.includes(String(cat.id)) && (cat.subcategories ?? []).some((s: any) => String(s.id) === sid));
                                        });
                                        return { ...f, categoryIds: next, subcategoryIds: remainingSubs };
                                      });
                                    }}
                                  />
                                  <span>{c.name}</span>
                                </label>
                              );
                            })}
                          </div>
                          <span className={styles['field-hint']}>Select one or more</span>
                        </div>
                        <div className={styles.field}>
                          <label>Subcategories</label>
                          <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #d6d8db', borderRadius: 6, padding: 8, background: form.categoryIds.length ? '#fff' : '#f5f5f5' }}>
                            {form.categoryIds.length === 0 && <div style={{ color: '#888', fontSize: 13 }}>Select a category first</div>}
                            {categories
                              .filter(c => form.categoryIds.includes(String(c.id)))
                              .map(c => (
                                <div key={c.id} style={{ marginBottom: 6 }}>
                                  <div style={{ fontSize: 12, color: '#666', fontWeight: 600, padding: '2px 0' }}>{c.name}</div>
                                  {(c.subcategories ?? []).length === 0 && (
                                    <div style={{ color: '#aaa', fontSize: 12, paddingLeft: 8 }}>No subcategories</div>
                                  )}
                                  {(c.subcategories ?? []).map((s: any) => {
                                    const sid = String(s.id);
                                    const checked = form.subcategoryIds.includes(sid);
                                    const parentCatId = String(c.id);
                                    return (
                                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0 2px 12px', fontWeight: 'normal', cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 14, color: 'var(--admin-text, #222)', margin: 0 }}>
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => {
                                            setForm((f: any) => {
                                              const nextSubs: string[] = checked
                                                ? f.subcategoryIds.filter((x: string) => x !== sid)
                                                : [...f.subcategoryIds, sid];
                                              // If the parent category now has zero selected subcategories,
                                              // also untick the parent category itself.
                                              const parentSubIds = (c.subcategories ?? []).map((x: any) => String(x.id));
                                              const parentStillHasSelectedSub = nextSubs.some((x: string) => parentSubIds.includes(x));
                                              const nextCats: string[] = parentStillHasSelectedSub
                                                ? f.categoryIds
                                                : f.categoryIds.filter((x: string) => x !== parentCatId);
                                              return { ...f, subcategoryIds: nextSubs, categoryIds: nextCats };
                                            });
                                          }}
                                        />
                                        <span>{s.name}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              ))}
                          </div>
                          <span className={styles['field-hint']}>Optional</span>
                        </div>
                        <div className={styles.field}>
                          <label htmlFor="brand">Brand</label>
                          <select id="brand" value={form.brandId} onChange={e => set('brandId', e.target.value)}>
                            <option value="">— Select —</option>
                            {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="status-2">Status</label>
                        <select id="status-2" value={form.status} onChange={e => set('status', e.target.value)}>
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="highlights-one-per-line">Highlights (one per line)</label>
                        <textarea id="highlights-one-per-line" value={form.highlights} onChange={e => set('highlights', e.target.value)} rows={3} placeholder="Free shipping&#10;Dishwasher safe&#10;Lifetime warranty" />
                      </div>
                    </>
                  )}

                  {/* ── Tab: Pricing & Stock ── */}
                  {tab === 'Pricing & Stock' && (
                    <>
                      <div className={styles['section-label']}>Pricing</div>
                      <div className={styles['field-row-3']}>
                        <div className={styles.field}>
                          <label htmlFor="price">Price *</label>
                          <div className={styles['price-input-wrap']}>
                            <span className={styles['price-prefix']}>AED</span>
                            <input id="price" type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
                          </div>
                        </div>
                        <div className={styles.field}>
                          <label htmlFor="compare-at-price">Compare At Price</label>
                          <div className={styles['price-input-wrap']}>
                            <span className={styles['price-prefix']}>AED</span>
                            <input id="compare-at-price" type="number" step="0.01" value={form.compareAtPrice} onChange={e => set('compareAtPrice', e.target.value)} placeholder="0.00" />
                          </div>
                          <span className={styles['field-hint']}>Original price (strikethrough)</span>
                        </div>
                        <div className={styles.field}>
                          <label htmlFor="cost-price">Cost Price</label>
                          <div className={styles['price-input-wrap']}>
                            <span className={styles['price-prefix']}>AED</span>
                            <input id="cost-price" type="number" step="0.01" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} placeholder="0.00" />
                          </div>
                          <span className={styles['field-hint']}>For profit calculation</span>
                        </div>
                      </div>

                      <div className={styles['section-label']}>Inventory</div>
                      <div className={styles['field-row']}>
                        <div className={styles.field}>
                          <label htmlFor="stock-quantity">Stock Quantity</label>
                          <input id="stock-quantity" type="number" value={form.stockQuantity} onChange={e => set('stockQuantity', e.target.value)} />
                        </div>
                        <div className={styles.field}>
                          <label htmlFor="low-stock-threshold">Low Stock Threshold</label>
                          <input id="low-stock-threshold" type="number" value={form.lowStockThreshold} onChange={e => set('lowStockThreshold', e.target.value)} />
                          <span className={styles['field-hint']}>Alert when stock drops below</span>
                        </div>
                      </div>

                      <div className={styles['section-label']}>Badges</div>
                      <div className={styles['toggle-group']}>
                        <TogglePill label="Featured" field="isFeatured" form={form} set={set} />
                        <TogglePill label="New Arrival" field="isNew" form={form} set={set} />
                        <TogglePill label="Best Seller" field="isBestSeller" form={form} set={set} />
                      </div>
                    </>
                  )}

                  {/* ── Tab: Media ── */}
                  {tab === 'Media' && (
                    <>
                      <div className={styles['section-label']}>Product Images</div>
                      <div className={styles['img-gallery']}>
                        {imageUrls.map((url, i) => {
                          const handleRemove = () => {
                            setImageUrls(prev => prev.filter((_, j) => j !== i));
                            setMainImageIndex(prev => {
                              if (i === prev) return 0;
                              if (i < prev) return prev - 1;
                              return prev;
                            });
                          };
                          return (
                            <div key={url} className={`${styles['img-gallery-item']} ${i === mainImageIndex ? styles['img-gallery-item-main'] : ''}`}>
                              <img src={url} alt="" />
                              <button className={styles['img-gallery-remove']} onClick={handleRemove}>×</button>
                              <button
                                className={styles['img-gallery-main-btn']}
                                title={i === mainImageIndex ? 'Main image' : 'Set as main image'}
                                onClick={() => setMainImageIndex(i)}
                              >{i === mainImageIndex ? '★' : '☆'}</button>
                            </div>
                          );
                        })}
                        <button type="button" className={styles['img-gallery-add']} onClick={() => fileRef.current?.click()}>
                          <span style={{ fontSize: 24 }}>+</span>
                          <span>Upload</span>
                        </button>
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                      {imageUrls.length > 0 && (
                        <p className={styles['field-hint']} style={{ marginTop: 8 }}>Click ☆ on an image to set it as the main image shown on the website.</p>
                      )}
                    </>
                  )}

                  {/* ── Tab: Variants ── */}
                  {tab === 'Variants' && (() => {
                    const selectedGroup = productGroups.find(g => g.id === form.productGroupId);
                    const allMembers = selectedGroup?.products ?? [];
                    const currentId = String(editing?.id ?? '');
                    const originalGroupId = String(editing ? ((editing as any).productGroup?.id ?? '') : '');
                    const groupChanged = originalGroupId && form.productGroupId && form.productGroupId !== originalGroupId;
                    return (
                    <>
                      <div className={styles['section-label']}>Editing this product's variant settings</div>
                      <p className={styles['field-hint']} style={{ marginBottom: 12 }}>
                        You are editing <strong>{form.name || '(new product)'}</strong>{form.sku ? ` (SKU ${form.sku})` : ''}.
                        Variants let one product page show siblings (same item in different colors / sizes). Each variant is a separate product with its own SKU, price, and stock.
                      </p>
                      <div className={styles.field}>
                        <label htmlFor="variant-group">Variant Group this product belongs to</label>
                        <select
                          id="variant-group"
                          value={form.productGroupId}
                          onChange={e => {
                            const newId = e.target.value;
                            if (originalGroupId && newId && newId !== originalGroupId) {
                              const ok = confirm(
                                `Move "${form.name}" from its current group to "${productGroups.find(g => g.id === newId)?.name}"?\n\n` +
                                `Its color / size attributes below will stay as-is — review them after switching so they match the new group.`,
                              );
                              if (!ok) return;
                            }
                            set('productGroupId', newId);
                          }}
                        >
                          <option value="">— None (standalone product) —</option>
                          {productGroups.map(g => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.products?.length ?? 0} variants)
                            </option>
                          ))}
                        </select>
                        <span className={styles['field-hint']}>
                          To create a new group, use the "+ New Group" button below.
                        </span>
                      </div>
                      {groupChanged && (
                        <p className={styles['field-hint']} style={{ color: '#b45309', background: '#fef3c7', padding: 8, borderRadius: 4, marginBottom: 12 }}>
                          ⚠ Group changed — Save the product to apply, then double-check Color / Size below.
                        </p>
                      )}
                      <button
                        type="button"
                        className={styles['btn-secondary']}
                        style={{ marginBottom: 16 }}
                        onClick={async () => {
                          const name = prompt('Group name (e.g. "Dallah Vacuum Jug"):');
                          if (!name?.trim()) return;
                          try {
                            const created = await productGroupsApi.create({
                              name: name.trim(),
                              variantAxes: ['color', 'size'],
                            });
                            const fresh = await productGroupsApi.list();
                            setProductGroups(fresh.data ?? []);
                            set('productGroupId', created.id);
                          } catch {
                            alert('Failed to create group.');
                          }
                        }}
                      >
                        + New Group
                      </button>

                      {form.productGroupId && (
                        <>
                          {allMembers.length > 0 && (
                            <>
                              <div className={styles['section-label']} style={{ marginTop: 20 }}>
                                Variants in "{selectedGroup?.name}" ({allMembers.length})
                              </div>
                              <p className={styles['field-hint']} style={{ marginBottom: 10 }}>
                                Edit color, size, and display order for any variant inline. Changed cards turn yellow — click <strong>Save</strong> to persist. <strong>Remove</strong> detaches a product from this group (it becomes standalone, not deleted).
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {allMembers.map(p => (
                                  <VariantCard
                                    key={p.id}
                                    product={p}
                                    groupId={form.productGroupId}
                                    isCurrent={String(p.id) === currentId}
                                    onChanged={() => {
                                      productGroupsApi.list()
                                        .then(r => setProductGroups(r.data ?? []))
                                        .catch(() => { /* keep stale */ });
                                    }}
                                  />
                                ))}
                              </div>
                              {allMembers.some(p => { const a = p.variantAttributes || {}; return !(a.colorName || a.color) || !a.size; }) && (
                                <p className={styles['field-hint']} style={{ color: '#f59e0b', marginTop: 8 }}>
                                  ⚠ Some variants are missing Color or Size — their swatches will appear blank on the product page until filled in.
                                </p>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </>
                    );
                  })()}

                  {/* ── Tab: SEO ── */}
                  {tab === 'SEO' && (
                    <>
                      <div className={styles['section-label']}>Search Engine Optimization</div>
                      <div className={styles.field}>
                        <label htmlFor="meta-title">Meta Title</label>
                        <input id="meta-title" value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)} placeholder="Page title for search engines" />
                        {form.metaTitle && <span className={styles['field-hint']}>{form.metaTitle.length}/60 characters</span>}
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="meta-description">Meta Description</label>
                        <textarea id="meta-description" value={form.metaDescription} onChange={e => set('metaDescription', e.target.value)} placeholder="Short description for search results" rows={3} />
                        {form.metaDescription && <span className={styles['field-hint']}>{form.metaDescription.length}/160 characters</span>}
                      </div>

                      <div className={styles['section-label']}>Specifications</div>
                      <div className={styles.field}>
                        <label htmlFor="specifications-json">Specifications (JSON)</label>
                        <textarea id="specifications-json" value={form.specifications} onChange={e => set('specifications', e.target.value)} rows={6}
                          placeholder={'{\n  "Material": "Stainless Steel",\n  "Weight": "1.2 kg"\n}'} />
                        <span className={styles['field-hint']}>JSON key-value pairs for the spec table</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={closeDrawer}>Cancel</button>
              <button className={styles['btn-primary']} onClick={save} disabled={!form.name.trim() || !form.price || saving}>
                {(() => {
                  if (saving) return 'Saving…';
                  return editing ? 'Update Product' : 'Create Product';
                })()}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════ Bulk Group Modal ══════════ */}
      {bulkOpen && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={() => setBulkOpen(false)} />
          <div className={styles.drawer}>
            <div className={styles['drawer-header']}>
              <h2>Group {selectedIds.size} Product(s)</h2>
              <button className={styles['drawer-close']} onClick={() => setBulkOpen(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles.field}>
                <label>Add to existing group</label>
                <select
                  value={bulkExistingGroupId}
                  onChange={e => setBulkExistingGroupId(e.target.value)}
                >
                  <option value="">— Create new —</option>
                  {productGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.products?.length ?? 0})</option>
                  ))}
                </select>
              </div>
              {!bulkExistingGroupId && (
                <div className={styles.field}>
                  <label>New Group Name *</label>
                  <input
                    value={bulkGroupName}
                    onChange={e => setBulkGroupName(e.target.value)}
                    placeholder="e.g. Ruby Glass Jug"
                  />
                  <span className={styles['field-hint']}>
                    A new group will be created and all selected products linked as variants.
                  </span>
                </div>
              )}
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={() => setBulkOpen(false)}>Cancel</button>
              <button
                className={styles['btn-primary']}
                onClick={submitBulkGroup}
                disabled={bulkBusy || (!bulkExistingGroupId && !bulkGroupName.trim())}
              >
                {bulkBusy ? 'Grouping…' : 'Group'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
