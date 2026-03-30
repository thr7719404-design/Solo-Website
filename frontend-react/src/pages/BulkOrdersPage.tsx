import { useState, useRef, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

const BUSINESS_TYPES = ['Hotel', 'Restaurant', 'Café', 'Office', 'Catering', 'Retail Store', 'Other'];

interface OrderItem {
  key: number;
  product: string;
  quantity: string;
}

export default function BulkOrdersPage() {
  const [submitted, setSubmitted] = useState(false);
  const nextKey = useRef(1);
  const [items, setItems] = useState<OrderItem[]>([{ key: 0, product: '', quantity: '' }]);

  const [form, setForm] = useState({
    companyName: '',
    businessType: 'Hotel',
    contactName: '',
    email: '',
    phone: '',
    message: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const addItem = () => {
    const k = nextKey.current++;
    setItems((prev) => [...prev, { key: k, product: '', quantity: '' }]);
  };
  const removeItem = (key: number) => setItems((prev) => prev.filter((x) => x.key !== key));
  const updateItem = (key: number, field: keyof OrderItem, v: string) =>
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, [field]: v } : item)));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-4xl mb-5">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quote Request Received!</h1>
        <p className="text-gray-500 max-w-md mb-6 text-[15px]">
          Thank you for your interest. Our wholesale team will review your request and get back to
          you within 24 hours.
        </p>
        <Link to="/products" className="px-6 py-2.5 bg-[#B8860B] text-white text-sm font-medium rounded-xl hover:bg-[#9A7209] transition">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm mb-6">
            <span>📦</span>
            <span className="font-medium">Wholesale & B2B</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Bulk Orders & Wholesale</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Outfit your hotel, restaurant, or business with premium kitchenware at competitive
            wholesale pricing. Get a custom quote tailored to your needs.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: '💰', title: 'Competitive Pricing', desc: 'Volume discounts that grow with your order size — the more you order, the more you save.' },
            { icon: '✅', title: 'Quality Assurance', desc: 'Every item undergoes the same quality checks whether you order 1 or 1,000 units.' },
            { icon: '🤝', title: 'Dedicated Support', desc: 'A dedicated account manager for your business, from initial quote to ongoing reorders.' },
            { icon: '🚚', title: 'Fast Delivery', desc: 'Priority fulfillment across the UAE with flexible scheduling for large shipments.' },
          ].map((b) => (
            <div key={b.title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
              <span className="text-3xl block mb-3">{b.icon}</span>
              <h3 className="text-[15px] font-semibold text-gray-900 mb-1.5">{b.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote Form */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Request a Quote</h2>
          <p className="text-gray-500 text-center text-sm mb-8">
            Fill out the form below and our wholesale team will get back to you within 24 hours.
          </p>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
            {/* Business Info */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Business Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bq-company" className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    id="bq-company"
                    required
                    value={form.companyName}
                    onChange={(e) => set('companyName', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="bq-btype" className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                  <select
                    id="bq-btype"
                    value={form.businessType}
                    onChange={(e) => set('businessType', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] outline-none"
                  >
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="bq-contact" className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                  <input
                    id="bq-contact"
                    required
                    value={form.contactName}
                    onChange={(e) => set('contactName', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="bq-email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    id="bq-email"
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="bq-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    id="bq-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+971 …"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Products Needed</p>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <input
                      value={item.product}
                      onChange={(e) => updateItem(item.key, 'product', e.target.value)}
                      placeholder="Product name or description"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] outline-none"
                    />
                    <input
                      value={item.quantity}
                      onChange={(e) => updateItem(item.key, 'quantity', e.target.value)}
                      placeholder="Qty"
                      type="number"
                      min="1"
                      className="w-24 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] outline-none"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="text-gray-400 hover:text-red-500 text-lg transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="mt-3 text-sm text-[#B8860B] font-medium hover:underline"
              >
                + Add another product
              </button>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="bq-message" className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
              <textarea
                id="bq-message"
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                rows={4}
                placeholder="Special requirements, delivery timeline, budget range…"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#B8860B] text-white font-semibold rounded-xl hover:bg-[#9A7209] transition shadow-sm"
            >
              Submit Quote Request
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
