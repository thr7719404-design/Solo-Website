import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { ProductDto } from '../types';
import { productsApi } from '../api/products';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import ProductCarousel from '../components/porto/ProductCarousel';
import VariantSelector from '../components/product/VariantSelector';
import styles from './ProductDetailPage.module.css';
import { trackViewItem, trackAddToCart } from '@/lib/analytics';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggle } = useFavorites();

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [related, setRelated] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [addedToCart, setAddedToCart] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    // First load shows full spinner; subsequent variant switches keep the
    // current product visible and just mark it as "switching" for instant feel.
    setSwitching(true);

    productsApi.getById(id)
      .then(p => {
        if (cancelled) return;
        setProduct(p);
        setSelectedImage(0);
        setQuantity(1);
        trackViewItem({
          item_id: p.id,
          item_name: p.name,
          item_brand: p.brand?.name,
          item_category: p.category?.name,
          item_category2: p.subcategory?.name,
          price: p.price,
        });
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setSwitching(false);
      });

    // Related products load independently — they don't block the swap.
    productsApi.getRelated(id, 4)
      .then(rel => { if (!cancelled) setRelated(rel); })
      .catch(() => { /* ignore */ });

    return () => { cancelled = true; };
  }, [id]);

  if (loading && !product) return <div className="loading-spinner" />;
  if (!product) return <div className={styles['detail-page']}><p>Product not found.</p></div>;

  let images: string[];
  if (product.galleryImageUrls?.length) {
    images = product.galleryImageUrls;
  } else {
    const fromImages = product.images?.map(i => i.url || i.media_asset_id).filter(Boolean) as string[] | undefined;
    if (fromImages?.length) {
      images = fromImages;
    } else {
      images = product.imageUrl ? [product.imageUrl] : [];
    }
  }

  const currentImage = images[selectedImage] || '/placeholder.svg';
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const saving = hasDiscount ? product.oldPrice! - product.price : 0;
  const isOutOfStock = product.inStock === false;
  const whatsappPhone = '971557133051';
  const skuSuffix = product.sku ? ` (SKU: ${product.sku})` : '';
  const whatsappMessage = `Hi, I'm interested in a special order for: ${product.name}${skuSuffix}. Is this available?`;
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleAddToCart = async () => {
    if (adding) return;
    setAdding(true);
    try {
      for (let i = 0; i < quantity; i++) {
        await addItem(product.id);
      }
      trackAddToCart({
        item_id: product.id,
        item_name: product.name,
        item_brand: product.brand?.name,
        item_category: product.category?.name,
        item_category2: product.subcategory?.name,
        price: product.price,
      }, quantity);
      setAddedToCart(true);
      toast.success(`${product.name} added to cart`);
      setTimeout(() => setAddedToCart(false), 2500);
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className={styles['detail-page']}
      style={{
        opacity: switching ? 0.55 : 1,
        transition: 'opacity 120ms ease',
        pointerEvents: switching ? 'none' : 'auto',
      }}
      aria-busy={switching}
    >
      <div className={styles.breadcrumb}>
        <Link to="/">Home</Link> / {product.category && (
          <><Link to={`/category/${product.category.slug || product.category.id}`}>{product.category.name}</Link> / </>
        )}
        {product.name}
      </div>

      <div className={styles['product-layout']}>
        <div className={styles.gallery}>
          {images.length > 1 && (
            <div className={styles.thumbnails}>
              {images.map((img, i) => (
                <button
                  key={img}
                  className={i === selectedImage ? styles.active : ''}
                  onClick={() => setSelectedImage(i)}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} loading="lazy" width={80} height={80} />
                </button>
              ))}
            </div>
          )}
          <div className={styles['main-image']}>
            <img
              src={currentImage}
              alt={product.name}
              loading="eager"
              fetchPriority="high"
              width={600}
              height={600}
            />
          </div>
        </div>

        <div className={styles['product-info']}>
          <h1>{product.name}</h1>
          <div className={styles['product-meta']}>
            {product.sku && <span>SKU: {product.sku}</span>}
            {product.brand && <span>{product.brand.name}</span>}
          </div>

          <div className={styles['price-block']}>
            <span className={styles.current}>AED {product.price.toFixed(2)}</span>
            {hasDiscount && (
              <>
                <span className={styles.original}>AED {product.oldPrice!.toFixed(2)}</span>
                <span className={styles.save}>Save AED {saving.toFixed(2)}</span>
              </>
            )}
          </div>

          <div className={`${styles['stock-info']} ${product.inStock !== false ? styles['in-stock'] : styles['out-of-stock']}`}>
            {product.inStock !== false ? '● In Stock' : '○ Available on Request'}
            {product.stock != null && product.inStock !== false && ` (${product.stock} available)`}
          </div>

          {product.variants && product.variants.length > 1 && (
            <VariantSelector
              variants={product.variants}
              axes={product.productGroup?.variantAxes ?? ['color']}
            />
          )}

          {product.shortDescription && (
            <p className={styles.description}>{product.shortDescription}</p>
          )}

          {!isOutOfStock && (
            <div className={styles['quantity-row']}>
              <div className={styles['quantity-control']}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>
          )}

          {isOutOfStock && (
            <div className={styles['oos-notice']}>
              This item is available on request. Chat with us on WhatsApp to arrange a special order.
            </div>
          )}

          <div className={styles['action-buttons']}>
            {isOutOfStock ? (
              <a
                className={styles['btn-whatsapp']}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact seller on WhatsApp for a special order"
              >
                <svg
                  className={styles['btn-whatsapp-icon']}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.413c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886a9.86 9.86 0 001.516 5.26l-.999 3.648 3.972-1.041zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>Contact Seller on WhatsApp</span>
              </a>
            ) : (
              <button
                className={`${styles['btn-cart']} ${addedToCart ? styles['btn-cart-added'] : ''}`}
                onClick={handleAddToCart}
                disabled={adding}
              >
                {(() => {
                  if (addedToCart) return '✓ Added!';
                  if (adding) return 'Adding...';
                  return 'Add to Cart';
                })()}
              </button>
            )}
            {isAuthenticated && (
              <button
                className={`${styles['btn-fav']} ${isFavorite(product.id) ? styles.active : ''}`}
                onClick={() => toggle(product.id)}
              >
                {isFavorite(product.id) ? '♥' : '♡'}
              </button>
            )}
          </div>

          {product.deliveryNote && (
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>📦 {product.deliveryNote}</p>
          )}
          {product.returnsNote && (
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>↩️ {product.returnsNote}</p>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        <div className={styles['tab-headers']}>
          <button className={activeTab === 'description' ? styles.active : ''} onClick={() => setActiveTab('description')}>
            Description
          </button>
          {product.specifications?.length ? (
            <button className={activeTab === 'specs' ? styles.active : ''} onClick={() => setActiveTab('specs')}>
              Specifications
            </button>
          ) : null}
          {product.highlights?.length ? (
            <button className={activeTab === 'highlights' ? styles.active : ''} onClick={() => setActiveTab('highlights')}>
              Highlights
            </button>
          ) : null}
        </div>
        <div className={styles['tab-content']}>
          {activeTab === 'description' && (
            <div>{product.fullDescription || product.description || 'No description available.'}</div>
          )}
          {activeTab === 'specs' && product.specifications && Array.isArray(product.specifications) && (
            <table className={styles['specs-table']}>
              <tbody>
                {(product.specifications as Array<{ key: string; value: string }>).map((s) => (
                  <tr key={s.key}><td>{s.key}</td><td>{s.value}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 'highlights' && product.highlights && (
            <ul style={{ paddingLeft: 20 }}>
              {product.highlights.map((h) => <li key={h}>{h}</li>)}
            </ul>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <ProductCarousel title="Related Products" products={related} />
      )}
    </div>
  );
}
