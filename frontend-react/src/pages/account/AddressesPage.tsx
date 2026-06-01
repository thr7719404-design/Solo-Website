import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { accountApi } from '@/api/account';
import type { AddressDto, CreateAddressRequest } from '@/types';

const EMPTY: CreateAddressRequest = {
  label: '', firstName: '', lastName: '', phone: '', addressLine1: '', addressLine2: '', city: '', postalCode: '', country: 'AE',
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAddressRequest>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    accountApi.getAddresses().then(setAddresses).finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openNew = () => { setEditId('new'); setForm({ ...EMPTY }); };
  const openEdit = (a: AddressDto) => {
    setEditId(a.id);
    setForm({ label: a.label ?? '', firstName: a.firstName, lastName: a.lastName, phone: a.phone ?? '', addressLine1: a.addressLine1, addressLine2: a.addressLine2 ?? '', city: a.city, postalCode: a.postalCode ?? '', country: a.country, isDefault: a.isDefault });
  };
  const close = () => setEditId(null);

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.addressLine1 || !form.city) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      if (editId === 'new') {
        await accountApi.createAddress(form);
        toast.success('Address added');
      } else if (editId) {
        await accountApi.updateAddress(editId, form);
        toast.success('Address updated');
      }
      close();
      load();
    } catch {
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      await accountApi.deleteAddress(id);
      toast.success('Address deleted');
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to delete address';
      toast.error(msg);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await accountApi.setDefaultAddress(id);
      toast.success('Default address updated');
      load();
    } catch {
      toast.error('Failed to set default');
    }
  };

  const update = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 mt-3">Loading addresses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Addresses</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your delivery addresses</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Address
        </button>
      </div>

      {/* Editor drawer */}
      {editId !== null && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">{editId === 'new' ? 'New Address' : 'Edit Address'}</h2>
            <button onClick={close} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                ['label', 'Label (e.g. Home, Office)', false],
                ['firstName', 'First Name *', false],
                ['lastName', 'Last Name *', false],
                ['phone', 'Phone', false],
                ['addressLine1', 'Street Address *', true],
                ['addressLine2', 'Apartment / Suite', true],
                ['city', 'City *', false],
                ['postalCode', 'Postal Code', false],
              ] as const).map(([key, label, wide]) => (
                <div key={key} className={wide ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                  <input
                    value={String(form[key] ?? '')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (key === 'phone') {
                        // Allow only digits with optional leading +
                        const hasPlus = raw.trimStart().startsWith('+');
                        const digits = raw.replace(/[^0-9]/g, '');
                        update(key, (hasPlus ? '+' : '') + digits);
                      } else {
                        update(key, raw);
                      }
                    }}
                    inputMode={key === 'phone' ? 'tel' : undefined}
                    type={key === 'phone' ? 'tel' : 'text'}
                    pattern={key === 'phone' ? '\\+?[0-9]*' : undefined}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/20 focus:border-[#B8860B] transition-all"
                  />
                </div>
              ))}
              <div className="sm:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.isDefault ?? false}
                  onChange={(e) => update('isDefault', e.target.checked)}
                  id="addr-default"
                  className="w-4 h-4 rounded border-gray-300 text-[#B8860B] focus:ring-[#B8860B]"
                />
                <label htmlFor="addr-default" className="text-sm text-gray-700">Set as primary address</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-xl hover:bg-[#9a7209] transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Address'}
              </button>
              <button onClick={close} className="px-6 py-2.5 border border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address cards */}
      {addresses.length === 0 && editId === null ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">No addresses saved</h2>
          <p className="text-sm text-gray-500 mb-5">Add your first delivery address.</p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-colors"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div
              key={a.id}
              className={`bg-white rounded-2xl shadow-sm p-5 relative transition-all duration-200 ${
                a.isDefault
                  ? 'border-2 border-[#B8860B] ring-1 ring-[#B8860B]/10'
                  : 'border border-gray-100 hover:border-gray-200'
              }`}
            >
              {a.isDefault && (
                <div className="absolute -top-2.5 left-4">
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#B8860B] text-white shadow-sm">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Primary
                  </span>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.isDefault ? 'bg-[#B8860B]/10' : 'bg-gray-100'}`}>
                  <svg className={`w-5 h-5 ${a.isDefault ? 'text-[#B8860B]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{a.label || `${a.firstName} ${a.lastName}`}</p>
                  <p className="text-sm text-gray-500 mt-1">{a.firstName} {a.lastName}</p>
                  <p className="text-sm text-gray-500">{[a.addressLine1, a.addressLine2].filter(Boolean).join(', ')}</p>
                  <p className="text-sm text-gray-500">{[a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ')}</p>
                  {a.phone && <p className="text-sm text-gray-400 mt-0.5">{a.phone}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                {!a.isDefault && (
                  <button
                    onClick={() => handleSetDefault(a.id)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#B8860B]/10 text-[#B8860B] hover:bg-[#B8860B]/20 transition-colors"
                  >
                    Set as Primary
                  </button>
                )}
                <button
                  onClick={() => openEdit(a)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
