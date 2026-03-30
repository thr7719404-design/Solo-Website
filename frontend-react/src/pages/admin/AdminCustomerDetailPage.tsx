import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customersApi } from '@/api/customers';
import type { CustomerDetailsDto, CustomerAddressDto, CustomerOrderSummaryDto } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-orange-100 text-orange-700', PAID: 'bg-teal-100 text-teal-700',
  PROCESSING: 'bg-blue-100 text-blue-700', SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700',
};

type Tab = 'profile' | 'addresses' | 'orders';

export default function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '', isActive: true });
  const [loyaltyAmount, setLoyaltyAmount] = useState('');
  const [loyaltyDesc, setLoyaltyDesc] = useState('');

  const load = () => {
    if (!id) return;
    setLoading(true);
    customersApi.getCustomer(id).then((c) => {
      setCustomer(c);
      setEditForm({ firstName: c.firstName ?? '', lastName: c.lastName ?? '', phone: c.phone ?? '', isActive: c.isActive });
      setLoading(false);
    });
  };
  useEffect(load, [id]);

  const handleSaveProfile = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await customersApi.updateCustomer(id, { firstName: editForm.firstName, lastName: editForm.lastName, phone: editForm.phone || undefined, isActive: editForm.isActive });
      toast.success('Customer updated');
      load();
    } catch { toast.error('Failed to update'); } finally { setSaving(false); }
  };

  const handleAdjustLoyalty = async () => {
    if (!id || !loyaltyAmount) return;
    try {
      await customersApi.adjustLoyalty(id, { amountAed: parseFloat(loyaltyAmount), description: loyaltyDesc || undefined });
      toast.success('Loyalty adjusted');
      setLoyaltyAmount(''); setLoyaltyDesc('');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleDeleteAddress = async (addr: CustomerAddressDto) => {
    if (!confirm('Delete this address?')) return;
    try { await customersApi.deleteAddress(addr.id); toast.success('Address deleted'); load(); } catch { toast.error('Failed'); }
  };

  const handleSetDefault = async (addr: CustomerAddressDto) => {
    try { await customersApi.setDefaultAddress(addr.id); toast.success('Default set'); load(); } catch { toast.error('Failed'); }
  };

  if (loading || !customer) return <div className="py-12 text-center text-gray-400">Loading customer...</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'addresses', label: `Addresses (${customer.addresses?.length ?? 0})` },
    { key: 'orders', label: `Orders (${customer.orders?.length ?? 0})` },
  ];

  return (
    <div>
      <Link to="/admin/customers" className="text-sm text-indigo-600 hover:underline mb-4 inline-block">&larr; Back to Customers</Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{customer.firstName} {customer.lastName}</h1>
          <p className="text-sm text-gray-500">{customer.email}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {customer.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="space-y-6">
          <section className="border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold mb-4">Edit Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">First Name</label><input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label><input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Phone</label><input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              <label className="flex items-center gap-2 text-sm cursor-pointer self-end pb-2"><input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} className="w-4 h-4" /> Active</label>
            </div>
            <button onClick={handleSaveProfile} disabled={saving} className="mt-4 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </section>

          <section className="border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold mb-3">Account Info</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">Email Verified</span><span>{customer.emailVerified ? 'Yes' : 'No'}</span>
              <span className="text-gray-500">Role</span><span>{customer.role}</span>
              <span className="text-gray-500">Joined</span><span>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '—'}</span>
              <span className="text-gray-500">Last Login</span><span>{customer.lastLoginAt ? new Date(customer.lastLoginAt).toLocaleString() : '—'}</span>
              <span className="text-gray-500">Orders</span><span>{customer.orderCount ?? 0}</span>
              <span className="text-gray-500">Total Spent</span><span>AED {(customer.totalSpent ?? 0).toFixed(2)}</span>
            </div>
          </section>

          <section className="border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold mb-3">Adjust Loyalty Points</h2>
            <div className="flex gap-3 items-end">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Amount (AED)</label><input type="number" value={loyaltyAmount} onChange={(e) => setLoyaltyAmount(e.target.value)} className="w-32 border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              <div className="flex-1"><label className="block text-xs font-medium text-gray-500 mb-1">Description</label><input value={loyaltyDesc} onChange={(e) => setLoyaltyDesc(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              <button onClick={handleAdjustLoyalty} className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded hover:bg-amber-700">Adjust</button>
            </div>
          </section>
        </div>
      )}

      {/* Addresses tab */}
      {tab === 'addresses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(customer.addresses ?? []).map((a) => (
            <div key={a.id} className={`border rounded-lg p-4 ${a.isDefault ? 'border-amber-400 bg-amber-50/30' : 'border-gray-200'}`}>
              {a.isDefault && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded mb-2 inline-block">Default</span>}
              {a.label && <p className="text-sm font-semibold">{a.label}</p>}
              <p className="text-sm">{a.firstName} {a.lastName}</p>
              <p className="text-sm text-gray-600">{a.addressLine1}</p>
              {a.addressLine2 && <p className="text-sm text-gray-600">{a.addressLine2}</p>}
              <p className="text-sm text-gray-600">{a.city}{a.state ? `, ${a.state}` : ''} {a.postalCode}</p>
              <p className="text-sm text-gray-600">{a.country}</p>
              {a.phone && <p className="text-sm text-gray-500 mt-1">{a.phone}</p>}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                {!a.isDefault && <button onClick={() => handleSetDefault(a)} className="text-amber-600 hover:underline text-xs">Set Default</button>}
                <button onClick={() => handleDeleteAddress(a)} className="text-red-600 hover:underline text-xs">Delete</button>
              </div>
            </div>
          ))}
          {(!customer.addresses || customer.addresses.length === 0) && <p className="col-span-full py-8 text-center text-gray-400">No addresses</p>}
        </div>
      )}

      {/* Orders tab */}
      {tab === 'orders' && (
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
            <th className="py-2 pr-4">Order #</th><th className="py-2 pr-4">Total</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Date</th>
          </tr></thead>
          <tbody>
            {(customer.orders ?? []).map((o: CustomerOrderSummaryDto) => (
              <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2.5 pr-4"><Link to={`/admin/orders/${o.id}`} className="text-indigo-600 hover:underline">{o.orderNumber}</Link></td>
                <td className="py-2.5 pr-4 font-medium">AED {o.total.toFixed(2)}</td>
                <td className="py-2.5 pr-4"><span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>{o.status.replace(/_/g, ' ')}</span></td>
                <td className="py-2.5 pr-4 text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {(!customer.orders || customer.orders.length === 0) && <tr><td colSpan={4} className="py-8 text-center text-gray-400">No orders</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
