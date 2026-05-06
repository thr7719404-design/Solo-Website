import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

interface QA {
  q: string;
  a: React.ReactNode;
  category: string;
}

const FAQS: QA[] = [
  // Orders
  {
    category: 'Orders',
    q: 'How do I place an order?',
    a: (
      <>
        Browse our <Link to="/categories">categories</Link> or <Link to="/brands">brands</Link>,
        add items to your cart, then proceed to checkout. You can pay securely online or
        choose cash on delivery (where available).
      </>
    ),
  },
  {
    category: 'Orders',
    q: 'Can I cancel or change my order after placing it?',
    a: 'You may cancel or change your order before it has been shipped. Once it has been dispatched, cancellation is no longer possible — but you can still request a return after delivery.',
  },
  {
    category: 'Orders',
    q: 'How do I track my order?',
    a: (
      <>
        Sign in and go to <Link to="/account/orders">My Account &rarr; Orders</Link> to view
        live status and tracking updates. You will also receive notifications by email,
        SMS, or WhatsApp.
      </>
    ),
  },

  // Shipping
  {
    category: 'Shipping & Delivery',
    q: 'Where do you deliver?',
    a: 'We deliver across the United Arab Emirates. Selected products may also be available for international shipping — eligibility and fees are shown at checkout.',
  },
  {
    category: 'Shipping & Delivery',
    q: 'How long does delivery take?',
    a: 'Standard delivery within the UAE typically takes 1–3 business days. Express delivery is available on selected items. Delivery times are estimates and may vary based on location and stock availability.',
  },
  {
    category: 'Shipping & Delivery',
    q: 'How much is shipping?',
    a: 'Shipping fees are calculated at checkout based on your location, selected method, and order value. We frequently offer free shipping promotions — check the homepage banners for current offers.',
  },

  // Payments
  {
    category: 'Payments',
    q: 'What payment methods are accepted?',
    a: 'We accept major credit and debit cards (Visa, Mastercard), digital wallets, and cash on delivery (where available). All online payments are processed securely by trusted payment partners.',
  },
  {
    category: 'Payments',
    q: 'Is my payment information secure?',
    a: 'Yes. We do not store your full card details on our servers. All payments are processed by certified third-party payment providers using encryption and industry-standard security.',
  },

  // Returns
  {
    category: 'Returns & Refunds',
    q: 'What is your return policy?',
    a: (
      <>
        Items can be returned if they are damaged, defective, incorrect, or materially
        different from the description. Products must be unused, in original packaging,
        with all tags and accessories. Read the full policy in our{' '}
        <Link to="/pages/terms">Terms &amp; Conditions</Link>.
      </>
    ),
  },
  {
    category: 'Returns & Refunds',
    q: 'How do I request a return?',
    a: (
      <>
        Contact us via the <Link to="/pages/contact">Contact page</Link>, WhatsApp, or
        email with your order number, product name, reason, and photos (if applicable).
        Our team will review and share the next steps.
      </>
    ),
  },
  {
    category: 'Returns & Refunds',
    q: 'How long do refunds take?',
    a: 'Once your return is approved and the item is received and inspected, refunds are issued to the original payment method. Processing times depend on your bank or payment provider, typically 5–10 business days.',
  },

  // Account
  {
    category: 'Account',
    q: 'Do I need an account to place an order?',
    a: 'You can browse without an account, but creating one lets you track orders, save favourites, and check out faster next time.',
  },
  {
    category: 'Account',
    q: 'I forgot my password — what now?',
    a: (
      <>
        Use the <Link to="/auth/login">Sign In page</Link> and click "Forgot password" to
        receive a reset link by email.
      </>
    ),
  },

  // Bulk
  {
    category: 'Bulk &amp; Business',
    q: 'Do you offer bulk or wholesale pricing?',
    a: (
      <>
        Yes. Visit our <Link to="/bulk-order">Bulk Orders</Link> page to submit a
        request — our team will get back to you with custom pricing and timelines.
      </>
    ),
  },

  // Support
  {
    category: 'Customer Support',
    q: 'How do I contact customer support?',
    a: (
      <>
        Reach us through the <Link to="/pages/contact">Contact page</Link>, on WhatsApp at{' '}
        <a href="https://wa.me/971557133051" target="_blank" rel="noopener noreferrer">
          +971 55 713 3051
        </a>
        , or by email at{' '}
        <a href="mailto:info@solotestsite.site">info@solotestsite.site</a>.
      </>
    ),
  },
  {
    category: 'Customer Support',
    q: 'What are your customer service hours?',
    a: 'Our team is available Sunday to Thursday, 9:00 AM to 6:00 PM (GST). Messages received outside these hours are answered the next business day.',
  },
];

export default function FaqPage() {
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? FAQS.filter(
          (f) =>
            f.q.toLowerCase().includes(q) ||
            (typeof f.a === 'string' && (f.a as string).toLowerCase().includes(q)) ||
            f.category.toLowerCase().includes(q),
        )
      : FAQS;
    const map = new Map<string, QA[]>();
    filtered.forEach((f) => {
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category)!.push(f);
    });
    return Array.from(map.entries());
  }, [query]);

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      {/* Hero */}
      <section
        style={{
          background:
            'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          color: '#fff',
          padding: '4rem 1.5rem 3rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.75rem', margin: 0, letterSpacing: '-0.02em' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.85, marginTop: '0.75rem' }}>
            Quick answers about orders, shipping, payments, returns and more. Can't find
            what you need? <Link to="/pages/contact" style={{ color: '#ffd166' }}>Contact us</Link>.
          </p>
          <div style={{ marginTop: '2rem', position: 'relative', maxWidth: 560, margin: '2rem auto 0' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the FAQs..."
              style={{
                width: '100%',
                padding: '0.95rem 1.25rem 0.95rem 3rem',
                borderRadius: 999,
                border: 'none',
                fontSize: '1rem',
                outline: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                color: '#1a1a2e',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 18,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.1rem',
                color: '#888',
              }}
            >
              🔍
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {grouped.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', padding: '3rem 0' }}>
            No questions match "<strong>{query}</strong>". Try a different keyword.
          </p>
        )}
        {grouped.map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: '2.5rem' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                color: '#0f3460',
                margin: '0 0 1rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid #0f3460',
                display: 'inline-block',
              }}
            >
              {cat}
            </h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {items.map((item, idx) => {
                const key = `${cat}-${idx}`;
                const open = openKey === key;
                return (
                  <div
                    key={key}
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      boxShadow: open
                        ? '0 8px 28px rgba(15, 52, 96, 0.12)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                      border: '1px solid #ececec',
                      overflow: 'hidden',
                      transition: 'box-shadow 0.2s ease',
                    }}
                  >
                    <button
                      onClick={() => setOpenKey(open ? null : key)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1.1rem 1.4rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#1a1a2e',
                      }}
                    >
                      <span>{item.q}</span>
                      <span
                        style={{
                          fontSize: '1.4rem',
                          color: '#0f3460',
                          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          marginLeft: '1rem',
                          flexShrink: 0,
                        }}
                      >
                        +
                      </span>
                    </button>
                    {open && (
                      <div
                        style={{
                          padding: '0 1.4rem 1.25rem',
                          color: '#444',
                          lineHeight: 1.65,
                          fontSize: '0.97rem',
                        }}
                      >
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Still need help block */}
        <div
          style={{
            marginTop: '3rem',
            background: 'linear-gradient(135deg, #fff 0%, #f0f4f8 100%)',
            borderRadius: 16,
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid #e5e7eb',
          }}
        >
          <h3 style={{ margin: 0, color: '#1a1a2e' }}>Still have questions?</h3>
          <p style={{ color: '#555', margin: '0.5rem 0 1.25rem' }}>
            Our customer support team is here to help.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to="/pages/contact"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: '#0f3460',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              Contact Us
            </Link>
            <a
              href="https://wa.me/971557133051"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: '#25D366',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
