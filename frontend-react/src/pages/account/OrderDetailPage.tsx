import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { accountApi } from '@/api/account';
import { returnsApi } from '@/api/returns';
import { downloadOrderInvoice } from '@/api/invoices';
import { config } from '@/config';
import toast from 'react-hot-toast';
import type { OrderDto } from '@/types';

const RETURN_REASONS = [
  { value: 'DEFECTIVE', label: 'Defective / Not Working' },
  { value: 'WRONG_ITEM', label: 'Wrong Item Received' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not As Described' },
  { value: 'CHANGED_MIND', label: 'Changed My Mind' },
  { value: 'ARRIVED_LATE', label: 'Arrived Late' },
  { value: 'DAMAGED_IN_SHIPPING', label: 'Damaged In Shipping' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10',
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10',
  PROCESSING: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10',
  SHIPPED: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10',
  CANCELLED: 'bg-red-50 text-red-700 ring-1 ring-red-600/10',
  REFUNDED: 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/10',
  RETURNED: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/10',
};

const PIPELINE = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;
const PIPELINE_IDX: Record<string, number> = { PENDING: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3 };
const STEP_META: Record<string, { label: string; icon: JSX.Element; color: string; bg: string }> = {
  PENDING: {
    label: 'Order Placed',
    color: '#d97706', bg: '#fffbeb',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  PROCESSING: {
    label: 'Processing',
    color: '#2563eb', bg: '#eff6ff',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  SHIPPED: {
    label: 'Shipped',
    color: '#7c3aed', bg: '#f5f3ff',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>,
  },
  DELIVERED: {
    label: 'Delivered',
    color: '#059669', bg: '#ecfdf5',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Return request state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    if (!id) return;
    accountApi.getOrder(id).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  const toggleReturnItem = (itemId: string, maxQty: number) => {
    setReturnItems(prev => {
      const copy = { ...prev };
      if (copy[itemId]) {
        delete copy[itemId];
      } else {
        copy[itemId] = maxQty;
      }
      return copy;
    });
  };

  const updateReturnQty = (itemId: string, qty: number) => {
    setReturnItems(prev => ({ ...prev, [itemId]: qty }));
  };

  const submitReturn = async () => {
    if (!order) return;
    const items = Object.entries(returnItems)
      .filter(([, qty]) => qty > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (items.length === 0) { toast.error('Select at least one item to return'); return; }
    if (!returnReason) { toast.error('Please select a reason'); return; }

    setSubmittingReturn(true);
    try {
      await returnsApi.create({ orderId: order.id, reason: returnReason, customerNotes: returnNotes || undefined, items });
      toast.success('Return request submitted');
      setShowReturnModal(false);
      setReturnItems({});
      setReturnReason('');
      setReturnNotes('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit return request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) return <div className="py-16 text-center"><div className="w-6 h-6 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  if (!order) return (
    <div className="py-16 text-center">
      <p className="text-gray-500">Order not found.</p>
      <Link to="/account/orders" className="text-sm text-[#B8860B] hover:underline mt-2 inline-block">Back to Orders</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadOrderInvoice(order.id, order.orderNumber).catch(() => toast.error('Failed to download invoice'))}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-[#B8860B] text-white hover:bg-[#9a7109] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            Download Invoice
          </button>
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* ─── Order Progress Tracker ─── */}
      {(() => {
        const currentStatus = order.status as string;
        const isCancelled = currentStatus === 'CANCELLED';
        const isRefunded = currentStatus === 'REFUNDED';
        const isReturned = currentStatus === 'RETURNED';
        const isTerminal = isCancelled || isRefunded || isReturned;
        const pipelineIdx = PIPELINE_IDX[currentStatus] ?? -1;

        if (isTerminal) {
          let iconClass: string;
          if (isCancelled) iconClass = 'bg-red-50 text-red-600';
          else if (isReturned) iconClass = 'bg-purple-50 text-purple-600';
          else iconClass = 'bg-orange-50 text-orange-600';
          let titleClass: string;
          if (isCancelled) titleClass = 'text-red-700';
          else if (isReturned) titleClass = 'text-purple-700';
          else titleClass = 'text-orange-700';
          let titleWord: string;
          if (isCancelled) titleWord = 'Cancelled';
          else if (isReturned) titleWord = 'Returned';
          else titleWord = 'Refunded';
          let actionWord: string;
          if (isCancelled) actionWord = 'cancelled';
          else if (isReturned) actionWord = 'returned';
          else actionWord = 'refunded';
          return (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
                  {isCancelled
                    ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                  }
                </div>
                <div>
                  <p className={`text-sm font-semibold ${titleClass}`}>
                    Order {titleWord}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    This order was {actionWord} on {new Date(order.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#B8860B]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#B8860B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Order Progress</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {pipelineIdx >= 3 ? 'Your order has been delivered!' : `Step ${pipelineIdx + 1} of ${PIPELINE.length}`}
                </p>
              </div>
            </div>
            <div className="px-6 py-6">
              {/* Progress bar background */}
              <div className="relative">
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100 rounded-full" />
                <div
                  className="absolute top-5 left-5 h-0.5 rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: pipelineIdx <= 0 ? '0%' : `calc(${(pipelineIdx / (PIPELINE.length - 1)) * 100}% - 40px)`,
                    background: `linear-gradient(90deg, ${STEP_META.PENDING.color}, ${STEP_META[PIPELINE[Math.min(pipelineIdx, 3)]].color})`,
                  }}
                />
                {/* Nodes */}
                <div className="relative flex justify-between">
                  {PIPELINE.map((step, i) => {
                    const meta = STEP_META[step];
                    const isActive = pipelineIdx === i;
                    const isPast = pipelineIdx > i;
                    const isFuture = pipelineIdx < i;
                    const nodeBg = (isPast || isActive) ? meta.color : '#f9fafb';

                    return (
                      <div key={step} className="flex flex-col items-center" style={{ width: 80 }}>
                        <div
                          className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500"
                          style={{
                            background: nodeBg,
                            color: isPast || isActive ? '#fff' : '#d1d5db',
                            border: isFuture ? '2px solid #e5e7eb' : 'none',
                            boxShadow: isActive ? `0 0 0 4px ${meta.bg}, 0 2px 8px ${meta.color}33` : 'none',
                          }}
                        >
                          {isPast ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          ) : (
                            meta.icon
                          )}
                        </div>
                        <span
                          className="mt-2.5 text-xs font-medium text-center leading-tight"
                          style={{ color: isPast || isActive ? meta.color : '#9ca3af' }}
                        >
                          {meta.label}
                        </span>
                        {isActive && (
                          <span className="mt-1 text-[10px] text-gray-400">Current</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Tracking info inline if shipped */}
            {order.trackingNumber && pipelineIdx >= 2 && (
              <div className="mx-6 mb-5 px-4 py-3 bg-indigo-50 rounded-xl flex items-center gap-3">
                <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-indigo-700">Tracking Number</p>
                  <p className="text-sm font-mono text-indigo-600 mt-0.5">{order.trackingNumber}</p>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Items */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#B8860B]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#B8860B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Items ({order.items.length})</h2>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 px-6 py-4">
              <img
                src={item.imageUrl || '/placeholder.png'}
                alt={item.name}
                className="w-16 h-16 rounded-xl object-cover bg-gray-50 border border-gray-100"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">SKU: {item.sku}</p>
                <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                {config.currency} {Number(item.subtotal || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Order Summary</h2>
        </div>
        <div className="p-6 space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal (excl. VAT)</span><span className="font-medium">{config.currency} {Number(order.subtotalExclVat || order.subtotal || 0).toFixed(2)}</span></div>
          {Number(order.vatAmount || 0) > 0 && (
            <div className="flex justify-between"><span className="text-gray-500">VAT ({Number(order.vatRateSnapshot || 0.05) * 100}%)</span><span className="font-medium">{config.currency} {Number(order.vatAmount).toFixed(2)}</span></div>
          )}
          {Number(order.discount || 0) > 0 && (
            <div className="flex justify-between text-emerald-600"><span>Discount</span><span className="font-medium">−{config.currency} {Number(order.discount).toFixed(2)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-medium">{Number(order.shippingCost || 0) > 0 ? `${config.currency} ${Number(order.shippingCost).toFixed(2)}` : 'Free'}</span></div>
          <div className="flex justify-between font-bold border-t border-gray-100 pt-3 text-base"><span>Total</span><span>{config.currency} {Number(order.total || 0).toFixed(2)}</span></div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {order.shippingAddress && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
              <h2 className="text-sm font-semibold text-gray-900">Shipping Address</h2>
            </div>
            <div className="p-6 text-sm space-y-1">
              <p className="font-medium text-gray-900">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p className="text-gray-500">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p className="text-gray-500">{order.shippingAddress.addressLine2}</p>}
              <p className="text-gray-500">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p className="text-gray-500">{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p className="text-gray-400 mt-2">{order.shippingAddress.phone}</p>}
            </div>
          </div>
        )}
        {order.billingAddress && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
              <h2 className="text-sm font-semibold text-gray-900">Billing Address</h2>
            </div>
            <div className="p-6 text-sm space-y-1">
              <p className="font-medium text-gray-900">{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
              <p className="text-gray-500">{order.billingAddress.addressLine1}</p>
              {order.billingAddress.addressLine2 && <p className="text-gray-500">{order.billingAddress.addressLine2}</p>}
              <p className="text-gray-500">{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}</p>
              <p className="text-gray-500">{order.billingAddress.country}</p>
            </div>
          </div>
        )}
      </div>

      {/* Payment & Tracking */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Payment & Delivery</h2>
        </div>
        <div className="p-6 space-y-3 text-sm">
          {order.paymentMethod && (
            <div className="flex justify-between"><span className="text-gray-500">Payment Method</span><span className="font-medium">{order.paymentMethod}</span></div>
          )}
          {order.trackingNumber && (
            <div className="flex justify-between"><span className="text-gray-500">Tracking Number</span><span className="font-mono text-[#B8860B]">{order.trackingNumber}</span></div>
          )}
          <div className="flex justify-between"><span className="text-gray-500">Placed</span><span className="font-medium">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Last Updated</span><span className="font-medium">{new Date(order.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
          {order.notes && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</span>
              <p className="mt-1 text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Request Return — only for DELIVERED orders */}
      {order.status === 'DELIVERED' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Need to return something?</h2>
                <p className="text-xs text-gray-500 mt-0.5">You can request a return within 30 days of delivery</p>
              </div>
            </div>
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-5 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-xl hover:bg-[#9a7209] transition-colors shadow-sm"
            >
              Request Return
            </button>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReturnModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Request a Return</h2>
                <p className="text-xs text-gray-500 mt-0.5">Order #{order.orderNumber}</p>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1: Select Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">1. Select items to return</h3>
                <p className="text-xs text-gray-400 mb-3">Choose which items you'd like to return and adjust quantities</p>
                <div className="space-y-2">
                  {order.items.map((item) => {
                    const isSelected = !!returnItems[item.id];
                    return (
                      <div
                        key={item.id}
                          role="button"
                          tabIndex={0}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                            isSelected ? 'border-[#B8860B] bg-[#B8860B]/5' : 'border-gray-100 hover:border-gray-200'
                          }`}
                          onClick={() => toggleReturnItem(item.id, item.quantity)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleReturnItem(item.id, item.quantity); } }}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'border-[#B8860B] bg-[#B8860B]' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                        <img
                          src={item.imageUrl || '/placeholder.png'}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-50 border border-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                        </div>
                        {isSelected && item.quantity > 1 && (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="presentation">
                            <label htmlFor="qty" className="text-xs text-gray-500 mr-1">Qty:</label>
                            <select id="qty"
                              value={returnItems[item.id]}
                              onChange={e => updateReturnQty(item.id, Number(e.target.value))}
                              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30"
                            >
                              {Array.from({ length: item.quantity }, (_, i) => i + 1).map(q => (
                                <option key={q} value={q}>{q}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {isSelected && item.quantity === 1 && (
                          <span className="text-xs text-gray-400">Qty: 1</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Reason */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">2. Why are you returning?</h3>
                <p className="text-xs text-gray-400 mb-3">Select the reason for your return</p>
                <div className="grid grid-cols-1 gap-2">
                  {RETURN_REASONS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setReturnReason(r.value)}
                      className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                        returnReason === r.value
                          ? 'border-[#B8860B] bg-[#B8860B]/5 text-[#B8860B] font-medium'
                          : 'border-gray-100 text-gray-700 hover:border-gray-200'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Notes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">3. Additional notes <span className="text-gray-400 font-normal">(optional)</span></h3>
                <textarea
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  placeholder="Describe the issue or provide additional details..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between rounded-b-2xl">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReturn}
                disabled={submittingReturn || Object.keys(returnItems).length === 0 || !returnReason}
                className="px-6 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-xl hover:bg-[#9a7209] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReturn ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
