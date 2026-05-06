import { Link } from 'react-router-dom';

export default function BulkOrderBanner() {
  return (
    <section className="max-w-[1320px] mx-auto px-4 md:px-[60px] py-7">
      <Link
        to="/bulk-order"
        style={{ textDecoration: 'none', display: 'block' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 32px rgba(184,134,11,0.25)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
        }}
        onFocus={e => {
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 32px rgba(184,134,11,0.25)';
        }}
        onBlur={e => {
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
        }}
      >
        <div
          className="relative overflow-hidden rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
            padding: 'clamp(18px, 3.2vw, 32px) clamp(20px, 4vw, 40px)',
          }}
        >
          {/* Decorative accent line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, #B8860B, #D4A843, #B8860B)',
          }} />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase',
                color: '#B8860B', marginBottom: 5,
              }}>
                Business &amp; Wholesale
              </div>
              <h2 style={{
                fontSize: 'clamp(19px, 3.4vw, 24px)', fontWeight: 700, color: '#fff', margin: '0 0 5px',
                lineHeight: 1.2,
              }}>
                For Bulk Orders, Press Here
              </h2>
              <p style={{
                fontSize: 13.5, color: 'rgba(255,255,255,0.6)', margin: 0,
                maxWidth: 480, lineHeight: 1.45,
              }}>
                Need large quantities? Submit a bulk order request and our team will get back to you with the best pricing.
              </p>
            </div>

            <div
              className="self-start sm:self-auto"
              style={{
                background: '#B8860B', borderRadius: 8,
                padding: '11px 26px', color: '#000',
                fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Request a Quote →
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
