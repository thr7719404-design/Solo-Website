import type { LandingSectionDto, ProductDto } from '@/types';
import { LandingSectionType } from '@/types';
import HeroSection from './HeroSection';
import CategoryTilesSection from './CategoryTilesSection';
import ProductCarouselSection from './ProductCarouselSection';
import PromoBannerSection from './PromoBannerSection';
import ValuePropsRow from './ValuePropsRow';
import BrandStripSection from './BrandStripSection';
import TopPromoBar from './TopPromoBar';
import NewsletterBlock from './NewsletterBlock';

interface Props {
  section: LandingSectionDto;
  getProducts: (source: string, limit?: number) => ProductDto[];
  onAddToCart?: (product: ProductDto) => void;
}

export default function SectionRenderer({ section, getProducts, onAddToCart }: Props) {
  if (!section.isActive) return null;

  const source = section.data?.source as string | undefined;
  const limit = (section.data?.limit as number) ?? 12;

  switch (section.type) {
    case LandingSectionType.HERO:
    case LandingSectionType.HERO_SLIDER:
    case LandingSectionType.HERO_BANNER:
      return <HeroSection section={section} />;

    case LandingSectionType.CATEGORY_TILES:
    case LandingSectionType.CATEGORY_GRID:
      return <CategoryTilesSection section={section} />;

    case LandingSectionType.PRODUCT_CAROUSEL:
    case LandingSectionType.FEATURED_PRODUCTS:
    case LandingSectionType.BEST_SELLERS:
    case LandingSectionType.NEW_ARRIVALS:
    case LandingSectionType.PRODUCT_COLLECTION:
    case LandingSectionType.PRODUCT_GRID: {
      const products = source ? getProducts(source, limit) : [];
      return <ProductCarouselSection section={section} products={products} onAddToCart={onAddToCart} />;
    }

    case LandingSectionType.PROMO_BANNER:
    case LandingSectionType.PROMO_BANNER_ROW_3:
    case LandingSectionType.SALE_STRIP_BANNER:
    case LandingSectionType.PROMO_STRIP:
      return <PromoBannerSection section={section} />;

    case LandingSectionType.VALUE_PROPS_ROW:
    case LandingSectionType.INFO_BLOCKS_3:
      return <ValuePropsRow section={section} />;

    case LandingSectionType.BRAND_STRIP:
    case LandingSectionType.BRAND_LOGO_STRIP:
    case LandingSectionType.BRAND_SHOWCASE:
      return <BrandStripSection section={section} />;

    case LandingSectionType.TOP_PROMO_BAR:
      return <TopPromoBar section={section} />;

    case LandingSectionType.NEWSLETTER_BLOCK:
      return <NewsletterBlock section={section} />;

    default:
      return null;
  }
}
