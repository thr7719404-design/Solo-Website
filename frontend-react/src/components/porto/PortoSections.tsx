import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { BannerDto, BrandDto } from '../../types';
import styles from './PortoSections.module.css';

export function HeroSection({ banners = [] }: Readonly<{ banners?: BannerDto[] }>) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const count = banners.length;

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % count) + count) % count);
  }, [count]);

  useEffect(() => {
    if (count <= 1) return;
    timerRef.current = setInterval(() => goTo(current + 1), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [count, current, goTo]);

  const slide = banners[current];

  return (
    <section className={styles.hero}>
      {slide?.imageDesktopUrl && (
        <div className={styles['hero-image']}>
          <img
            src={slide.imageDesktopUrl}
            alt={slide.title || 'Hero'}
            loading="eager"
            fetchPriority="high"
            width={1920}
            height={600}
          />
        </div>
      )}
      <div className={styles['hero-overlay']} />
      <div className={styles['hero-content']}>
        <h1>{slide?.title || 'Welcome to Solo Ecommerce'}</h1>
        <p>{slide?.subtitle || 'Discover premium products for your lifestyle'}</p>
        {slide?.ctaUrl ? (
          <Link to={slide.ctaUrl} className={styles['hero-cta']}>
            {slide.ctaText || 'SHOP NOW'}
          </Link>
        ) : (
          <Link to="/products" className={styles['hero-cta']}>SHOP NOW</Link>
        )}
      </div>

      {count > 1 && (
        <>
          <button className={styles['hero-arrow'] + ' ' + styles['hero-arrow-left']} onClick={() => goTo(current - 1)} aria-label="Previous slide">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button className={styles['hero-arrow'] + ' ' + styles['hero-arrow-right']} onClick={() => goTo(current + 1)} aria-label="Next slide">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className={styles['hero-dots']}>
            {banners.map((b, i) => (
              <button
                key={b.id ?? `dot-${i}`}
                className={i === current ? styles['hero-dot-active'] : styles['hero-dot']}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
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
          <p>On orders over AED 75</p>
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
        <Link to="/products" className={styles['shipping-banner-cta']}>Shop Now</Link>
      </div>
    </section>
  );
}

export function BrandStrip({ brands }: Readonly<{ brands: BrandDto[] }>) {
  if (!brands.length) return null;
  return (
    <section className={styles['brand-strip']}>
      <h2>Our Brands</h2>
      <div className={styles['brand-logos']}>
        {brands.map(brand => (
          <Link key={brand.id} to={`/brand/${brand.id}`}>
            {brand.logo ? (
              <img src={brand.logo} alt={brand.name} style={{ height: 40 }} loading="lazy" width={120} height={40} />
            ) : (
              brand.name
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PromoBannerStrip({ banners }: Readonly<{ banners: BannerDto[] }>) {
  if (!banners.length) return null;
  return (
    <>
      {banners.map(banner => (
        <section key={banner.id} className={styles['promo-strip']}>
          {banner.imageDesktopUrl && (
            <img src={banner.imageDesktopUrl} alt={banner.title || ''} className={styles['promo-strip-img']} loading="lazy" width={1920} height={400} />
          )}
          <div className={styles['promo-strip-overlay']} />
          <div className={styles['promo-strip-content']}>
            <h3>{banner.title}</h3>
            {banner.subtitle && <p>{banner.subtitle}</p>}
            {banner.ctaUrl && (
              <Link to={banner.ctaUrl} className={styles['promo-strip-cta']}>
                {banner.ctaText || 'Shop Now'}
              </Link>
            )}
          </div>
        </section>
      ))}
    </>
  );
}
