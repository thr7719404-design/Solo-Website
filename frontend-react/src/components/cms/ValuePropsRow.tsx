import type { LandingSectionDto } from '@/types';

interface Prop {
  icon?: string;
  title?: string;
  subtitle?: string;
}

const ICONS: Record<string, React.ReactNode> = {
  shipping: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M1 3h15v13H1zM16 8h4l3 4v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  returns: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
    </svg>
  ),
  support: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  security: (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

export default function ValuePropsRow({ section }: { section: LandingSectionDto }) {
  const d = section.data;
  const props = (d.props as Prop[]) ?? (d.items as Prop[]) ?? [];

  if (props.length === 0) return null;

  return (
    <section className="max-w-[1320px] mx-auto px-4 md:px-[60px] py-8 border-t border-b border-gray-100">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {props.map((p, i) => {
          const iconKey = (p.icon ?? '').toLowerCase();
          return (
            <div key={i} className="flex flex-col items-center text-center gap-2">
              <div className="text-[#B8860B]">{ICONS[iconKey] ?? ICONS.shipping}</div>
              {p.title && <span className="text-sm font-semibold">{p.title}</span>}
              {p.subtitle && <span className="text-xs text-gray-500">{p.subtitle}</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
