import type { LandingSectionDto } from '@/types';

export default function PromoBannerSection({ section }: { section: LandingSectionDto }) {
  const d = section.data;
  const title = (d.title as string) ?? section.title;
  const subtitle = (d.subtitle as string) ?? section.subtitle;
  const ctaText = d.ctaText as string | undefined;
  const ctaUrl = d.ctaUrl as string | undefined;
  const imageUrl = d.imageUrl as string | undefined;
  const bgColor = (d.backgroundColor as string) ?? '#1A1A1A';
  const textColor = (d.textColor as string) ?? '#FFFFFF';
  const alignment = (d.alignment as string) ?? 'center';
  const height = (d.height as number) ?? 300;

  const alignClass =
    alignment === 'left' ? 'items-start text-left' : alignment === 'right' ? 'items-end text-right' : 'items-center text-center';

  return (
    <section
      className={`relative flex flex-col justify-center ${alignClass} px-6 md:px-16 overflow-hidden`}
      style={{ backgroundColor: bgColor, color: textColor, minHeight: `${height}px` }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}
      <div className="relative z-10 max-w-2xl">
        {title && <h2 className="text-2xl md:text-4xl font-bold">{title}</h2>}
        {subtitle && <p className="mt-2 text-sm md:text-lg opacity-80">{subtitle}</p>}
        {ctaText && ctaUrl && (
          <a
            href={ctaUrl}
            className="mt-4 inline-block bg-white text-black font-semibold uppercase tracking-wider text-xs md:text-sm px-6 py-3 hover:bg-[#B8860B] hover:text-white transition-colors"
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}
