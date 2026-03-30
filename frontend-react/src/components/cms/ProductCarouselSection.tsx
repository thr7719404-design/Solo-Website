import { useRef } from 'react';
import type { LandingSectionDto, ProductDto } from '@/types';
import ProductCard from '@/components/product/ProductCard';

interface Props {
  section: LandingSectionDto;
  products: ProductDto[];
  onAddToCart?: (product: ProductDto) => void;
}

export default function ProductCarouselSection({ section, products, onAddToCart }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const d = section.data ?? {};
  const showArrows = d.showArrows !== false;
  const title = section.title ?? (d.title as string | undefined);

  const scroll = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section className="max-w-[1320px] mx-auto px-4 md:px-[60px] py-10">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        {title && <h2 className="text-2xl font-bold">{title}</h2>}

        {showArrows && (
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll(-1)}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#B8860B] hover:text-[#B8860B] transition-colors"
              aria-label="Scroll left"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#B8860B] hover:text-[#B8860B] transition-colors"
              aria-label="Scroll right"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="snap-start flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]"
          >
            <ProductCard product={p} onAddToCart={onAddToCart} />
          </div>
        ))}
      </div>
    </section>
  );
}
