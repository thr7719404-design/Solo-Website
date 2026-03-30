import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountApi } from '@/api/account';
import { config } from '@/config';
import type { OrderDto } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-green-100 text-green-700',
  PENDING: 'bg-orange-100 text-orange-700',
  PROCESSING: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    accountApi.getOrders().then(setOrders).finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <div className="py-12 text-center text-gray-400">Loading orders...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">My Orders</h1>
        <button onClick={load} className="text-sm text-gray-500 hover:text-gray-900 transition-colors" title="Refresh">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="py-20 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-600 mb-1">No orders yet</h2>
          <p className="text-sm text-gray-400">Your order history will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/account/orders/${order.id}`}
              className="block border border-gray-200 rounded-lg p-5 hover:border-[#B8860B]/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">Order #{order.orderNumber}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Total: {config.currency} {Number(order.total).toFixed(2)}</span>
                <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">{(order.items ?? []).length} item(s)</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
