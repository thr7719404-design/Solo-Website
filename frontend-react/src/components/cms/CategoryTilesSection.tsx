import { Link } from 'react-router-dom';
import type { LandingSectionDto } from '@/types';

export interface CategoryTile {
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  targetValue?: string;
  isEnabled?: boolean;
}

export default function CategoryTilesSection({ section }: Readonly<{ section: LandingSectionDto }>) {
  const raw = section.data;
  let d: Record<string, unknown> = {};
  try { d = typeof raw === 'string' ? JSON.parse(raw as string) : (raw ?? {}); } catch { d = {}; }
  const tiles = ((d.tiles as CategoryTile[]) ?? []).filter((t) => t.isEnabled !== false);
  const columns = (d.columns as number) ?? (tiles.length || 4);
  const overlayOpacity = (d.overlayOpacity as number) ?? 0.3;

  if (tiles.length === 0) return null;

  // Responsive grid: always 2 cols on mobile, scale up based on configured columns
  const gridClass: Record<number, string> = {
    1: 'grid grid-cols-1 gap-[10px]',
    2: 'grid grid-cols-2 gap-[10px]',
    3: 'grid grid-cols-2 sm:grid-cols-3 gap-[10px]',
    4: 'grid grid-cols-2 sm:grid-cols-4 gap-[10px]',
    5: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[10px]',
    6: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[10px]',
  };
  const cls = gridClass[Math.min(Math.max(columns, 1), 6)] ?? gridClass[4];

  return (
    <section className="max-w-[1320px] mx-auto px-4 md:px-[60px] py-6">
      {section.title && (
        <h2 className="text-xl font-bold uppercase tracking-widest text-center mb-5">
          {section.title}
        </h2>
      )}
      <div className={cls}>
        {tiles.map((tile, i) => {
          const href = tile.linkUrl || (tile.targetValue ? `/categories/${tile.targetValue}` : '/products');
          return (
            <Link
              key={`${tile.targetValue ?? tile.linkUrl ?? 'tile'}-${i}`}
              to={href}
              className="group"
              style={{
                position: 'relative',
                display: 'block',
                aspectRatio: '1 / 1',
                overflow: 'hidden',
                borderRadius: '8px',
                background: '#e8e0d4',
                textDecoration: 'none',
              }}
            >
              {tile.imageUrl && (
                <img
                  src={tile.imageUrl}
                  alt={tile.title ?? ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }}
                  className="group-hover:scale-105"
                  loading="lazy"
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(to top, rgba(0,0,0,${(overlayOpacity + 0.4).toFixed(2)}) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)`,
                }}
              />
              {(tile.title || tile.description) && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 10px 12px' }}>
                  {tile.title && (
                    <span style={{ display: 'block', color: '#fff', fontWeight: 700, fontSize: 'clamp(10px, 2.5vw, 13px)', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1.2 }}>
                      {tile.title}
                    </span>
                  )}
                  {tile.description && (
                    <span style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(9px, 2vw, 11px)', marginTop: '2px', lineHeight: 1.3 }}>
                      {tile.description}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
