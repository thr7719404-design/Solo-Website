import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { contentApi } from '@/api/content';
import { productsApi } from '@/api/products';
import SectionRenderer from '@/components/cms/SectionRenderer';
import { useCartStore } from '@/stores/cart';
import type { LandingPageDto, ProductDto } from '@/types';

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<LandingPageDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [featured, setFeatured] = useState<ProductDto[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductDto[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductDto[]>([]);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    contentApi
      .getLandingPage(slug)
      .then(async (data) => {
        if (cancelled) return;
        setPage(data);

        // Determine which product sources are needed
        const sources = new Set<string>();
        for (const s of data.sections ?? []) {
          const src = s.data?.source as string | undefined;
          if (src) sources.add(src);
        }

        const jobs: Promise<void>[] = [];
        if (sources.has('featured'))
          jobs.push(productsApi.getFeatured(20).then((d) => { if (!cancelled) setFeatured(d); }));
        if (sources.has('best_sellers'))
          jobs.push(productsApi.getBestSellers(20).then((d) => { if (!cancelled) setBestSellers(d); }));
        if (sources.has('new_arrivals'))
          jobs.push(productsApi.getNewArrivals(20).then((d) => { if (!cancelled) setNewArrivals(d); }));

        await Promise.allSettled(jobs);
        if (!cancelled) setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load page');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [slug]);

  const getProducts = (source: string, limit = 12): ProductDto[] => {
    let list: ProductDto[];
    switch (source) {
      case 'featured': list = featured; break;
      case 'best_sellers': list = bestSellers; break;
      case 'new_arrivals': list = newArrivals; break;
      default: list = [];
    }
    return list.slice(0, limit);
  };

  const handleAddToCart = (product: ProductDto) => {
    addItem({ type: 'product', itemId: product.id, quantity: 1 });
  };

  if (isLoading && !page) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="text-center py-32 text-red-500">
        <p>{error ?? 'Page not found'}</p>
      </div>
    );
  }

  const sections = (page.sections ?? [])
    .filter((s) => s.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div>
      {page.title && (
        <div className="max-w-[1320px] mx-auto px-4 md:px-[60px] pt-10 pb-4">
          <h1 className="text-3xl font-bold">{page.title}</h1>
          {page.subtitle && <p className="mt-1 text-gray-500">{page.subtitle}</p>}
        </div>
      )}
      {sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          getProducts={getProducts}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}
