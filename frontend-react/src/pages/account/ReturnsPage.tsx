import { useEffect, useState } from 'react';
import { returnsApi, type ReturnDto } from '@/api/returns';
import { config } from '@/config';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  APPROVED: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  PICKED_UP: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  QC: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  CLOSED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Pending Review',
  APPROVED: 'Approved',
  PICKED_UP: 'Picked Up',
  QC: 'Quality Check',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const RETURN_PIPELINE = ['REQUESTED', 'APPROVED', 'PICKED_UP', 'QC', 'CLOSED'] as const;
const RETURN_PIPELINE_IDX: Record<string, number> = Object.fromEntries(RETURN_PIPELINE.map((s, i) => [s, i]));
const PIPELINE_STEP_META: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: 'Requested', color: '#d97706' },
  APPROVED: { label: 'Approved', color: '#2563eb' },
  PICKED_UP: { label: 'Picked Up', color: '#7c3aed' },
  QC: { label: 'QC', color: '#6d28d9' },
  CLOSED: { label: 'Closed', color: '#059669' },
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    returnsApi.getAll().then(setReturns).catch(() => toast.error('Failed to load returns')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this return request?')) return;
    try {
      await returnsApi.cancel(id);
      toast.success('Return cancelled');
      load();
    } catch {
      toast.error('Failed to cancel return');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 mt-3">Loading returns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns</h1>
          <p className="text-sm text-gray-500 mt-1">Track your return requests</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Refresh
        </button>
      </div>

      {returns.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">No returns</h2>
          <p className="text-sm text-gray-500">You haven't submitted any return requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <div
              key={ret.id}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === ret.id ? null : ret.id)}
                className="w-full p-5 text-left hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-gray-900">Return #{ret.returnNumber}</span>
                      {ret.order && <span className="text-xs text-gray-400 ml-2">Order #{ret.order.orderNumber}</span>}
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(ret.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[ret.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[ret.status] ?? ret.status}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === ret.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </button>

              {expandedId === ret.id && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                  {/* Return Progress Tracker */}
                  {ret.status !== 'REJECTED' && ret.status !== 'CANCELLED' && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Return Progress</h4>
                      <div className="flex items-center">
                        {RETURN_PIPELINE.map((step, i) => {
                          const currentIdx = RETURN_PIPELINE_IDX[ret.status] ?? -1;
                          const isPast = i < currentIdx;
                          const isActive = i === currentIdx;
                          const meta = PIPELINE_STEP_META[step];
                          return (
                            <div key={step} className="flex items-center" style={{ flex: i < RETURN_PIPELINE.length - 1 ? 1 : 'none' }}>
                              {(() => {
                                let bg: string;
                                if (isPast) bg = '#059669';
                                else if (isActive) bg = meta.color;
                                else bg = '#e5e7eb';
                                const fg = (isPast || isActive) ? '#fff' : '#9ca3af';
                                return (
                              <div
                                className="flex-shrink-0 flex items-center justify-center rounded-full transition-all"
                                style={{
                                  width: 24, height: 24, fontSize: 10, fontWeight: 700,
                                  background: bg,
                                  color: fg,
                                  boxShadow: isActive ? `0 0 0 3px ${meta.color}22` : 'none',
                                }}
                              >
                                {isPast ? '✓' : i + 1}
                              </div>
                                );
                              })()}
                              {i < RETURN_PIPELINE.length - 1 && (
                                <div
                                  className="flex-1 rounded-full mx-1"
                                  style={{ height: 2, background: isPast ? '#059669' : '#e5e7eb' }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1.5">
                        {RETURN_PIPELINE.map((step, i) => {
                          const currentIdx = RETURN_PIPELINE_IDX[ret.status] ?? -1;
                          const isPast = i < currentIdx;
                          const isActive = i === currentIdx;
                          const meta = PIPELINE_STEP_META[step];
                          return (
                            <span
                              key={step}
                              className="text-center"
                              style={{
                                fontSize: 8, width: `${100 / RETURN_PIPELINE.length}%`,
                                color: (() => {
                                  if (isPast) return '#059669';
                                  if (isActive) return meta.color;
                                  return '#9ca3af';
                                })(),
                                fontWeight: isActive ? 600 : 400,
                              }}
                            >
                              {meta.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {(ret.status === 'REJECTED' || ret.status === 'CANCELLED') && (
                    <div className={`rounded-xl p-4 flex items-center gap-3 ${ret.status === 'REJECTED' ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ret.status === 'REJECTED' ? 'bg-red-100' : 'bg-gray-200'}`}>
                        <svg className={`w-4 h-4 ${ret.status === 'REJECTED' ? 'text-red-500' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span className={`text-sm font-medium ${ret.status === 'REJECTED' ? 'text-red-700' : 'text-gray-600'}`}>
                        Return {ret.status === 'REJECTED' ? 'Rejected' : 'Cancelled'}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Reason</label>
                      <p className="text-sm text-gray-900">{ret.reason}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Refund Amount</label>
                      <p className="text-sm font-semibold text-gray-900">{config.currency} {Number(ret.refundAmount).toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Refund Method</label>
                      <p className="text-sm text-gray-900 capitalize">{ret.refundMethod?.replaceAll(/_/g, ' ') || '—'}</p>
                    </div>
                  </div>

                  {ret.customerNotes && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Your Notes</label>
                      <p className="text-sm text-gray-600">{ret.customerNotes}</p>
                    </div>
                  )}

                  {ret.items?.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Items</label>
                      <div className="space-y-2">
                        {ret.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                              <p className="text-xs font-semibold text-gray-700">{config.currency} {Number(item.subtotal).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ret.status === 'REQUESTED' && (
                    <button
                      onClick={() => handleCancel(ret.id)}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 active:scale-[0.97] active:bg-red-800 transition-all shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel Return
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
