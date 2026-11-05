import { useState } from 'react';
import { formatCurrency } from '@/shared/lib/format';
import {
  Trophy,
  AlertTriangle,
  Sparkles,
  PackageCheck,
} from 'lucide-react';
import { CategoryMarginTable } from './CategoryMarginTable';

export function MerchandiseRankings({ merchandise = {}, categories = [] }) {
  const [activeRankView, setActiveRankView] = useState('revenue');
  const topRevenue = merchandise.topRevenue || [];
  const topProfit = merchandise.topProfit || [];
  const deadCapital = merchandise.deadCapital || { totalTrappedCapital: 0, count: 0, items: [] };

  const activeProducts = activeRankView === 'revenue' ? topRevenue : topProfit;

  return (
    <div className="space-y-6">
      {/* 2-Column Split: Hero Champions vs Dead Capital Watchdog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Hero Products (Top Movers) */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-4 min-w-0 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg border border-brand-sage-border bg-brand-sage-subtle flex items-center justify-center text-brand-sage shrink-0">
                  <Trophy size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text">
                    Hero Products Matrix (Top 5 Performers)
                  </h3>
                  <span className="text-xs text-muted">The 20% of catalog driving 80% of returns</span>
                </div>
              </div>

              {/* View Toggle */}
              <div className="inline-flex rounded-lg border border-border bg-bg p-0.5 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveRankView('revenue')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    activeRankView === 'revenue'
                      ? 'bg-brand-sage text-white shadow-2xs'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  By Revenue (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRankView('profit')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    activeRankView === 'profit'
                      ? 'bg-brand-sage text-white shadow-2xs'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  By Profit (₹)
                </button>
              </div>
            </div>

            {/* Product List */}
            <div className="space-y-2.5">
              {activeProducts.length > 0 ? (
                activeProducts.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3.5 rounded-xl border border-border bg-bg/40 flex items-center justify-between gap-3 text-xs hover:border-brand-sage/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg border border-border bg-surface flex items-center justify-center font-bold text-xs text-text font-mono shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-text truncate">{p.name}</div>
                        <div className="text-[10px] text-muted font-mono truncate">
                          {p.category} • SKU: {p.sku} • {p.units} units sold
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-text font-mono text-xs sm:text-sm">
                        {formatCurrency(activeRankView === 'revenue' ? p.revenue : p.profit)}
                      </div>
                      <div className="text-[10px] text-brand-sage-text font-semibold font-mono">
                        {p.marginPct.toFixed(1)}% margin
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg border border-border bg-bg/30 text-center text-xs text-muted">
                  No products billed in the selected period.
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-brand-sage-subtle/30 text-[11px] text-brand-sage-text flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <PackageCheck size={14} className="text-brand-sage" />
              Keep safety stock high on these key volume drivers.
            </span>
          </div>
        </div>

        {/* Right: Dead Working Capital Watchlist */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-4 min-w-0 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text">
                    Dead Working Capital Watchlist
                  </h3>
                  <span className="text-xs text-muted">Stock with positive inventory but 0 sales</span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/30 bg-red-500/10 text-red-600">
                {formatCurrency(deadCapital.totalTrappedCapital)} Trapped
              </span>
            </div>

            <p className="text-xs text-muted">
              Working capital locked in stagnant inventory reduces cash flow needed for high-demand seasonal stock.
            </p>

            {/* Dead stock list */}
            <div className="space-y-2.5">
              {deadCapital.items && deadCapital.items.length > 0 ? (
                deadCapital.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-border bg-bg/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-text truncate">{item.name}</div>
                      <div className="text-[10px] text-muted font-mono truncate">
                        SKU: {item.sku} • {item.qty} units on hand (Unit Cost: {formatCurrency(item.cost)})
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-red-600 font-mono text-xs sm:text-sm">
                        {formatCurrency(item.trappedCapital)}
                      </div>
                      <div className="text-[10px] text-muted">Capital locked</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg border border-border bg-bg/30 text-center text-xs text-muted">
                  All active inventory has recorded sales velocity.
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-bg/50 text-[11px] text-muted flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-text">
              <Sparkles size={14} className="text-brand-gold" />
              Recommended: Bundle with fast-movers or launch 0% EMI financing.
            </span>
          </div>
        </div>
      </div>

      {/* Category Margins Table */}
      <CategoryMarginTable categories={categories} />
    </div>
  );
}
