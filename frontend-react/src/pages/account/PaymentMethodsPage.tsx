import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { accountApi } from '@/api/account';
import type { PaymentMethodDto } from '@/types';

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethodDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    accountApi.getPaymentMethods().then(setMethods).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSetDefault = async (id: string) => {
    try {
      await accountApi.setDefaultPaymentMethod(id);
      toast.success('Default payment method updated');
      load();
    } catch {
      toast.error('Failed to update default');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this payment method?')) return;
    try {
      await accountApi.deletePaymentMethod(id);
      toast.success('Payment method removed');
      load();
    } catch {
      toast.error('Failed to remove payment method');
    }
  };

  if (loading) return <div className="py-12 text-center text-gray-400">Loading payment methods...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Payment Methods</h1>
      </div>

      {methods.length === 0 ? (
        <div className="py-20 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-600 mb-1">No payment methods</h2>
          <p className="text-sm text-gray-400">Payment methods added during checkout will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {methods.map((m) => (
            <div
              key={m.id}
              className={`border rounded-lg p-5 flex items-center justify-between ${m.isDefault ? 'border-[#B8860B] border-2' : 'border-gray-200'}`}
            >
              <div className="flex items-center gap-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    •••• {m.last4}
                    {m.isDefault && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#B8860B]/10 text-[#B8860B] font-medium">Default</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{m.brand}</p>
                </div>
              </div>
              <div className="flex gap-3">
                {!m.isDefault && (
                  <button onClick={() => handleSetDefault(m.id)} className="text-xs text-[#B8860B] hover:underline">Set Default</button>
                )}
                <button onClick={() => handleDelete(m.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
