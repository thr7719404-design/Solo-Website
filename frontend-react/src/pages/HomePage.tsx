import { useEffect, useState } from 'react';
import type { ProductDto, BannerDto } from '../types';
import { productsApi } from '../api/products';
import { contentApi } from '../api/content';
import { useCatalog } from '../contexts/CatalogContext';
import { HeroSection, CategoryTiles, FreeShippingBanner } from '../components/porto/PortoSections';
import ProductCarousel from '../components/porto/ProductCarousel';

export default function HomePage() {
  const { categories } = useCatalog();
  const [featured, setFeatured] = useState<ProductDto[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductDto[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductDto[]>([]);
  const [heroBanner, setHeroBanner] = useState<BannerDto | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [feat, best, arrivals, banners] = await Promise.all([
          productsApi.getFeatured(8),
          productsApi.getBestSellers(8),
          productsApi.getNewArrivals(8),
          contentApi.getBanners('HOME_HERO').catch(() => []),
        ]);
        setFeatured(feat);
        setBestSellers(best);
        setNewArrivals(arrivals);
        if (banners.length) setHeroBanner(banners[0]);
      } catch (err) {
        console.error('Failed to load homepage', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading-spinner" />;

  return (
    <>
      <HeroSection banner={heroBanner} />
      <CategoryTiles categories={categories} />
      <ProductCarousel title="Best Sellers" products={bestSellers} viewAllLink="/best-sellers" />
      <FreeShippingBanner />
      <ProductCarousel title="New Arrivals" products={newArrivals} viewAllLink="/new-arrivals" />
      <ProductCarousel title="Featured Products" products={featured} viewAllLink="/featured" />
    </>
  );
}
