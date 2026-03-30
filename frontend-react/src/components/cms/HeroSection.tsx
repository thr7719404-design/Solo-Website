import { useEffect, useRef, useState, useCallback } from 'react';
import type { LandingSectionDto } from '@/types';
import { contentApi } from '@/api/content';

interface Slide {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  ctaTargetType?: string;
  ctaTargetValue?: string;
}

export default function HeroSection({ section }: { section: LandingSectionDto }) {
  const d = section.data;
  const staticSlides = (d.slides as Slide[]) ?? [];
  const autoPlay = d.autoPlay !== false;
  const interval = (d.interval as number) ?? 5000;
  const showDots = d.showDots !== false;
  const showArrows = d.showArrows !== false;
  const desktopH = (d.height as number) ?? 600;
  const mobileH = (d.mobileHeight as number) ?? 400;

  const [bannerSlides, setBannerSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  // Fetch active HOME_HERO banners from the API
  useEffect(() => {
    contentApi.getBanners('HOME_HERO').then((banners) => {
      if (banners.length > 0) {
        setBannerSlides(
          banners.map((b) => ({
            imageUrl: b.imageDesktopUrl,
            title: b.title,
            subtitle: b.subtitle,
            ctaLabel: b.ctaText,
            ctaUrl: b.ctaUrl,
          })),
        );
      }
    }).catch(() => { /* fall back to static slides */ });
  }, []);

  // Use banner slides if available, otherwise fall back to static section data
  const slides = bannerSlides.length > 0 ? bannerSlides : staticSlides;
  const count = slides.length;

  const advance = useCallback(
    (dir: 1 | -1) => {
      setCurrent((c) => (c + dir + count) % count);
    },
    [count],
  );

  // Auto-play
  useEffect(() => {
    if (!autoPlay || count <= 1) return;
    timerRef.current = setInterval(() => advance(1), interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, interval, count, advance]);

  if (count === 0) return null;

  const ctaHref = (slide: Slide) => {
    if (slide.ctaUrl) return slide.ctaUrl;
    if (!slide.ctaTargetValue) return undefined;
    switch (slide.ctaTargetType) {
      case 'category':
        return `/categories/${slide.ctaTargetValue}`;
      case 'page':
        return `/page/${slide.ctaTargetValue}`;
      default:
        return slide.ctaTargetValue;
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: `clamp(${mobileH}px, 50vw, ${desktopH}px)` }}
    >
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ width: `${count * 100}%`, transform: `translateX(-${(current * 100) / count}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="relative h-full flex-shrink-0" style={{ width: `${100 / count}%` }}>
            <picture>
              <img
                src={slide.imageUrl || '/placeholder-banner.png'}
                alt={slide.title ?? ''}
                className="w-full h-full object-cover"
              />
            </picture>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex items-end md:items-center px-6 md:px-16 pb-16 md:pb-0">
              <div className="max-w-lg">
                {slide.title && (
                  <h2 className="text-2xl md:text-5xl font-bold text-white leading-tight">
                    {slide.title}
                  </h2>
                )}
                {slide.subtitle && (
                  <p className="mt-2 text-sm md:text-lg text-white/80">{slide.subtitle}</p>
                )}
                {slide.ctaLabel && (
                  <a
                    href={ctaHref(slide)}
                    className="mt-4 inline-block bg-white text-black font-semibold uppercase tracking-wider text-xs md:text-sm px-6 py-3 hover:bg-[#B8860B] hover:text-white transition-colors"
                  >
                    {slide.ctaLabel}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {showArrows && count > 1 && (
        <>
          <button
            onClick={() => advance(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 flex items-center justify-center hover:bg-white transition-colors"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => advance(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 flex items-center justify-center hover:bg-white transition-colors"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current ? 'w-6 bg-white' : 'w-2 bg-white/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
