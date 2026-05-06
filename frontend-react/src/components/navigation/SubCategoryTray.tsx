import { useEffect, useRef, useState } from 'react';
import styles from './SubCategoryTray.module.css';
import type { MenuSubCategory } from '../../hooks/useMenuCategories';

interface Props {
  isExpanded: boolean;
  categoryName: string;
  subCategories: MenuSubCategory[];
  activeSubSlug: string | null;
  onSelectAll: () => void;
  onSelectSub: (sub: MenuSubCategory) => void;
}

export default function SubCategoryTray({
  isExpanded,
  categoryName,
  subCategories,
  activeSubSlug,
  onSelectAll,
  onSelectSub,
}: Props) {
  const trayRef = useRef<HTMLDivElement>(null);
  const [itemsVisible, setItemsVisible] = useState(false);

  useEffect(() => {
    const el = trayRef.current;
    if (!el) return;
    if (isExpanded) {
      el.style.maxHeight = el.scrollHeight + 'px';
      el.style.opacity = '1';
      const t = window.setTimeout(() => setItemsVisible(true), 50);
      return () => window.clearTimeout(t);
    } else {
      el.style.maxHeight = '0px';
      el.style.opacity = '0';
      setItemsVisible(false);
    }
  }, [isExpanded, subCategories.length]);

  return (
    <div
      ref={trayRef}
      className={styles.tray}
      aria-hidden={!isExpanded}
      role="region"
    >
      <div className={styles.inner}>
        <button
          type="button"
          className={`${styles.item} ${styles.allItem}`}
          onClick={onSelectAll}
          tabIndex={isExpanded ? 0 : -1}
          style={{
            ['--item-index' as string]: 0,
            opacity: itemsVisible ? 1 : 0,
            transform: itemsVisible ? 'translateY(0)' : 'translateY(6px)',
          }}
        >
          <span className={styles.itemName}>All {categoryName}</span>
          <span className={styles.allArrow} aria-hidden="true">→</span>
        </button>
        {subCategories.map((sub, idx) => {
          const isActive = activeSubSlug === sub.slug;
          return (
            <button
              key={sub.id}
              type="button"
              className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
              onClick={() => onSelectSub(sub)}
              tabIndex={isExpanded ? 0 : -1}
              style={{
                ['--item-index' as string]: idx + 1,
                opacity: itemsVisible ? 1 : 0,
                transform: itemsVisible ? 'translateY(0)' : 'translateY(6px)',
              }}
            >
              {isActive && <span className={styles.dot} aria-hidden="true" />}
              <span className={styles.itemName}>{sub.name}</span>
              {typeof sub.productCount === 'number' && sub.productCount > 0 && (
                <span className={styles.badge}>{sub.productCount}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
