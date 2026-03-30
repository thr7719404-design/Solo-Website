import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { ProductDto } from '@/types';
import { config } from '@/config';
import { useFavoritesStore } from '@/stores/favorites';
import { useAuthStore } from '@/stores/auth';

interface Props {
  product: ProductDto;
  onAddToCart?: (product: ProductDto) => void;
}

export default function ProductCard({ product, onAddToCart }: Readonly<Props>) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const isFavorite = favoriteIds.has(product.id);

  const displayPrice = product.salePrice ?? product.price;
  const comparePrice = product.compareAtPrice ?? product.listPrice;
  const isOnSale = comparePrice != null && comparePrice > displayPrice;
  const discountPct = isOnSale ? Math.round(((comparePrice - displayPrice) / comparePrice) * 100) : 0;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const nowFav = await toggleFavorite(product.id);
    toast.success(nowFav ? 'Added to favorites' : 'Removed from favorites');
  };

  return (
    <div
      className="group flex flex-col bg-white rounded overflow-hidden transition-shadow hover:shadow-lg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image area */}
      <Link to={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl || '/placeholder.png'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold uppercase tracking-wider">
              New
            </span>
          )}
          {isOnSale && discountPct > 0 && (
            <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold">-{discountPct}%</span>
          )}
          {product.isBestSeller && (
            <span className="px-2 py-0.5 bg-[#B8860B] text-white text-[10px] font-bold uppercase tracking-wider">
              Bestseller
            </span>
          )}
        </div>

        {/* Favorite toggle */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            className={`w-4 h-4 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-400'}`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            fill={isFavorite ? 'currentColor' : 'none'}
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>

        {/* Quick action row on hover */}
        {hovered && onAddToCart && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 animate-fade-in">
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
              className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center hover:bg-[#B8860B] hover:text-white transition-colors"
              aria-label="Add to cart"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
              </svg>
            </button>
          </div>
        )}
      </Link>

      {/* Info area */}
      <div className="flex flex-col gap-0.5 p-3">
        {product.brand && (
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            {product.brand.name}
          </span>
        )}
        <Link
          to={`/products/${product.id}`}
          className="text-[13px] font-semibold text-gray-900 leading-tight line-clamp-2 hover:text-[#B8860B] transition-colors"
        >
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-sm font-bold text-gray-900">
            {config.currency} {displayPrice.toFixed(2)}
          </span>
          {isOnSale && (
            <span className="text-xs text-gray-400 line-through">
              {config.currency} {comparePrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
