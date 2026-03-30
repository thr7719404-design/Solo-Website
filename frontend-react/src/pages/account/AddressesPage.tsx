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
  const [editId, setEditId] = useState<string | null>(null); // null = closed, 'new' = create
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
    } catch {
      toast.error('Failed to delete address');
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

  if (loading) return <div className="py-12 text-center text-gray-400">Loading addresses...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Addresses</h1>
        <button onClick={openNew} className="text-sm font-semibold px-4 py-2 bg-black text-white rounded hover:bg-gray-900 transition-colors">
          + Add New
        </button>
      </div>

      {/* Editor modal */}
      {editId !== null && (
        <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-gray-50">
          <h2 className="text-sm font-semibold mb-4">{editId === 'new' ? 'New Address' : 'Edit Address'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              ['label', 'Label (e.g. Home, Office)'],
              ['firstName', 'First Name *'],
              ['lastName', 'Last Name *'],
              ['phone', 'Phone'],
              ['addressLine1', 'Street Address *'],
              ['addressLine2', 'Apartment / Suite'],
              ['city', 'City *'],
              ['postalCode', 'Postal Code'],
            ] as const).map(([key, label]) => (
              <div key={key} className={key === 'addressLine1' || key === 'addressLine2' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input
                  value={String(form[key] ?? '')}
                  onChange={(e) => update(key, e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B8860B]"
                />
              </div>
            ))}
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isDefault ?? false}
                onChange={(e) => update('isDefault', e.target.checked)}
                id="addr-default"
                className="w-4 h-4"
              />
              <label htmlFor="addr-default" className="text-sm">Set as default address</label>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-black text-white text-sm font-semibold rounded hover:bg-gray-900 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={close} className="px-6 py-2 border border-gray-300 text-sm font-semibold rounded hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Address cards */}
      {addresses.length === 0 && editId === null ? (
        <div className="py-20 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-600 mb-1">No addresses saved</h2>
          <button onClick={openNew} className="mt-3 text-sm text-[#B8860B] font-semibold hover:underline">
            Add your first address
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((a) => (
            <div
              key={a.id}
              className={`border rounded-lg p-5 ${a.isDefault ? 'border-[#B8860B] border-2' : 'border-gray-200'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className={`w-4 h-4 ${a.isDefault ? 'text-[#B8860B]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="font-semibold text-sm">{a.label || `${a.firstName} ${a.lastName}`}</span>
                    {a.isDefault && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#B8860B]/10 text-[#B8860B] font-medium">Default</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{[a.addressLine1, a.addressLine2, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ')}</p>
                  {a.phone && <p className="text-sm text-gray-500 mt-0.5">{a.phone}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!a.isDefault && (
                    <button onClick={() => handleSetDefault(a.id)} className="text-xs text-[#B8860B] hover:underline">Set Default</button>
                  )}
                  <button onClick={() => openEdit(a)} className="text-xs text-gray-500 hover:text-gray-700">Edit</button>
                  <button onClick={() => handleDelete(a.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
