import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentApi } from '@/api/content';
import type { LandingPageDto } from '@/types';

/* Try loading from CMS first; fall back to hardcoded about page. */
export default function AboutPage() {
  const [cmsPage, setCmsPage] = useState<LandingPageDto | null>(null);
  const [cmsLoaded, setCmsLoaded] = useState(false);

  useEffect(() => {
    contentApi
      .getLandingPage('about-us')
      .then((p) => setCmsPage(p))
      .catch(() => {})
      .finally(() => setCmsLoaded(true));
  }, []);

  /* If CMS returns a page with sections, render them (basic rich-text pass-through). */
  if (cmsLoaded && cmsPage && cmsPage.sections.length > 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">{cmsPage.title}</h1>
          {cmsPage.subtitle && <p className="mt-2 text-lg text-gray-500">{cmsPage.subtitle}</p>}
        </header>
        {cmsPage.sections
          .filter((s) => s.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((s) => (
            <section key={s.id} className="prose prose-gray max-w-none">
              {s.title && <h2>{s.title}</h2>}
              {typeof s.data?.html === 'string' && (
                <div dangerouslySetInnerHTML={{ __html: s.data.html as string }} />
              )}
              {typeof s.data?.text === 'string' && <p>{s.data.text as string}</p>}
            </section>
          ))}
      </div>
    );
  }

  /* ── Hardcoded About Page ────────────────────────────────── */
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm mb-6">
            <span>✨</span>
            <span className="font-medium">Est. 2024</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Who We Are</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Welcome to Solo — where every kitchen tells a story. We curate premium kitchenware
            that transforms ordinary cooking into an extraordinary experience.
          </p>
        </div>
      </section>

      {/* CFC Meaning */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-10">Our Philosophy</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🧩',
              title: 'Collation',
              color: 'bg-blue-50 text-blue-600',
              desc: 'We bring together the finest kitchenware from trusted manufacturers worldwide, creating a unified collection that speaks to quality.',
            },
            {
              icon: '⚒️',
              title: 'Formation',
              color: 'bg-amber-50 text-amber-600',
              desc: 'Each product in our catalog is shaped by rigorous quality standards and thoughtful design principles that prioritize function and beauty.',
            },
            {
              icon: '✂️',
              title: 'Curation',
              color: 'bg-emerald-50 text-emerald-600',
              desc: 'Not everything makes the cut. We meticulously select only items that meet our high bar for durability, aesthetics, and everyday practicality.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition text-center">
              <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center text-2xl mx-auto mb-4`}>
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Description strip */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gray-600 leading-relaxed text-[15px]">
            Solo was born from a simple belief: the tools you cook with should inspire you. Whether
            you&apos;re a home chef experimenting with a new recipe or a seasoned professional
            outfitting a commercial kitchen, we stock the essentials — and the extraordinary — to
            elevate every meal.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mission */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-[#B8860B]/10 flex items-center justify-center text-xl">🎯</div>
              <h2 className="text-xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              To make premium kitchenware accessible to everyone while maintaining the highest
              standards of quality and sustainability.
            </p>
            <ul className="space-y-2">
              {[
                'Source responsibly from top-tier manufacturers',
                'Offer fair, transparent pricing',
                'Deliver a seamless shopping experience across the UAE',
                'Build lasting relationships through exceptional after-sales support',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-[#B8860B] mt-0.5">✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Vision */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-xl">🔭</div>
              <h2 className="text-xl font-bold text-gray-900">Our Vision</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              To become the most trusted destination for kitchenware in the Middle East, known for
              curation, convenience, and community.
            </p>
            <ul className="space-y-2">
              {[
                'Expand into smart kitchen technology',
                'Launch sustainability-first product lines',
                'Build a community of passionate home cooks',
                'Set the standard for e-commerce in the home-goods space',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-violet-500 mt-0.5">✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-10">What We Stand For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '💎', title: 'Quality First', desc: 'Every product passes our multi-point quality assessment before earning a place in our catalog.' },
              { icon: '🎨', title: 'Thoughtful Design', desc: 'We believe kitchenware should be as beautiful as it is functional — design matters.' },
              { icon: '✂️', title: 'Curation Not Clutter', desc: 'Less is more. We offer a refined selection instead of overwhelming you with infinite choices.' },
              { icon: '🏠', title: 'Everyday Practicality', desc: 'Our products are built for real kitchens and real cooks, not just showrooms.' },
              { icon: '🌱', title: 'Sustainability Mindset', desc: 'We prioritize eco-friendly materials and partners who share our commitment to the planet.' },
              { icon: '❤️', title: 'Customer-Centric', desc: 'Your satisfaction isn\'t a goal — it\'s our baseline. Everything we do starts with you.' },
            ].map((v) => (
              <div key={v.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
                <span className="text-2xl mb-3 block">{v.icon}</span>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#B8860B] to-[#D4AF37] py-14">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Transform Your Kitchen?</h2>
          <p className="text-white/80 mb-7 text-[15px]">
            Browse our curated collection of premium kitchenware and find your next favorite piece.
          </p>
          <Link
            to="/products"
            className="inline-flex px-8 py-3 bg-white text-[#B8860B] font-semibold text-sm rounded-xl hover:bg-gray-50 transition shadow-md"
          >
            EXPLORE OUR COLLECTIONS
          </Link>
        </div>
      </section>
    </div>
  );
}
