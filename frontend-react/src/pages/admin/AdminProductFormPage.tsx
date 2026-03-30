import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsApi } from '@/api/products';
import { categoriesApi } from '@/api/categories';
import { brandsApi } from '@/api/brands';
import { mediaApi } from '@/api/admin';
import type { ProductDto, CategoryDto, BrandDto } from '@/types';
import styles from './Admin.module.css';

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [brands, setBrands] = useState<BrandDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  const [form, setForm] = useState({
    name: '', slug: '', sku: '', description: '', shortDescription: '',
    price: '', compareAtPrice: '', costPrice: '',
    categoryId: '', brandId: '',
    stockQuantity: '0', lowStockThreshold: '5',
    isFeatured: false, isNew: false, isBestSeller: false,
    status: 'active',
    metaTitle: '', metaDescription: '',
    specifications: '' as string,
    highlights: '' as string,
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      categoriesApi.getAll(),
      brandsApi.getAll(),
      !isNew ? productsApi.getById(id!) : Promise.resolve(null),
    ]).then(([catRes, brandRes, prodRes]) => {
      setCategories(Array.isArray(catRes) ? catRes : []);
      setBrands(Array.isArray(brandRes) ? brandRes : []);
      if (prodRes) {
        const p: ProductDto = prodRes;
        setForm({
          name: p.name, slug: p.slug ?? '', sku: p.sku ?? '', description: p.description ?? '',
          shortDescription: p.shortDescription ?? '',
          price: String(p.price), compareAtPrice: String(p.compareAtPrice ?? ''),
          costPrice: String(p.costPrice ?? ''),
          categoryId: p.categoryId ?? '', brandId: p.brandId ?? '',
          stockQuantity: String(p.stockQuantity ?? 0), lowStockThreshold: String(p.lowStockThreshold ?? 5),
          isFeatured: p.isFeatured ?? false, isNew: p.isNew ?? false, isBestSeller: p.isBestSeller ?? false,
          status: p.status ?? 'active',
          metaTitle: p.metaTitle ?? '', metaDescription: p.metaDescription ?? '',
          specifications: typeof p.specifications === 'string' ? p.specifications : JSON.stringify(p.specifications ?? '', null, 2),
          highlights: Array.isArray(p.highlights) ? p.highlights.join('\n') : (p.highlights ?? ''),
        });
        setImageUrls((p.images ?? []).map(i => i.url));
      }
      setLoading(false);
    });
  }, [id, isNew]);

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const res = await mediaApi.upload(file);
      setImageUrls(prev => [...prev, res.data.url]);
    }
  };

  const save = async () => {
    setSaving(true);
    const payload: any = {
      ...form,
      price: parseFloat(form.price) || 0,
      compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
      costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
      stockQuantity: parseInt(form.stockQuantity) || 0,
      lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
      images: imageUrls.map((url, i) => ({ url, displayOrder: i, altText: form.name })),
      highlights: form.highlights.split('\n').filter(Boolean),
    };
    try {
      if (form.specifications) payload.specifications = JSON.parse(form.specifications);
    } catch { /* leave as string */ }

    try {
      if (isNew) {
        await productsApi.create(payload);
      } else {
        await productsApi.update(id!, payload);
      }
      navigate('/admin/products');
    } catch (err) {
      alert('Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles['admin-body']}><div className="loading-spinner" /></div>;

  return (
    <>
      <div className={styles['admin-header']}>
        <h1>{isNew ? 'New Product' : 'Edit Product'}</h1>
      </div>
      <div className={styles['admin-body']}>
        <div className={styles['admin-form']}>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className={styles['form-group']}>
              <label>SKU</label>
              <input value={form.sku} onChange={e => set('sku', e.target.value)} />
            </div>
          </div>
          <div className={styles['form-group']}>
            <label>Slug</label>
            <input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-generated if empty" />
          </div>
          <div className={styles['form-group']}>
            <label>Short Description</label>
            <input value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} />
          </div>
          <div className={styles['form-group']}>
            <label>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Price</label>
              <input type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required />
            </div>
            <div className={styles['form-group']}>
              <label>Compare At Price</label>
              <input type="number" step="0.01" value={form.compareAtPrice} onChange={e => set('compareAtPrice', e.target.value)} />
            </div>
          </div>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Category</label>
              <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                <option value="">— Select —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className={styles['form-group']}>
              <label>Brand</label>
              <select value={form.brandId} onChange={e => set('brandId', e.target.value)}>
                <option value="">— Select —</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Stock Quantity</label>
              <input type="number" value={form.stockQuantity} onChange={e => set('stockQuantity', e.target.value)} />
            </div>
            <div className={styles['form-group']}>
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <label><input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} /> Featured</label>
            <label><input type="checkbox" checked={form.isNew} onChange={e => set('isNew', e.target.checked)} /> New</label>
            <label><input type="checkbox" checked={form.isBestSeller} onChange={e => set('isBestSeller', e.target.checked)} /> Best Seller</label>
          </div>
          <div className={styles['form-group']}>
            <label>Highlights (one per line)</label>
            <textarea value={form.highlights} onChange={e => set('highlights', e.target.value)} rows={4} />
          </div>
          <div className={styles['form-group']}>
            <label>Specifications (JSON)</label>
            <textarea value={form.specifications} onChange={e => set('specifications', e.target.value)} rows={4} />
          </div>
          <div className={styles['form-group']}>
            <label>Images</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {imageUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', border: '1px solid #e5e5e5' }} />
                  <button
                    onClick={() => setImageUrls(prev => prev.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#991b1b', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer' }}
                  >×</button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
          </div>
          <div className={styles['form-actions']}>
            <button className="btn btn-accent" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</button>
            <button className="btn btn-outline" onClick={() => navigate('/admin/products')}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  );
}
