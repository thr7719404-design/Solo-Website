import { Link } from 'react-router-dom';
import type { LandingSectionDto } from '@/types';

interface Tile {
  title?: string;
  imageUrl?: string;
  targetValue?: string;
  isEnabled?: boolean;
}

export default function CategoryTilesSection({ section }: { section: LandingSectionDto }) {
  const d = section.data;
  const tiles = ((d.tiles as Tile[]) ?? []).filter((t) => t.isEnabled !== false);
  const columns = (d.columns as number) ?? 4;
  const mobileColumns = (d.mobileColumns as number) ?? 2;
  const overlayOpacity = (d.overlayOpacity as number) ?? 0.3;

  if (tiles.length === 0) return null;

  return (
    <section className="max-w-[1320px] mx-auto px-4 md:px-[60px] py-10">
      {section.title && (
        <h2 className="text-2xl font-bold text-center mb-6">{section.title}</h2>
      )}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${mobileColumns}, 1fr)`,
        }}
      >
        <style>{`@media(min-width:768px){.cat-tile-grid{grid-template-columns:repeat(${columns},1fr)!important}}`}</style>
        {tiles.map((tile, i) => (
          <Link
            key={i}
            to={tile.targetValue ? `/categories/${tile.targetValue}` : '/products'}
            className="cat-tile-grid relative block aspect-[5/6] overflow-hidden rounded group"
          >
            <img
              src={tile.imageUrl || '/placeholder.png'}
              alt={tile.title ?? ''}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
              style={{ opacity: overlayOpacity + 0.4 }}
            />
            {tile.title && (
              <span className="absolute bottom-4 left-4 text-white font-semibold text-lg">
                {tile.title}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
