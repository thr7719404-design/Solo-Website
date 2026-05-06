import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '@/api/categories';
import type { CategoryDto } from '@/types';

/* ── Skeleton ── */
function CategorySkeleton() {
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 26, width: 70, background: '#f0f0f0', borderRadius: 20 }} />)}
        </div>
      </div>
    </div>
  );
}

/* ── Subcategory pill ── */
function SubPill({ sub, categorySlug }: { sub: CategoryDto; categorySlug: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={`/category/${categorySlug}?sub=${sub.slug || sub.id}`}
      style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => e.stopPropagation()}
    >
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        background: hovered ? '#B8860B' : '#f5f5f5',
        color: hovered ? '#fff' : '#555',
        border: hovered ? '1px solid #B8860B' : '1px solid #eee',
        transition: 'all 0.18s',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}>
        {sub.name}
        {sub.productCount != null && sub.productCount > 0 && (
          <span style={{
            background: hovered ? 'rgba(255,255,255,0.3)' : '#e0e0e0',
            color: hovered ? '#fff' : '#888',
            borderRadius: 10,
            fontSize: 10,
            fontWeight: 600,
            padding: '1px 6px',
          }}>
            {sub.productCount}
          </span>
        )}
      </span>
    </Link>
  );
}

/* ── Category card ── */
function CategoryCard({ cat }: { cat: CategoryDto }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const subcategories = (cat.subcategories || cat.children || []).filter(s => s.isActive !== false);
  const image = !imgError && (cat.imageUrl || cat.image);
  const initial = cat.name.charAt(0).toUpperCase();

  // Gold gradient palette index for categories without images
  const gradients = [
    'linear-gradient(135deg, #B8860B 0%, #D4A843 100%)',
    'linear-gradient(135deg, #8B6508 0%, #B8860B 100%)',
    'linear-gradient(135deg, #2d2d2d 0%, #4a4a4a 100%)',
    'linear-gradient(135deg, #1a3a4a 0%, #2d6080 100%)',
    'linear-gradient(135deg, #3a1a2a 0%, #6b2d4a 100%)',
  ];
  const gradient = gradients[cat.name.charCodeAt(0) % gradients.length];

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
      {/* Image / Placeholder */}
      <Link to={`/category/${cat.slug || cat.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{
          height: 180,
          background: image ? undefined : gradient,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {image ? (
            <img
              src={image as string}
              alt={cat.name}
              onError={() => setImgError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: hovered ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.4s ease',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 56, fontWeight: 800, color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>{initial}</span>
            </div>
          )}
          {/* Dark overlay on hover */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
            opacity: hovered ? 1 : 0.4,
            transition: 'opacity 0.25s',
          }} />
          {/* Product count chip */}
          {cat.productCount != null && cat.productCount > 0 && (
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
              {cat.productCount} items
            </div>
          )}
          {/* Category name overlay at bottom of image */}
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
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}>
              {cat.name}
            </h2>
          </div>
        </div>
      </Link>

      {/* Body */}
      <div style={{ padding: '16px 18px 20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Description */}
        {cat.description && (
          <p style={{
            margin: '0 0 14px',
            fontSize: 13,
            color: '#888',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any,
            overflow: 'hidden',
          }}>
            {cat.description}
          </p>
        )}

        {/* Subcategory pills */}
        {subcategories.length > 0 ? (
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#B8860B', textTransform: 'uppercase', letterSpacing: 1 }}>
              Subcategories
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {subcategories.slice(0, 6).map(sub => (
                <SubPill key={sub.id} sub={sub} categorySlug={cat.slug || cat.id} />
              ))}
              {subcategories.length > 6 && (
                <Link to={`/category/${cat.slug || cat.id}`} style={{ textDecoration: 'none' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    background: '#faf6ed',
                    color: '#B8860B',
                    border: '1px solid #e8d89a',
                  }}>
                    +{subcategories.length - 6} more
                  </span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flexGrow: 1 }} />
        )}

        {/* Shop CTA */}
        <Link
          to={`/category/${cat.slug || cat.id}`}
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16 }}
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
            Browse all
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    categoriesApi
      .getAll({ includeSubcategories: true })
      .then((data) => setCategories(Array.isArray(data) ? data.filter(c => c.isActive !== false) : []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.trim().toLowerCase();
    return categories.filter(c => {
      if (c.name.toLowerCase().includes(q)) return true;
      const subs = (c.subcategories || c.children || []);
      return subs.some(s => s.name.toLowerCase().includes(q));
    });
  }, [categories, search]);

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
        .cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
          animation: fadeUp 0.4s ease both;
        }
        @media (max-width: 700px) {
          .cat-grid { grid-template-columns: 1fr; gap: 16px; }
        }
        @media (min-width: 1100px) {
          .cat-grid { grid-template-columns: repeat(3, 1fr); }
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
            placeholder="Search categories or subcategories…"
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
            {filtered.length === categories.length
              ? `${categories.length} categories`
              : `${filtered.length} of ${categories.length} matching`}
          </p>
        )}
      </div>

      {/* ── Grid ── */}
      <div style={{ maxWidth: 1340, margin: '0 auto', padding: '0 24px 72px' }}>
        {loading ? (
          <div className="cat-grid">
            {Array.from({ length: 9 }).map((_, i) => <CategorySkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#999' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#555', margin: '0 0 8px' }}>No categories found</p>
            <p style={{ fontSize: 14, margin: '0 0 20px' }}>Try a different search term</p>
            <button onClick={() => setSearch('')} style={{ padding: '10px 24px', background: '#B8860B', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Clear search
            </button>
          </div>
        ) : (
          <div className="cat-grid">
            {filtered.map(cat => <CategoryCard key={cat.id} cat={cat} />)}
          </div>
        )}
      </div>
    </div>
  );
}
