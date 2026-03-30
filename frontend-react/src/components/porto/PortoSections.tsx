import { Link } from 'react-router-dom';
import type { BannerDto, CategoryDto, BrandDto } from '../../types';
import styles from './PortoSections.module.css';

export function HeroSection({ banner }: { banner?: BannerDto }) {
  return (
    <section className={styles.hero}>
      {banner?.imageDesktopUrl && (
        <div className={styles['hero-image']}>
          <img src={banner.imageDesktopUrl} alt={banner.title || 'Hero'} />
        </div>
      )}
      <div className={styles['hero-overlay']} />
      <div className={styles['hero-content']}>
        <h1>{banner?.title || 'Welcome to Solo Ecommerce'}</h1>
        <p>{banner?.subtitle || 'Discover premium products for your lifestyle'}</p>
        {banner?.ctaUrl ? (
          <Link to={banner.ctaUrl} className={styles['hero-cta']}>
            {banner.ctaText || 'SHOP NOW'}
          </Link>
        ) : (
          <Link to="/shop" className={styles['hero-cta']}>SHOP NOW</Link>
        )}
      </div>
      <div className={styles['hero-dots']}>
        <span className={styles['hero-dot-active']} />
        <span className={styles['hero-dot']} />
        <span className={styles['hero-dot']} />
      </div>
    </section>
  );
}

export function CategoryTiles({ categories, title }: { categories: CategoryDto[]; title?: string }) {
  if (!categories.length) return null;
  return (
    <section className={styles['tiles-section']}>
      <h2>{title || 'Shop by Collection'}</h2>
      <div className={styles['tiles-grid']}>
        {categories.slice(0, 4).map(cat => (
          <Link key={cat.id} to={`/category/${cat.slug || cat.id}`} className={styles.tile}>
            {cat.image ? (
              <img src={cat.image} alt={cat.name} />
            ) : (
              <div style={{ background: '#e8e0d4', width: '100%', height: '100%' }} />
            )}
            <div className={styles['tile-overlay']}>
              <span>{cat.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ValuePropsStrip() {
  return (
    <div className={styles['value-props']}>
      <div className={styles['value-prop']}>
        <span className={styles['value-prop-icon']}>🚚</span>
        <div className={styles['value-prop-text']}>
          <h4>Free Shipping</h4>
          <p>On orders over $75</p>
        </div>
      </div>
      <div className={styles['value-prop']}>
        <span className={styles['value-prop-icon']}>↩️</span>
        <div className={styles['value-prop-text']}>
          <h4>Free Returns</h4>
          <p>30-day return policy</p>
        </div>
      </div>
      <div className={styles['value-prop']}>
        <span className={styles['value-prop-icon']}>🔒</span>
        <div className={styles['value-prop-text']}>
          <h4>Secure Payment</h4>
          <p>100% secure checkout</p>
        </div>
      </div>
      <div className={styles['value-prop']}>
        <span className={styles['value-prop-icon']}>💬</span>
        <div className={styles['value-prop-text']}>
          <h4>24/7 Support</h4>
          <p>Dedicated support team</p>
        </div>
      </div>
    </div>
  );
}

export function FreeShippingBanner() {
  return (
    <section className={styles['shipping-banner']}>
      <div className={styles['shipping-banner-content']}>
        <h2>Free Shipping</h2>
        <p>On orders over AED 500</p>
        <Link to="/shop" className={styles['shipping-banner-cta']}>Shop Now</Link>
      </div>
    </section>
  );
}

export function BrandStrip({ brands }: { brands: BrandDto[] }) {
  if (!brands.length) return null;
  return (
    <section className={styles['brand-strip']}>
      <h2>Our Brands</h2>
      <div className={styles['brand-logos']}>
        {brands.map(brand => (
          <Link key={brand.id} to={`/brand/${brand.id}`}>
            {brand.logo ? (
              <img src={brand.logo} alt={brand.name} style={{ height: 40 }} />
            ) : (
              brand.name
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
