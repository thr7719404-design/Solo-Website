import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { ProductDto } from '../types';
import { productsApi } from '../api/products';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import ProductCarousel from '../components/porto/ProductCarousel';
import styles from './ProductDetailPage.module.css';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggle } = useFavorites();

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [related, setRelated] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setSelectedImage(0);
    setQuantity(1);
    Promise.all([
      productsApi.getById(id),
      productsApi.getRelated(id, 4).catch(() => []),
    ]).then(([p, rel]) => {
      setProduct(p);
      setRelated(rel);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-spinner" />;
  if (!product) return <div className={styles['detail-page']}><p>Product not found.</p></div>;

  const images = product.galleryImageUrls?.length
    ? product.galleryImageUrls
    : product.images?.map(i => i.url || i.media_asset_id).filter(Boolean) as string[]
    || (product.imageUrl ? [product.imageUrl] : []);

  const currentImage = images[selectedImage] || '/placeholder.svg';
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const saving = hasDiscount ? product.oldPrice! - product.price : 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) return;
    for (let i = 0; i < quantity; i++) {
      await addItem(product.id);
    }
  };

  return (
    <div className={styles['detail-page']}>
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
                  key={i}
                  className={i === selectedImage ? styles.active : ''}
                  onClick={() => setSelectedImage(i)}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
          <div className={styles['main-image']}>
            <img src={currentImage} alt={product.name} />
          </div>
        </div>

        <div className={styles['product-info']}>
          <h1>{product.name}</h1>
          <div className={styles['product-meta']}>
            {product.sku && <span>SKU: {product.sku}</span>}
            {product.brand && <span>{product.brand.name}</span>}
          </div>

          <div className={styles['price-block']}>
            <span className={styles.current}>${product.price.toFixed(2)}</span>
            {hasDiscount && (
              <>
                <span className={styles.original}>${product.oldPrice!.toFixed(2)}</span>
                <span className={styles.save}>Save ${saving.toFixed(2)}</span>
              </>
            )}
          </div>

          <div className={`${styles['stock-info']} ${product.inStock !== false ? styles['in-stock'] : styles['out-of-stock']}`}>
            {product.inStock !== false ? '● In Stock' : '○ Out of Stock'}
            {product.stock != null && product.inStock !== false && ` (${product.stock} available)`}
          </div>

          {product.shortDescription && (
            <p className={styles.description}>{product.shortDescription}</p>
          )}

          <div className={styles['quantity-row']}>
            <div className={styles['quantity-control']}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          <div className={styles['action-buttons']}>
            <button className={styles['btn-cart']} onClick={handleAddToCart} disabled={!isAuthenticated}>
              {isAuthenticated ? 'Add to Cart' : 'Sign in to Buy'}
            </button>
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
                {(product.specifications as Array<{ key: string; value: string }>).map((s, i) => (
                  <tr key={i}><td>{s.key}</td><td>{s.value}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 'highlights' && product.highlights && (
            <ul style={{ paddingLeft: 20 }}>
              {product.highlights.map((h, i) => <li key={i}>{h}</li>)}
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
