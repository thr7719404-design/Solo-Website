import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { brandsApi } from '@/api/brands';
import type { BrandDto } from '@/types';

/* ── Skeleton ── */
function BrandSkeleton() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      animation: 'pulse 1.4s ease-in-out infinite',
      border: '1px solid #eee',
    }}>
      <div style={{ height: 180, background: '#f0f0f0' }} />
      <div style={{ padding: '18px 20px 20px' }}>
        <div style={{ height: 18, width: '55%', background: '#f0f0f0', borderRadius: 8, marginBottom: 10 }} />
        <div style={{ height: 12, width: '40%', background: '#f0f0f0', borderRadius: 6, marginBottom: 16 }} />
        <div style={{ height: 26, width: 120, background: '#f0f0f0', borderRadius: 20 }} />
      </div>
    </div>
  );
}

/* ── Brand card (matches CategoryCard concept) ── */
function BrandCard({ brand }: { brand: BrandDto }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const logo = !imgError && ((brand as any).logoUrl || brand.logo);
  const initial = brand.name.charAt(0).toUpperCase();

  // Same gold/dark gradient palette used by CategoryCard
  const gradients = [
    'linear-gradient(135deg, #B8860B 0%, #D4A843 100%)',
    'linear-gradient(135deg, #8B6508 0%, #B8860B 100%)',
    'linear-gradient(135deg, #2d2d2d 0%, #4a4a4a 100%)',
    'linear-gradient(135deg, #1a3a4a 0%, #2d6080 100%)',
    'linear-gradient(135deg, #3a1a2a 0%, #6b2d4a 100%)',
  ];
  const gradient = gradients[brand.name.charCodeAt(0) % gradients.length];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: hovered ? '2px solid #B8860B' : '2px solid transparent',
        outline: '1px solid #eee',
        boxShadow: hovered ? '0 12px 40px rgba(184,134,11,0.14)' : '0 2px 10px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'all 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image / Placeholder header */}
      <Link to={`/brand/${brand.slug || brand.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{
          height: 180,
          background: logo ? '#fafafa' : gradient,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {logo ? (
            <img
              src={logo as string}
              alt={brand.name}
              onError={() => setImgError(true)}
              style={{
                maxWidth: '70%',
                maxHeight: '70%',
                objectFit: 'contain',
                transform: hovered ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.4s ease',
              }}
            />
          ) : (
            <span style={{ fontSize: 80, fontWeight: 800, color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>{initial}</span>
          )}
          {/* Dark overlay on hover */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
            opacity: hovered ? 1 : 0.35,
            transition: 'opacity 0.25s',
            pointerEvents: 'none',
          }} />
          {/* Product count chip */}
          {brand.productCount != null && brand.productCount > 0 && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 20,
              letterSpacing: 0.3,
            }}>
              {brand.productCount} items
            </div>
          )}
          {/* Brand name overlay */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 16px',
          }}>
            <h2 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}>
              {brand.name}
            </h2>
          </div>
        </div>
      </Link>

      {/* Body */}
      <div style={{ padding: '16px 18px 20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Description */}
        {brand.description ? (
          <p style={{
            margin: '0 0 14px',
            fontSize: 13,
            color: '#888',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any,
            overflow: 'hidden',
            flexGrow: 1,
          }}>
            {brand.description}
          </p>
        ) : (
          <div style={{ flexGrow: 1 }} />
        )}

        {/* Website link */}
        {brand.website && (
          <a
            href={brand.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: '#888',
              textDecoration: 'none',
              marginBottom: 8,
              width: 'fit-content',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Visit website
          </a>
        )}

        {/* Shop CTA */}
        <Link
          to={`/brand/${brand.slug || brand.id}`}
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}
        >
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: hovered ? '#B8860B' : '#aaa',
            transition: 'color 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}>
            Shop {brand.name}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}

/* ── Stats bar ── */
function StatsBar({ brands }: { brands: BrandDto[] }) {
  const totalProducts = brands.reduce((acc, b) => acc + (b.productCount ?? 0), 0);
  const withLogos = brands.filter(b => (b as any).logoUrl || b.logo).length;

  const stats = [
    { label: 'Brands', value: brands.length },
    ...(withLogos > 0 ? [{ label: 'With Logo', value: withLogos }] : []),
    ...(totalProducts > 0 ? [{ label: 'Total Products', value: totalProducts }] : []),
  ];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: 'clamp(24px, 6vw, 80px)',
      padding: '28px 24px',
      background: 'rgba(184,134,11,0.06)',
      borderBottom: '1px solid rgba(184,134,11,0.15)',
    }}>
      {stats.map(s => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#B8860B', lineHeight: 1.15 }}>{s.value}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontWeight: 500, letterSpacing: 0.3 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Main page ── */
export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    brandsApi.getAll()
      .then((data) => setBrands(Array.isArray(data) ? data.filter(b => b.isActive !== false) : []))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = brands;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [brands, search]);

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.5 }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .brand-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
          animation: fadeUp 0.4s ease both;
        }
        @media (max-width: 700px) {
          .brand-grid { grid-template-columns: 1fr; gap: 16px; }
        }
        @media (min-width: 1100px) {
          .brand-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      {/* ── Search ── */}
      <div style={{ maxWidth: 1340, margin: '0 auto', padding: '32px 24px 12px' }}>
        <div style={{ position: 'relative', maxWidth: 480, marginBottom: 8 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search brands…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              fontSize: 15,
              border: '1.5px solid #e0e0e0',
              borderRadius: 12,
              outline: 'none',
              boxSizing: 'border-box',
              background: '#fff',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#B8860B')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
          )}
        </div>
        {!loading && (
          <p style={{ margin: '12px 0 24px', fontSize: 14, color: '#999' }}>
            {filtered.length === brands.length
              ? `${brands.length} brands`
              : `${filtered.length} of ${brands.length} matching`}
          </p>
        )}
      </div>

      {/* ── Grid ── */}
      <div style={{ maxWidth: 1340, margin: '0 auto', padding: '0 24px 72px' }}>
        {loading ? (
          <div className="brand-grid">
            {Array.from({ length: 9 }).map((_, i) => <BrandSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#999' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#555', margin: '0 0 8px' }}>No brands found</p>
            <p style={{ fontSize: 14, margin: '0 0 20px' }}>Try a different search term</p>
            <button onClick={() => setSearch('')} style={{ padding: '10px 24px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Clear search
            </button>
          </div>
        ) : (
          <div className="brand-grid">
            {filtered.map(brand => <BrandCard key={brand.id} brand={brand} />)}
          </div>
        )}
      </div>
    </div>
  );
}
