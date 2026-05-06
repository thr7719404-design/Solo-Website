import { type ReactNode } from 'react';

export interface LegalSection {
  /** Optional heading. Omit for a lead/intro paragraph block. */
  heading?: string;
  /** Body — array of strings (rendered as paragraphs) or ReactNodes. */
  body: ReactNode[];
}

interface LegalPageProps {
  title: string;
  intro?: ReactNode;
  lastUpdated?: string;
  sections: LegalSection[];
}

/**
 * Reusable styled layout for static legal documents (Privacy, Terms, etc.).
 * Provides hero, sticky table-of-contents on wide screens, and readable typography.
 */
export default function LegalPage({ title, intro, lastUpdated, sections }: LegalPageProps) {
  const tocItems = sections.filter((s) => s.heading).map((s) => s.heading!);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          color: '#fff',
          padding: '3.5rem 1.5rem 2.5rem',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
          {lastUpdated && (
            <p style={{ marginTop: '0.5rem', opacity: 0.75, fontSize: '0.9rem' }}>
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
      </section>

      {/* Body */}
      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '2.5rem 1.5rem 5rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 240px',
          gap: '2.5rem',
          alignItems: 'start',
        }}
        className="legal-page-grid"
      >
        <article
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '2.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            border: '1px solid #ececec',
            color: '#333',
            lineHeight: 1.75,
            fontSize: '0.98rem',
          }}
        >
          {intro && (
            <div style={{ fontSize: '1.05rem', color: '#444', marginBottom: '1.75rem' }}>
              {intro}
            </div>
          )}
          {sections.map((section, idx) => (
            <section key={idx} id={section.heading ? slugify(section.heading) : undefined} style={{ marginBottom: '2rem' }}>
              {section.heading && (
                <h2
                  style={{
                    fontSize: '1.3rem',
                    color: '#0f3460',
                    margin: '0 0 0.75rem',
                    paddingBottom: '0.4rem',
                    borderBottom: '2px solid #0f3460',
                  }}
                >
                  {section.heading}
                </h2>
              )}
              {section.body.map((para, i) =>
                typeof para === 'string' ? (
                  <p key={i} style={{ margin: '0 0 0.85rem' }}>
                    {para}
                  </p>
                ) : (
                  <div key={i} style={{ margin: '0 0 0.85rem' }}>
                    {para}
                  </div>
                ),
              )}
            </section>
          ))}
        </article>

        {/* TOC */}
        <aside
          className="legal-page-toc"
          style={{
            position: 'sticky',
            top: '1.5rem',
            background: '#fff',
            borderRadius: 12,
            padding: '1.25rem 1.25rem 1rem',
            border: '1px solid #ececec',
            fontSize: '0.88rem',
          }}
        >
          <div style={{ fontWeight: 700, color: '#0f3460', marginBottom: '0.6rem' }}>
            On this page
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
            {tocItems.map((h) => (
              <li key={h}>
                <a
                  href={`#${slugify(h)}`}
                  style={{
                    color: '#444',
                    textDecoration: 'none',
                    display: 'block',
                    padding: '0.25rem 0',
                  }}
                >
                  {h}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {/* Inline responsive style: collapse TOC on mobile */}
      <style>{`
        @media (max-width: 900px) {
          .legal-page-grid { grid-template-columns: 1fr !important; }
          .legal-page-toc { position: static !important; order: -1; }
        }
      `}</style>
    </div>
  );
}
