import { useEffect, useState } from 'react';
import { accountApi } from '@/api/account';
import { config } from '@/config';
import type { LoyaltyDto } from '@/types';

export default function LoyaltyPage() {
  const [loyalty, setLoyalty] = useState<LoyaltyDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountApi.getLoyalty().then(setLoyalty).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 mt-3">Loading loyalty...</p>
      </div>
    );
  }

  if (!loyalty) return <div className="py-12 text-center text-gray-500">Could not load loyalty data.</div>;

  const balance = Number(loyalty.balanceAed ?? 0);
  const totalEarned = Number(loyalty.totalEarnedAed ?? 0);
  const totalRedeemed = Number(loyalty.totalRedeemedAed ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loyalty Cash</h1>
        <p className="text-sm text-gray-500 mt-1">Your rewards and cashback balance</p>
      </div>

      {/* Balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#B8860B] rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#B8860B] rounded-full translate-y-1/3 -translate-x-1/3" />
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Available Balance</p>
            <p className="text-4xl font-bold mt-2 bg-gradient-to-r from-[#D4A843] to-[#F0D78C] bg-clip-text text-transparent">
              {config.currency} {balance.toFixed(2)}
            </p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-[#D4A843] to-[#B8860B] rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h5.25A2.25 2.25 0 0121 6v6zm-3 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-12.75-3H21M3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Earned</p>
              <p className="text-lg font-bold text-gray-900">{config.currency} {totalEarned.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Redeemed</p>
              <p className="text-lg font-bold text-gray-900">{config.currency} {totalRedeemed.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      {(loyalty.transactions ?? []).length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Transaction History</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {loyalty.transactions.map((t) => {
              let bgClass: string;
              if (t.type === 'EARNED') bgClass = 'bg-emerald-50';
              else if (t.type === 'REDEEMED') bgClass = 'bg-blue-50';
              else bgClass = 'bg-amber-50';
              let textClass: string;
              if (t.type === 'EARNED') textClass = 'text-emerald-600';
              else if (t.type === 'REDEEMED') textClass = 'text-blue-600';
              else textClass = 'text-amber-600';
              return (
              <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgClass}`}>
                    {t.type === 'EARNED' ? (
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.description || t.type}</p>
                    <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${textClass}`}>
                  {Number(t.amountAed) >= 0 ? '+' : ''}{config.currency} {Number(t.amountAed).toFixed(2)}
                </span>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
