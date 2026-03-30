import { Link } from 'react-router-dom';
import type { ProductDto } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import styles from './ProductCard.module.css';

interface Props {
  product: ProductDto;
}

export default function ProductCard({ product }: Props) {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggle } = useFavorites();

  const imageUrl = product.imageUrl
    || product.images?.[0]?.url
    || product.images?.[0]?.media_asset_id
    || '/placeholder.svg';

  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.oldPrice!) * 100)
    : 0;

  return (
    <div className={styles.card}>
      <div className={styles['image-wrap']}>
        <Link to={`/product/${product.id}`}>
          <img src={imageUrl} alt={product.name} loading="lazy" />
        </Link>
        <div className={styles.badges}>
          {product.isBestSeller && <span className={`${styles.badge} ${styles['badge-best']}`}>BESTSELLER</span>}
          {product.isNew && <span className={`${styles.badge} ${styles['badge-new']}`}>NEW</span>}
          {hasDiscount && <span className={`${styles.badge} ${styles['badge-sale']}`}>-{discountPct}%</span>}
        </div>
        {isAuthenticated && (
          <button
            className={`${styles['wishlist-btn']} ${isFavorite(product.id) ? styles.favorited : ''}`}
            onClick={() => toggle(product.id)}
            title="Toggle favorite"
          >
            {isFavorite(product.id) ? '♥' : '♡'}
          </button>
        )}
      </div>
      <div className={styles.info}>
        {product.category && (
          <div className={styles.category}>{product.category.name}</div>
        )}
        <div className={styles.name}>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </div>
        <div className={styles['price-row']}>
          <span className={styles.price}>AED {product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className={styles['old-price']}>AED {product.oldPrice!.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
