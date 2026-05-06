import styles from './DesktopSecondaryPanel.module.css';
import type { MenuCategory, MenuSubCategory } from '../../hooks/useMenuCategories';

interface Props {
  category: MenuCategory | null;
  onSelectAll: (cat: MenuCategory) => void;
  onSelectSub: (cat: MenuCategory, sub: MenuSubCategory) => void;
}

export default function DesktopSecondaryPanel({
  category,
  onSelectAll,
  onSelectSub,
}: Props) {
  return (
    <aside
      className={`${styles.panel} ${category ? styles.visible : ''}`}
      aria-hidden={!category}
    >
      {category && (
        <div className={styles.inner}>
          <h2 className={styles.title}>{category.name}</h2>
          <hr className={styles.rule} />
          <ul className={styles.list}>
            {category.subCategories.map((sub) => (
              <li key={sub.id}>
                <button
                  type="button"
                  className={styles.subBtn}
                  onClick={() => onSelectSub(category, sub)}
                >
                  {sub.name}
                </button>
              </li>
            ))}
          </ul>
          {category.imageUrl && (
            <div className={styles.thumbWrap}>
              <img
                src={category.imageUrl}
                alt=""
                className={styles.thumb}
                loading="lazy"
              />
              <span className={styles.thumbOverlay} aria-hidden="true" />
            </div>
          )}
          <button
            type="button"
            className={styles.exploreBtn}
            onClick={() => onSelectAll(category)}
          >
            Explore →
          </button>
        </div>
      )}
    </aside>
  );
}
