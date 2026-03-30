import type { LandingSectionDto } from '@/types';

export default function TopPromoBar({ section }: { section: LandingSectionDto }) {
  const d = section.data;
  const text = (d.text as string) ?? section.title ?? '';
  const bgColor = (d.backgroundColor as string) ?? '#B8860B';
  const textColor = (d.textColor as string) ?? '#FFFFFF';

  if (!text) return null;

  return (
    <div
      className="w-full text-center text-xs font-medium py-2 px-4"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {text}
    </div>
  );
}
