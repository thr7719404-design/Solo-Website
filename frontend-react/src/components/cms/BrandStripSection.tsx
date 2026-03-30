import type { LandingSectionDto } from '@/types';

interface BrandItem {
  name?: string;
  logoUrl?: string;
  targetValue?: string;
}

export default function BrandStripSection({ section }: { section: LandingSectionDto }) {
  const d = section.data;
  const brands = (d.brands as BrandItem[]) ?? (d.items as BrandItem[]) ?? [];

  if (brands.length === 0) return null;

  return (
    <section className="max-w-[1320px] mx-auto px-4 md:px-[60px] py-8">
      {section.title && (
        <h2 className="text-xl font-bold text-center mb-6">{section.title}</h2>
      )}
      <div className="flex gap-8 overflow-x-auto scrollbar-hide items-center justify-center py-2">
        {brands.map((b, i) =>
          b.logoUrl ? (
            <a
              key={i}
              href={b.targetValue ? `/brands/${b.targetValue}` : undefined}
              className="flex-shrink-0 grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100"
            >
              <img src={b.logoUrl} alt={b.name ?? ''} className="h-10 w-auto object-contain" loading="lazy" />
            </a>
          ) : null,
        )}
      </div>
    </section>
  );
}
