import { useNavigate } from 'react-router-dom';
import type { ProductVariantDto } from '../../types';
import styles from './VariantSelector.module.css';

interface Props {
  variants: ProductVariantDto[];
  axes: string[];
}

export default function VariantSelector({ variants, axes }: Props) {
  const navigate = useNavigate();

  if (!variants?.length || variants.length < 2) return null;

  const hasColor = axes.includes('color');
  const hasSize = axes.includes('size');

  // Group sizes by current color (or just list sizes if no color axis)
  const current = variants.find(v => v.isCurrent);
  const currentColor = current?.attributes?.color ?? current?.attributes?.colorName;

  const colorVariants = hasColor
    ? dedupeBy(variants, v => String(v.attributes?.color ?? v.attributes?.colorName ?? v.id))
    : [];

  // Show sizes that share the current colour. Only fall back to "all sizes"
  // when no sibling matches the current colour at all (i.e. malformed data),
  // otherwise a colour with a single size would wrongly expose every other
  // size as if it were available.
  let sizeVariants: ProductVariantDto[] = [];
  if (hasSize) {
    const colorFiltered = hasColor
      ? variants.filter(v => {
          const c = v.attributes?.color ?? v.attributes?.colorName;
          return c === currentColor;
        })
      : variants;
    const source = colorFiltered.length > 0 ? colorFiltered : variants;
    const withSize = source.filter(v => v.attributes?.size != null && v.attributes?.size !== '');
    sizeVariants = dedupeBy(withSize, v => String(v.attributes?.size));
  }

  const handleClick = (v: ProductVariantDto) => {
    if (v.isCurrent) return;
    const target = v.slug || v.id;
    navigate(`/products/${target}`);
  };

  return (
    <div className={styles.wrap}>
      {hasColor && colorVariants.length > 0 && (
        <div className={styles.row}>
          <div className={styles.label}>
            Color: <span className={styles.value}>
              {String(current?.attributes?.colorName ?? current?.attributes?.color ?? '')}
            </span>
          </div>
          <div className={styles.swatches}>
            {colorVariants.map(v => {
              const isActive = String(v.attributes?.color ?? v.attributes?.colorName) === String(currentColor);
              const label = String(v.attributes?.colorName ?? v.attributes?.color ?? v.name);
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`${styles.swatch} ${isActive ? styles.active : ''}`}
                  onClick={() => handleClick(v)}
                  aria-label={`Select color: ${label}`}
                  aria-pressed={isActive}
                  title={!v.inStock ? `${label} (Available on request — tap to view)` : label}
                >
                  {v.primaryImage ? (
                    <img src={v.primaryImage} alt={label} loading="lazy" width={48} height={48} />
                  ) : (
                    <span
                      className={styles.colorChip}
                      style={{ background: String(v.attributes?.colorHex ?? '#ddd') }}
                    />
                  )}
                  {!v.inStock && <span className={styles.oosOverlay} title="Available on Request">Ask</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasSize && sizeVariants.length > 0 && (
        <div className={styles.row}>
          <div className={styles.label}>
            Size: <span className={styles.value}>
              {String(current?.attributes?.size ?? '')}
            </span>
          </div>
          <div className={styles.sizes}>
            {sizeVariants.map(v => {
              const sizeValue = String(v.attributes?.size ?? '');
              const currentSize = String(current?.attributes?.size ?? '');
              const isActive = sizeValue === currentSize;
              const label = sizeValue || String(v.name);
              // If the visible size belongs to a different variant, find the
              // sibling that matches BOTH the current colour and this size so
              // clicking it stays on the same colour family when possible.
              const target = (() => {
                if (v.isCurrent) return v;
                const sibling = variants.find(x => {
                  const xc = x.attributes?.color ?? x.attributes?.colorName;
                  const xs = String(x.attributes?.size ?? '');
                  return xs === sizeValue && xc === currentColor;
                });
                return sibling ?? v;
              })();
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`${styles.size} ${isActive ? styles.active : ''} ${!target.inStock ? styles.oos : ''}`}
                  onClick={() => handleClick(target)}
                  aria-pressed={isActive}
                  title={!target.inStock ? `${label} (Available on request — tap to view)` : label}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function dedupeBy<T>(arr: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}
