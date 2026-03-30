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

  if (loading) return <div className="py-12 text-center text-gray-400">Loading loyalty...</div>;
  if (!loyalty) return <div className="py-12 text-center text-gray-500">Could not load loyalty data.</div>;

  const balance = Number(loyalty.balanceAed ?? 0);
  const totalEarned = Number(loyalty.totalEarnedAed ?? 0);
  const totalRedeemed = Number(loyalty.totalRedeemedAed ?? 0);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Loyalty Cash</h1>

      {/* Balance card */}
      <div className="rounded-xl bg-gradient-to-br from-[#D4A843] to-[#B8860B] p-8 text-white mb-6">
        <p className="text-sm opacity-90">Available Balance</p>
        <p className="text-4xl font-bold mt-1">{config.currency} {balance.toFixed(2)}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-200 rounded-lg p-5 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </div>
          <p className="text-xs text-gray-500">Total Earned</p>
          <p className="text-lg font-bold">{config.currency} {totalEarned.toFixed(2)}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-5 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          </div>
          <p className="text-xs text-gray-500">Total Redeemed</p>
          <p className="text-lg font-bold">{config.currency} {totalRedeemed.toFixed(2)}</p>
        </div>
      </div>

      {/* History */}
      {(loyalty.transactions ?? []).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">History</h2>
          <div className="space-y-3">
            {loyalty.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium">{t.description || t.type}</p>
                  <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold ${t.type === 'EARNED' ? 'text-green-600' : t.type === 'REDEEMED' ? 'text-blue-600' : 'text-amber-600'}`}>
                  {Number(t.amountAed) >= 0 ? '+' : ''}{config.currency} {Number(t.amountAed).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
