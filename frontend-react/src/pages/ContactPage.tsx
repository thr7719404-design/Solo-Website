import { useState } from 'react';
import api from '@/api/client';

/**
 * Contact form that lets the visitor submit an inquiry to Solo via either
 * WhatsApp or Email. Both channels send to the same admin contact details.
 */
const ADMIN_WHATSAPP = '971557133051';        // wa.me format (no '+')
const ADMIN_EMAIL = 'info@solotestsite.site'; // change here to update destination

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const EMPTY: FormState = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [sentVia, setSentVia] = useState<'whatsapp' | 'email' | null>(null);
  const [sending, setSending] = useState(false);

  const update = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setError(null);
    setSentVia(null);
  };

  const validate = (): boolean => {
    if (!form.name.trim()) return setError('Please enter your name'), false;
    if (!form.message.trim()) return setError('Please enter a message'), false;
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const composeBody = (): string => {
    const lines = [
      `Name: ${form.name}`,
      form.email ? `Email: ${form.email}` : null,
      form.phone ? `Phone: ${form.phone}` : null,
      '',
      form.message,
    ].filter(Boolean);
    return lines.join('\n');
  };

  const sendViaWhatsApp = () => {
    if (!validate()) return;
    const text = composeBody();
    const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
    setSentVia('whatsapp');
  };

  const sendViaEmail = async () => {
    if (!validate()) return;
    if (!form.email.trim()) {
      setError('Please enter your email address so we can reply to you.');
      return;
    }
    setSending(true);
    try {
      await api.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      });
      setSentVia('email');
      setForm(EMPTY);
    } catch {
      setError('Failed to send your message. Please try again or contact us via WhatsApp.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
            Contact Us
          </h1>
          <p style={{ fontSize: 16, color: '#666', margin: 0, lineHeight: 1.5 }}>
            Have a question or special request? Send us a quick message via WhatsApp or email.
          </p>
        </div>

        {/* Quick contact strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 32 }}>
          <a
            href={`https://wa.me/${ADMIN_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', background: '#fff', borderRadius: 12,
              border: '1px solid #eee', textDecoration: 'none', color: '#1a1a1a',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#25D366'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>
              💬
            </span>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>WhatsApp</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>+971 55 713 3051</div>
            </div>
          </a>
          <a
            href={`mailto:${ADMIN_EMAIL}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', background: '#fff', borderRadius: 12,
              border: '1px solid #eee', textDecoration: 'none', color: '#1a1a1a',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B8860B'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span style={{ width: 36, height: 36, borderRadius: '50%', background: '#B8860B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>
              ✉️
            </span>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>Email</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{ADMIN_EMAIL}</div>
            </div>
          </a>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => { e.preventDefault(); sendViaWhatsApp(); }}
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '32px 28px',
            border: '1px solid #eee',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
            <Field label="Name *" htmlFor="contact-name">
              <input
                id="contact-name"
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder="Your name"
                style={inputStyle}
                required
              />
            </Field>
            <Field label="Email" htmlFor="contact-email">
              <input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
            <Field label="Phone" htmlFor="contact-phone">
              <input
                id="contact-phone"
                type="tel"
                value={form.phone}
                onChange={update('phone')}
                placeholder="+971 …"
                style={inputStyle}
              />
            </Field>
            <Field label="Subject" htmlFor="contact-subject">
              <input
                id="contact-subject"
                type="text"
                value={form.subject}
                onChange={update('subject')}
                placeholder="What's this about?"
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Message *" htmlFor="contact-message">
            <textarea
              id="contact-message"
              value={form.message}
              onChange={update('message')}
              placeholder="How can we help?"
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 120, fontFamily: 'inherit' }}
              required
            />
          </Field>

          {error && (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              color: '#b91c1c',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {sentVia && !error && (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              color: '#15803d',
              fontSize: 13,
            }}>
              {sentVia === 'whatsapp'
                ? '✓ WhatsApp opened — please tap Send in the chat to deliver your message.'
                : '✓ Message sent! We\'ll get back to you as soon as possible.'}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            <button
              type="submit"
              style={{
                flex: '1 1 200px',
                padding: '14px 20px',
                background: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.18s, transform 0.18s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1ebe5a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#25D366'; }}
            >
              💬 Send via WhatsApp
            </button>
            <button
              type="button"
              onClick={sendViaEmail}
              disabled={sending}
              style={{
                flex: '1 1 200px',
                padding: '14px 20px',
                background: sending ? '#c9a84c' : '#B8860B',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: sending ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.18s',
              }}
              onMouseEnter={(e) => { if (!sending) e.currentTarget.style.background = '#9a710a'; }}
              onMouseLeave={(e) => { if (!sending) e.currentTarget.style.background = '#B8860B'; }}
            >
              {sending ? '⏳ Sending…' : '✉️ Send via Email'}
            </button>
          </div>

          <p style={{ marginTop: 14, fontSize: 12, color: '#999', textAlign: 'center' }}>
            WhatsApp opens a pre-filled chat. Email sends directly to our support team.
          </p>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  fontSize: 14,
  border: '1.5px solid #e5e7eb',
  borderRadius: 10,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  transition: 'border-color 0.18s',
  fontFamily: 'inherit',
};

function Field({ label, htmlFor, children }: { readonly label: string; readonly htmlFor: string; readonly children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
