import type { LandingSectionDto } from '@/types';

export default function NewsletterBlock({ section }: { section: LandingSectionDto }) {
  const d = section.data;
  const title = (d.title as string) ?? section.title ?? 'Stay in the Loop';
  const subtitle = (d.subtitle as string) ?? section.subtitle ?? 'Subscribe for exclusive offers and new arrivals';

  return (
    <section className="bg-gray-50 py-12">
      <div className="max-w-xl mx-auto text-center px-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-gray-500 text-sm">{subtitle}</p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-6 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-[#B8860B]"
          />
          <button
            type="submit"
            className="bg-[#B8860B] text-white font-semibold uppercase text-sm tracking-wider px-6 py-2.5 rounded hover:bg-[#8B6508] transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
