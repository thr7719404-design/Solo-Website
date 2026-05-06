import { useEffect, useState } from 'react';
import type { ProductDto, BannerDto, LandingSectionDto } from '../types';
import { productsApi } from '../api/products';
import { contentApi } from '../api/content';
import { HeroSection, PromoBannerStrip } from '../components/porto/PortoSections';
import CategoryTilesSection from '../components/cms/CategoryTilesSection';
import ProductCarousel from '../components/porto/ProductCarousel';
import BulkOrderBanner from '../components/BulkOrderBanner';

export default function HomePage() {
  const [featured, setFeatured] = useState<ProductDto[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductDto[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductDto[]>([]);
  const [heroBanners, setHeroBanners] = useState<BannerDto[]>([]);
  const [midBanners, setMidBanners] = useState<BannerDto[]>([]);
  const [bottomBanners, setBottomBanners] = useState<BannerDto[]>([]);
  const [categorySection, setCategorySection] = useState<LandingSectionDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [feat, best, arrivals, hero, mid, bottom, home] = await Promise.all([
          productsApi.getFeatured(8).catch(() => []),
          productsApi.getBestSellers(8).catch(() => []),
          productsApi.getNewArrivals(8).catch(() => []),
          contentApi.getBanners('HOME_HERO').catch(() => []),
          contentApi.getBanners('HOME_MID').catch(() => []),
          contentApi.getBanners('HOME_BOTTOM').catch(() => []),
          (contentApi.getHome() as Promise<any>).catch(() => null),
        ]);
        setFeatured(feat);
        setBestSellers(best);
        setNewArrivals(arrivals);
        if (hero.length) setHeroBanners(hero);
        setMidBanners(mid);
        setBottomBanners(bottom);
        if (home?.sections) {
          const sec = (home.sections as any[]).find((s: any) => s.type === 'CATEGORY_TILES');
          if (sec) {
            const data = typeof sec.data === 'string' ? JSON.parse(sec.data) : (sec.data ?? {});
            setCategorySection({ ...sec, data });
          }
        }
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
    <div className="homepage-feed">
      <HeroSection banners={heroBanners} />
      {categorySection && <CategoryTilesSection section={categorySection} />}
      <ProductCarousel title="Best Sellers" products={bestSellers} viewAllLink="/best-sellers" />
      <PromoBannerStrip banners={midBanners} />
      <ProductCarousel title="New Arrivals" products={newArrivals} viewAllLink="/new-arrivals" />
      <ProductCarousel title="Featured Products" products={featured} viewAllLink="/featured" />
      <BulkOrderBanner />
      <PromoBannerStrip banners={bottomBanners} />
    </div>
  );
}
