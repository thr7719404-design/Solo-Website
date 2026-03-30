import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { ProductDto } from '../../types';
import ProductCard from './ProductCard';
import styles from './ProductCarousel.module.css';

interface Props {
  title: string;
  products: ProductDto[];
  viewAllLink?: string;
}

export default function ProductCarousel({ title, products, viewAllLink }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!products.length) return null;

  const updateScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setScrollProgress(el.scrollLeft / maxScroll);
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < maxScroll - 1);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
    return () => el.removeEventListener('scroll', updateScroll);
  }, [updateScroll, products]);

  const scroll = (direction: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(':scope > *')?.clientWidth ?? 280;
    const amount = (cardWidth + 20) * 2;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className={styles['carousel-section']}>
      <div className={styles['carousel-header']}>
        <h2>{title}</h2>
        {viewAllLink && <Link to={viewAllLink}>View All →</Link>}
      </div>
      <div className={styles['carousel-wrapper']}>
        {canScrollLeft && (
          <button className={`${styles['carousel-arrow']} ${styles['arrow-left']}`} onClick={() => scroll('left')} aria-label="Scroll left">
            ‹
          </button>
        )}
        <div className={styles['carousel-track']} ref={trackRef}>
          {products.slice(0, 8).map(product => (
            <div className={styles['carousel-item']} key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        {canScrollRight && (
          <button className={`${styles['carousel-arrow']} ${styles['arrow-right']}`} onClick={() => scroll('right')} aria-label="Scroll right">
            ›
          </button>
        )}
      </div>
      <div className={styles['scroll-indicator']}>
        <div className={styles['scroll-indicator-track']}>
          <div className={styles['scroll-indicator-thumb']} style={{ left: `${scrollProgress * 70}%` }} />
        </div>
      </div>
    </section>
  );
}
