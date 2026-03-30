import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    accountApi.getOrder(id).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-12 text-center text-gray-400">Loading order...</div>;
  if (!order) return <div className="py-12 text-center text-gray-500">Order not found.</div>;

  return (
    <div>
      <Link to="/account/orders" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">&larr; Back to Orders</Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Order #{order.orderNumber}</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {order.status}
        </span>
      </div>

      {/* Items */}
      <div className="border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold mb-4">Items</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <img
                src={item.imageUrl || '/placeholder.png'}
                alt={item.name}
                className="w-16 h-16 rounded object-cover bg-gray-100"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold flex-shrink-0">
                {config.currency} {item.total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold mb-3">Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{config.currency} {order.subtotal.toFixed(2)}</span></div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600"><span>Discount</span><span>−{config.currency} {order.discount.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shippingCost > 0 ? `${config.currency} ${order.shippingCost.toFixed(2)}` : 'Free'}</span></div>
          {order.vatAmount > 0 && (
            <div className="flex justify-between"><span className="text-gray-500">VAT</span><span>{config.currency} {order.vatAmount.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between font-bold border-t border-gray-200 pt-2"><span>Total</span><span>{config.currency} {order.total.toFixed(2)}</span></div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {order.shippingAddress && (
          <div className="border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold mb-2">Shipping Address</h2>
            <p className="text-sm">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
            <p className="text-sm text-gray-500">{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && <p className="text-sm text-gray-500">{order.shippingAddress.addressLine2}</p>}
            <p className="text-sm text-gray-500">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p className="text-sm text-gray-500">{order.shippingAddress.country}</p>
            {order.shippingAddress.phone && <p className="text-sm text-gray-500 mt-1">{order.shippingAddress.phone}</p>}
          </div>
        )}
        {order.billingAddress && (
          <div className="border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold mb-2">Billing Address</h2>
            <p className="text-sm">{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
            <p className="text-sm text-gray-500">{order.billingAddress.addressLine1}</p>
            {order.billingAddress.addressLine2 && <p className="text-sm text-gray-500">{order.billingAddress.addressLine2}</p>}
            <p className="text-sm text-gray-500">{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}</p>
            <p className="text-sm text-gray-500">{order.billingAddress.country}</p>
          </div>
        )}
      </div>

      {/* Payment & Tracking */}
      <div className="border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold mb-3">Payment & Delivery</h2>
        <div className="space-y-2 text-sm">
          {order.paymentMethod && (
            <div className="flex justify-between"><span className="text-gray-500">Payment Method</span><span>{order.paymentMethod}</span></div>
          )}
          {order.trackingNumber && (
            <div className="flex justify-between"><span className="text-gray-500">Tracking Number</span><span className="font-mono">{order.trackingNumber}</span></div>
          )}
          <div className="flex justify-between"><span className="text-gray-500">Placed</span><span>{new Date(order.createdAt).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Last Updated</span><span>{new Date(order.updatedAt).toLocaleString()}</span></div>
          {order.notes && (
            <div className="mt-2"><span className="text-gray-500 block">Notes</span><p className="mt-0.5">{order.notes}</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
