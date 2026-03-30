import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customersApi } from '@/api/customers';
import type { CustomerDto, CreateCustomerRequest } from '@/types';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await customersApi.getCustomers({ page, limit, search: search || undefined });
    setCustomers(res.data);
    setTotal(res.total);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      toast.error('Email, password, first & last name required');
      return;
    }
    setSaving(true);
    const body: CreateCustomerRequest = { email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined };
    try {
      await customersApi.createCustomer(body);
      toast.success('Customer created');
      setCreating(false); load();
    } catch { toast.error('Failed to create customer'); } finally { setSaving(false); }
  };

  const handleDelete = async (c: CustomerDto) => {
    if (!confirm(`Delete "${c.email}"?`)) return;
    try { await customersApi.deleteCustomer(c.id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Customers</h1>
        <button onClick={() => { setForm({ email: '', password: '', firstName: '', lastName: '', phone: '' }); setCreating(true); }} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded hover:bg-indigo-700">+ New Customer</button>
      </div>

      <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search email or name..." className="mb-4 w-full max-w-sm border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />

      {loading ? <p className="text-gray-400 py-8 text-center">Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
              <th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Orders</th><th className="py-2 pr-4">Spent</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Joined</th><th className="py-2">Actions</th>
            </tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-medium">
                    <Link to={`/admin/customers/${c.id}`} className="text-indigo-600 hover:underline">{c.firstName} {c.lastName}</Link>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">{c.email}</td>
                  <td className="py-2.5 pr-4">{c.orderCount ?? 0}</td>
                  <td className="py-2.5 pr-4">AED {(c.totalSpent ?? 0).toFixed(2)}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="py-2.5">
                    <button onClick={() => handleDelete(c)} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No customers found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-sm border rounded disabled:opacity-30">Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-sm border rounded disabled:opacity-30">Next</button>
          </div>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">New Customer</h2>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Email *</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Password *</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-500 mb-1">First Name *</label><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Last Name *</label><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
