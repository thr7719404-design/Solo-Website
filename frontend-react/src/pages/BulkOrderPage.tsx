import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bulkOrdersApi, BulkOrderItem, BulkOrderRequest } from '@/api/bulkOrders';
import { useCatalog } from '@/contexts/CatalogContext';
import type { CategoryDto } from '@/types';

const COUNTRY_CODES = [
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+966', label: '🇸🇦 +966' },
  { code: '+968', label: '🇴🇲 +968' },
  { code: '+973', label: '🇧🇭 +973' },
  { code: '+974', label: '🇶🇦 +974' },
  { code: '+965', label: '🇰🇼 +965' },
  { code: '+962', label: '🇯🇴 +962' },
  { code: '+961', label: '🇱🇧 +961' },
  { code: '+20', label: '🇪🇬 +20' },
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+1', label: '🇺🇸 +1' },
];

interface SearchResult {
  id: number;
  productName?: string;
  name?: string;
  sku?: string;
  price?: number;
  images?: { url: string }[];
}

export default function BulkOrderPage() {
  const { categories } = useCatalog();
  const [isMobile, setIsMobile] = useState(() => {
    if (globalThis.window === undefined) {
      return false;
    }
    return globalThis.window.innerWidth <= 640;
  });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+971');
  const [phone, setPhone] = useState('');
  const [items, setItems] = useState<BulkOrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [defaultProducts, setDefaultProducts] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<BulkOrderRequest | null>(null);
  const [error, setError] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [browsingCategory, setBrowsingCategory] = useState<CategoryDto | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<SearchResult[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load default products once
  useEffect(() => {
    bulkOrdersApi.getDefaultProducts().then(setDefaultProducts).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const mediaQuery = globalThis.window.matchMedia('(max-width: 640px)');
    const updateMobileState = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };
    updateMobileState(mediaQuery);
    const listener = (event: MediaQueryListEvent) => updateMobileState(event);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await bulkOrdersApi.searchProducts(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const onSearchChange = (val: string) => {
    setSearchQuery(val);
    setBrowsingCategory(null);
    setCategoryProducts([]);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  };

  const onFocusSearch = () => {
    setShowDropdown(true);
  };

  const selectCategory = async (cat: CategoryDto) => {
    const subs = cat.subcategories || cat.children || [];
    if (subs.length > 0) {
      setBrowsingCategory(cat);
      setCategoryProducts([]);
      return;
    }
    // Leaf category — load products
    // If we're navigating into something while already inside a parent, it's a subcategory.
    // Also handles backend variants that expose either `parentId` or `categoryId` on subs.
    const isSubcategory =
      browsingCategory != null ||
      (cat as any).parentId != null ||
      (cat as any).categoryId != null;
    setBrowsingCategory(cat);
    setLoadingCategory(true);
    try {
      const prods = await bulkOrdersApi.getProductsByCategory(cat.id, isSubcategory);
      setCategoryProducts(prods);
    } catch {
      setCategoryProducts([]);
    } finally {
      setLoadingCategory(false);
    }
  };

  const goBackCategories = () => {
    if (!browsingCategory) return;

    // If we're showing products inside a leaf, first step back to its
    // subcategory listing (parent category).
    if (categoryProducts.length > 0 || loadingCategory) {
      // fall through to parent lookup below
    }

    // A subcategory carries an explicit `categoryId` (or `parentId`) pointing
    // at its parent top-level category. Top-level categories have neither,
    // so going back from them returns to the initial dropdown view.
    const parentRefId =
      (browsingCategory as any).categoryId ??
      (browsingCategory as any).parentId ??
      (browsingCategory as any).parent_id ??
      null;

    if (parentRefId == null) {
      setBrowsingCategory(null);
      setCategoryProducts([]);
      return;
    }

    const parent = categories.find(c => String(c.id) === String(parentRefId)) ?? null;
    setBrowsingCategory(parent);
    setCategoryProducts([]);
  };

  const addProduct = (product: SearchResult) => {
    const productName = product.productName || product.name || 'Product';
    const existing = items.findIndex((i) => i.productId === product.id);
    if (existing >= 0) {
      // Increment quantity if already in list
      const updated = [...items];
      updated[existing].quantity += 1;
      setItems(updated);
    } else {
      setItems([...items, {
        productId: product.id,
        productName,
        sku: product.sku || '',
        quantity: 1,
        price: product.price || 0,
      }]);
    }
    setSearchQuery('');
    setShowDropdown(false);
    setBrowsingCategory(null);
    setCategoryProducts([]);
  };

  const updateQuantity = (idx: number, qty: number) => {
    if (qty < 1) return;
    const updated = [...items];
    updated[idx].quantity = qty;
    setItems(updated);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email'); return; }
    if (!phone.trim()) { setError('Please enter your phone number'); return; }
    if (items.length === 0) { setError('Please add at least one product'); return; }

    setSubmitting(true);
    try {
      const result = await bulkOrdersApi.submit({ name: name.trim(), email: email.trim(), phone: phone.trim(), countryCode, items });
      setSubmittedOrder(result);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <SubmittedView submittedOrder={submittedOrder} email={email} />;
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '24px 14px 48px' : '32px 16px 64px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Bulk Order Request</h1>
        <p style={{ color: '#666', fontSize: isMobile ? 14 : 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.5 }}>
          Looking to order in bulk? Fill out the form below and our team will get back to you with pricing and availability.
        </p>
      </div>

      {/* Contact Info */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5',
        padding: isMobile ? 16 : 24, marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1A1A1A' }}>Your Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div>
            <label htmlFor="full-name" style={labelStyle}>Full Name *</label>
            <input id="full-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
              style={inputStyle} />
          </div>
          <div>
            <label htmlFor="email-address" style={labelStyle}>Email Address *</label>
            <input id="email-address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
              style={inputStyle} />
          </div>
          <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
            <label htmlFor="mobile-number" style={labelStyle}>Mobile Number *</label>
            <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
              <select id="mobile-number" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                style={{ ...inputStyle, width: isMobile ? '100%' : 120, flexShrink: 0 }}>
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <input value={phone} onChange={(e) => setPhone(e.target.value.replaceAll(/[^\d]/g, ''))}
                placeholder="501234567" style={{ ...inputStyle, flex: 1 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Product Search + List */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e5e5e5',
        padding: isMobile ? 16 : 24, marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1A1A1A' }}>Products</h2>

        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative', marginBottom: 16 }}>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={onFocusSearch}
            placeholder="Search products by name or SKU..."
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
          />
          {searching && (
            <div style={{ position: 'absolute', right: 12, top: 10, color: '#999', fontSize: 13 }}>Searching...</div>
          )}

          {/* Dropdown */}
          {showDropdown && (
            <SearchDropdown
              isMobile={isMobile}
              browsingCategory={browsingCategory}
              goBackCategories={goBackCategories}
              searchQuery={searchQuery}
              searchResults={searchResults}
              searching={searching}
              loadingCategory={loadingCategory}
              categoryProducts={categoryProducts}
              categories={categories}
              defaultProducts={defaultProducts}
              addProduct={addProduct}
              selectCategory={selectCategory}
            />
          )}
        </div>

        {/* Items Table */}
        {items.length > 0 ? (
          <ItemsList
            items={items}
            isMobile={isMobile}
            editingIdx={editingIdx}
            setEditingIdx={setEditingIdx}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#999' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <p style={{ fontSize: 14 }}>Search and add products above to build your bulk order</p>
          </div>
        )}
      </div>

      {/* Error + Submit */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
          padding: '12px 16px', marginBottom: 16, color: '#b91c1c', fontSize: 14,
        }}>{error}</div>
      )}

      <button onClick={handleSubmit} disabled={submitting} style={{
        width: '100%', padding: '14px 24px', background: submitting ? '#999' : '#1A1A1A',
        color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600,
        cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
      }}>
        {submitting ? 'Submitting...' : 'Submit Bulk Order Request'}
      </button>
    </div>
  );
}

/* Submitted confirmation view */
function SubmittedView({ submittedOrder, email }: Readonly<{ submittedOrder: BulkOrderRequest | null; email: string }>) {
  const orderNum = submittedOrder?.orderNumber
    ? `BO-${String(submittedOrder.orderNumber).padStart(4, '0')}`
    : null;
  const emailConfirmationMessage = submittedOrder?.confirmationEmailSent
    ? <span> A confirmation email has been sent to <strong>{email}</strong>.</span>
    : <span> Our team has received the request and will contact you shortly.</span>;
  return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: '#1A1A1A' }}>Request Submitted!</h2>
      {orderNum && (
        <div style={{
          display: 'inline-block', background: '#f8f8f6', padding: '10px 24px', borderRadius: 8,
          marginBottom: 16, fontSize: 18, fontWeight: 700, color: '#B8860B',
        }}>
          {orderNum}
        </div>
      )}
      <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
        Thank you for your bulk order request.
        {emailConfirmationMessage}
        {' '}Our team will review your request and contact you shortly.
      </p>
      <Link to="/" style={{
        display: 'inline-block', padding: '12px 32px', background: '#1A1A1A', color: '#fff',
        borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14,
      }}>Continue Shopping</Link>
    </div>
  );
}

/* Category browse button */
function CategoryButton({ cat, onSelect }: Readonly<{ cat: CategoryDto; onSelect: (c: CategoryDto) => void }>) {
  return (
    <button type="button" onClick={() => onSelect(cat)} style={{
      padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0',
      transition: 'background 0.15s', width: '100%', background: '#fff', border: 'none',
      textAlign: 'left' as const,
    }}
      onMouseEnter={e => { e.currentTarget.style.background = '#faf6ed'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
      onFocus={e => { e.currentTarget.style.background = '#faf6ed'; }}
      onBlur={e => { e.currentTarget.style.background = '#fff'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>📁</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>{cat.name}</span>
        {cat.productCount != null && (
          <span style={{ fontSize: 12, color: '#999' }}>({cat.productCount})</span>
        )}
      </div>
      <span style={{ color: '#999', fontSize: 13 }}>→</span>
    </button>
  );
}

interface SearchDropdownProps {
  isMobile: boolean;
  browsingCategory: CategoryDto | null;
  goBackCategories: () => void;
  searchQuery: string;
  searchResults: SearchResult[];
  searching: boolean;
  loadingCategory: boolean;
  categoryProducts: SearchResult[];
  categories: CategoryDto[];
  defaultProducts: SearchResult[];
  addProduct: (p: SearchResult) => void;
  selectCategory: (c: CategoryDto) => void;
}

function renderSearchResults(props: Pick<SearchDropdownProps, 'searchResults' | 'searching' | 'addProduct'>) {
  if (props.searchResults.length > 0) {
    return props.searchResults.map(p => <ProductRow key={p.id} product={p} onAdd={props.addProduct} />);
  }
  if (!props.searching) {
    return <div style={{ padding: 16, textAlign: 'center', color: '#999', fontSize: 14 }}>No products found</div>;
  }
  return null;
}

function renderCategoryProducts(props: Pick<SearchDropdownProps, 'loadingCategory' | 'categoryProducts' | 'browsingCategory' | 'addProduct'>) {
  if (props.loadingCategory) {
    return <div style={{ padding: 16, textAlign: 'center', color: '#999', fontSize: 13 }}>Loading products...</div>;
  }
  if (props.categoryProducts.length > 0) {
    return props.categoryProducts.map(p => <ProductRow key={p.id} product={p} onAdd={props.addProduct} />);
  }
  const subs = props.browsingCategory ? (props.browsingCategory.subcategories || props.browsingCategory.children || []) : [];
  if (subs.length === 0) {
    return <div style={{ padding: 16, textAlign: 'center', color: '#999', fontSize: 14 }}>No products in this category</div>;
  }
  return null;
}

function renderBrowsingCategory(props: SearchDropdownProps) {
  const subs = props.browsingCategory ? (props.browsingCategory.subcategories || props.browsingCategory.children || []) : [];
  return (
    <>
      {subs.map(sub => <CategoryButton key={sub.id} cat={sub} onSelect={props.selectCategory} />)}
      {renderCategoryProducts(props)}
    </>
  );
}

function renderDefaultView(props: SearchDropdownProps) {
  const activeCategories = props.categories.filter(c => c.isActive !== false);
  return (
    <>
      {activeCategories.length > 0 && (
        <>
          <div style={{
            padding: '8px 14px', fontSize: 11, fontWeight: 600, color: '#999',
            textTransform: 'uppercase', letterSpacing: 1, background: '#f8f8f6',
            borderBottom: '1px solid #eee',
          }}>Browse by Category</div>
          {activeCategories.map(cat => <CategoryButton key={cat.id} cat={cat} onSelect={props.selectCategory} />)}
        </>
      )}
      {props.defaultProducts.length > 0 && (
        <>
          <div style={{
            padding: '8px 14px', fontSize: 11, fontWeight: 600, color: '#999',
            textTransform: 'uppercase', letterSpacing: 1, background: '#f8f8f6',
            borderBottom: '1px solid #eee',
          }}>Popular Products</div>
          {props.defaultProducts.map(p => <ProductRow key={p.id} product={p} onAdd={props.addProduct} />)}
        </>
      )}
    </>
  );
}

function renderDropdownContent(props: SearchDropdownProps) {
  if (props.searchQuery.length >= 2) {
    return renderSearchResults(props);
  }
  if (props.browsingCategory) {
    return renderBrowsingCategory(props);
  }
  return renderDefaultView(props);
}

function SearchDropdown(props: Readonly<SearchDropdownProps>) {
  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
      background: '#fff', border: '1px solid #ddd', borderRadius: 8,
      maxHeight: props.isMobile ? 320 : 380, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    }}>
      {props.browsingCategory && (
        <div style={{
          padding: '8px 14px', background: '#f8f8f6', borderBottom: '1px solid #eee',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
        }}>
          <button onClick={props.goBackCategories} style={{
            background: 'none', border: 'none', color: '#B8860B', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, padding: 0,
          }}>← Back</button>
          <span style={{ color: '#999' }}>|</span>
          <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{props.browsingCategory.name}</span>
        </div>
      )}
      {renderDropdownContent(props)}
    </div>
  );
}

interface ItemQuantityControlProps {
  item: BulkOrderItem;
  idx: number;
  editingIdx: number | null;
  setEditingIdx: (idx: number | null) => void;
  updateQuantity: (idx: number, qty: number) => void;
  inputWidth: number;
  buttonMinWidth: number;
  inputPadding: string;
  fontSize: number;
}

function ItemQuantityControl(props: Readonly<ItemQuantityControlProps>) {
  const { item, idx, editingIdx, setEditingIdx, updateQuantity, inputWidth, buttonMinWidth, inputPadding, fontSize } = props;
  if (editingIdx === idx) {
    return (
      <input type="number" min={1} value={item.quantity}
        onChange={(e) => updateQuantity(idx, Number.parseInt(e.target.value, 10) || 1)}
        onBlur={() => setEditingIdx(null)}
        autoFocus
        style={{ width: inputWidth, textAlign: 'center', padding: inputPadding, border: '1px solid #B8860B', borderRadius: 4, fontSize: 14 }}
      />
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      <button onClick={() => updateQuantity(idx, item.quantity - 1)} style={qtyBtnStyle} disabled={item.quantity <= 1}>−</button>
      <button type="button" onClick={() => setEditingIdx(idx)} style={{
        minWidth: buttonMinWidth, textAlign: 'center', cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none', fontSize,
      }}>{item.quantity}</button>
      <button onClick={() => updateQuantity(idx, item.quantity + 1)} style={qtyBtnStyle}>+</button>
    </div>
  );
}

interface ItemsListProps {
  items: BulkOrderItem[];
  isMobile: boolean;
  editingIdx: number | null;
  setEditingIdx: (idx: number | null) => void;
  updateQuantity: (idx: number, qty: number) => void;
  removeItem: (idx: number) => void;
}

function MobileItemCard(props: Readonly<{ item: BulkOrderItem; idx: number } & Pick<ItemsListProps, 'editingIdx' | 'setEditingIdx' | 'updateQuantity' | 'removeItem'>>) {
  const { item, idx, editingIdx, setEditingIdx, updateQuantity, removeItem } = props;
  const lineTotal = (item.price || 0) * item.quantity;
  return (
    <div style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: 14, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', marginBottom: 4 }}>{item.productName}</div>
          <div style={{ fontSize: 12, color: '#888' }}>SKU: {item.sku || '-'}</div>
        </div>
        <button onClick={() => removeItem(idx)} style={{
          background: 'none', border: 'none', color: '#c00', cursor: 'pointer', fontSize: 12, fontWeight: 600,
        }}>Remove</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>Unit Price</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{item.price ? `AED ${item.price.toFixed(2)}` : '-'}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>Line Total</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{lineTotal ? `AED ${lineTotal.toFixed(2)}` : '-'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Quantity</div>
        <ItemQuantityControl
          item={item} idx={idx} editingIdx={editingIdx} setEditingIdx={setEditingIdx} updateQuantity={updateQuantity}
          inputWidth={84} buttonMinWidth={34} inputPadding="6px 8px" fontSize={14}
        />
      </div>
    </div>
  );
}

function DesktopItemRow(props: Readonly<{ item: BulkOrderItem; idx: number } & Pick<ItemsListProps, 'editingIdx' | 'setEditingIdx' | 'updateQuantity' | 'removeItem'>>) {
  const { item, idx, editingIdx, setEditingIdx, updateQuantity, removeItem } = props;
  const lineTotal = (item.price || 0) * item.quantity;
  return (
    <tr style={{ borderBottom: '1px solid #eee' }}>
      <td style={tdStyle}>{idx + 1}</td>
      <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500 }}>{item.productName}</td>
      <td style={tdStyle}>{item.sku || '-'}</td>
      <td style={tdStyle}>{item.price ? `AED ${item.price.toFixed(2)}` : '-'}</td>
      <td style={tdStyle}>
        <ItemQuantityControl
          item={item} idx={idx} editingIdx={editingIdx} setEditingIdx={setEditingIdx} updateQuantity={updateQuantity}
          inputWidth={60} buttonMinWidth={28} inputPadding="4px 6px" fontSize={14}
        />
      </td>
      <td style={{ ...tdStyle, fontWeight: 600, color: lineTotal ? '#1A1A1A' : undefined }}>
        {lineTotal ? `AED ${lineTotal.toFixed(2)}` : '-'}
      </td>
      <td style={tdStyle}>
        <button onClick={() => removeItem(idx)} style={{
          background: 'none', border: 'none', color: '#c00', cursor: 'pointer',
          fontSize: 13, fontWeight: 500, padding: '4px 8px',
        }}>Remove</button>
      </td>
    </tr>
  );
}

function ItemsList(props: Readonly<ItemsListProps>) {
  const { items, isMobile } = props;
  return (
    <div style={{ overflowX: 'auto' }}>
      {isMobile ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((item, idx) => (
            <MobileItemCard key={`${item.productId}-${idx}`} item={item} idx={idx}
              editingIdx={props.editingIdx} setEditingIdx={props.setEditingIdx}
              updateQuantity={props.updateQuantity} removeItem={props.removeItem} />
          ))}
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f8f6' }}>
              <th style={thStyle}>#</th>
              <th style={{ ...thStyle, textAlign: 'left' }}>Product</th>
              <th style={thStyle}>SKU</th>
              <th style={thStyle}>Unit Price</th>
              <th style={thStyle}>Quantity</th>
              <th style={thStyle}>Line Total</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <DesktopItemRow key={`${item.productId ?? item.sku ?? 'row'}-${idx}`} item={item} idx={idx}
                editingIdx={props.editingIdx} setEditingIdx={props.setEditingIdx}
                updateQuantity={props.updateQuantity} removeItem={props.removeItem} />
            ))}
          </tbody>
        </table>
      )}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end',
        flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0,
        marginTop: 12, paddingTop: 12, borderTop: '2px solid #eee',
      }}>
        <div style={{ fontSize: 13, color: '#888' }}>
          {items.length} product{items.length === 1 ? '' : 's'} · {items.reduce((s, i) => s + i.quantity, 0)} total units
        </div>
        <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>Estimated Total</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A' }}>
            AED {items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0).toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Final pricing confirmed after review</div>
        </div>
      </div>
    </div>
  );
}

/* Reusable product row in dropdown */
function ProductRow({ product, onAdd }: Readonly<{ product: SearchResult; onAdd: (p: SearchResult) => void }>) {
  return (
    <button type="button" onClick={() => onAdd(product)} style={{
      padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
      borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s', width: '100%',
      background: '#fff', border: 'none', textAlign: 'left' as const,
    }}
      onMouseEnter={e => { e.currentTarget.style.background = '#faf6ed'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
      onFocus={e => { e.currentTarget.style.background = '#faf6ed'; }}
      onBlur={e => { e.currentTarget.style.background = '#fff'; }}
    >
      {product.images?.[0]?.url && (
        <img src={product.images[0].url} alt="" loading="lazy" width={36} height={36} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {product.productName || product.name}
        </div>
        <div style={{ fontSize: 12, color: '#999', display: 'flex', gap: 8 }}>
          {product.sku && <span>SKU: {product.sku}</span>}
          {product.price != null && product.price > 0 && (
            <span style={{ color: '#B8860B', fontWeight: 500 }}>AED {product.price.toFixed(2)}</span>
          )}
        </div>
      </div>
      <span style={{ fontSize: 18, color: '#B8860B', fontWeight: 700 }}>+</span>
    </button>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 4,
};
const inputStyle: React.CSSProperties = {
  border: '1px solid #ddd', borderRadius: 6, padding: '10px 12px', fontSize: 14,
  outline: 'none', transition: 'border-color 0.2s',
};
const thStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#666', textAlign: 'center',
  borderBottom: '2px solid #B8860B', textTransform: 'uppercase', letterSpacing: '0.5px',
};
const tdStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 14, textAlign: 'center', verticalAlign: 'middle',
};
const qtyBtnStyle: React.CSSProperties = {
  width: 26, height: 26, border: '1px solid #ddd', borderRadius: 4, background: '#fff',
  cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center',
};
