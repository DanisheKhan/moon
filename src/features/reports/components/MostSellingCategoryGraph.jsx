import { useState } from 'react';
import { formatCurrency } from '@/shared/lib/format';
import {
  Layers,
  TrendingUp,
  CircleDollarSign,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  PackageCheck,
  Percent,
} from 'lucide-react';

const CATEGORY_COLOR_SCHEMES = [
  { bar: 'bg-brand-sage', text: 'text-brand-sage', subtle: 'bg-brand-sage-subtle', border: 'border-brand-sage-border' },
  { bar: 'bg-brand-blue', text: 'text-brand-blue-text', subtle: 'bg-brand-blue-subtle', border: 'border-brand-blue-border' },
  { bar: 'bg-brand-gold', text: 'text-brand-gold-text', subtle: 'bg-brand-gold-subtle', border: 'border-brand-gold-border' },
  { bar: 'bg-purple-600', text: 'text-purple-600', subtle: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { bar: 'bg-emerald-600', text: 'text-emerald-700', subtle: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { bar: 'bg-amber-600', text: 'text-amber-700', subtle: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { bar: 'bg-sky-600', text: 'text-sky-700', subtle: 'bg-sky-500/10', border: 'border-sky-500/30' },
];

export function MostSellingCategoryGraph({ categories = [], totalSales = 0 }) {
  const [activeSort, setActiveSort] = useState('revenue'); // 'revenue' | 'profit' | 'units'

  if (!categories || categories.length === 0) {
    return (
      <div className="p-8 rounded-xl border border-border bg-surface text-center space-y-2">
        <Layers size={24} className="mx-auto text-muted" />
        <h4 className="text-sm font-bold text-text">No Category Data Recorded</h4>
        <p className="text-xs text-muted max-w-sm mx-auto">
          No product sales have been logged for the selected timeframe. Switch filters to inspect historical categories.
        </p>
      </div>
    );
  }

  // Sorted items
  const sortedCategories = [...categories].sort((a, b) => {
    if (activeSort === 'revenue') return b.revenue - a.revenue;
    if (activeSort === 'profit') return b.profit - a.profit;
    if (activeSort === 'units') return (b.units || 0) - (a.units || 0);
    return 0;
  });

  const maxRevenue = Math.max(...categories.map((c) => c.revenue), 1);
  const topCategory = categories[0] || {};
  const highestMarginCat = [...categories].sort((a, b) => b.marginPct - a.marginPct)[0] || {};
  const totalVolume = categories.reduce((acc, c) => acc + (c.units || 0), 0);
  const totalCategoryRevenue = categories.reduce((acc, c) => acc + c.revenue, 0);

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-6 min-w-0">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border border-brand-sage-border bg-brand-sage-subtle flex items-center justify-center text-brand-sage shrink-0">
              <BarChart3 size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-text flex items-center gap-2">
                Most Selling Category Revenue Graph
                <span className="text-[11px] font-medium font-mono px-2 py-0.5 rounded-full border border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text">
                  {categories.length} Departments
                </span>
              </h3>
              <p className="text-xs text-muted">
                Visual ranking of store departments by gross revenue, unit volume, and margin realization.
              </p>
            </div>
          </div>
        </div>

        {/* Sort Pill Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted hidden sm:inline">Rank by:</span>
          <div className="inline-flex rounded-lg border border-border bg-bg p-0.5 text-xs select-none">
            <button
              type="button"
              onClick={() => setActiveSort('revenue')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                activeSort === 'revenue'
                  ? 'bg-accent text-accent-fg shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              Revenue (₹)
            </button>
            <button
              type="button"
              onClick={() => setActiveSort('profit')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                activeSort === 'profit'
                  ? 'bg-accent text-accent-fg shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              Gross Profit
            </button>
            <button
              type="button"
              onClick={() => setActiveSort('units')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                activeSort === 'units'
                  ? 'bg-accent text-accent-fg shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              Units Sold
            </button>
          </div>
        </div>
      </div>

      {/* 3 Executive Micro-Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
        <div className="p-3.5 rounded-xl border border-border bg-bg/50 space-y-1">
          <div className="flex items-center justify-between text-muted text-[10px] uppercase font-bold">
            <span>#1 Revenue Leader</span>
            <TrendingUp size={13} className="text-brand-sage" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-brand-sage truncate">
            {topCategory.name || 'N/A'}
          </div>
          <span className="text-[11px] text-muted block truncate">
            {formatCurrency(topCategory.revenue || 0)} ({topCategory.revenueShare?.toFixed(1) || '0.0'}% of sales)
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-bg/50 space-y-1">
          <div className="flex items-center justify-between text-muted text-[10px] uppercase font-bold">
            <span>Highest Margin Yield</span>
            <Percent size={13} className="text-brand-gold" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-text truncate">
            {highestMarginCat.name || 'N/A'}
          </div>
          <span className="text-[11px] text-brand-sage-text font-semibold block truncate">
            {highestMarginCat.marginPct?.toFixed(1) || '0.0'}% gross margin realized
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-bg/50 space-y-1">
          <div className="flex items-center justify-between text-muted text-[10px] uppercase font-bold">
            <span>Categorized Units Sold</span>
            <PackageCheck size={13} className="text-purple-600" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-text">
            {totalVolume} Units
          </div>
          <span className="text-[11px] text-muted block">
            Across {categories.length} active merchandising lines
          </span>
        </div>
      </div>

      {/* Main Visual Category Revenue Graph Bars */}
      <div className="space-y-4 pt-1">
        {sortedCategories.map((cat, idx) => {
          const color = CATEGORY_COLOR_SCHEMES[idx % CATEGORY_COLOR_SCHEMES.length];
          const pctOfMax = Math.round((cat.revenue / maxRevenue) * 100);
          const share = totalCategoryRevenue > 0
            ? ((cat.revenue / totalCategoryRevenue) * 100).toFixed(1)
            : cat.revenueShare?.toFixed(1) || '0.0';

          return (
            <div
              key={cat.slug || cat.name || idx}
              className="p-3.5 sm:p-4 rounded-xl border border-border bg-bg/30 hover:border-border-strong hover:bg-bg/60 transition-all space-y-2.5"
            >
              {/* Row 1: Category Name, Share & Revenue */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-md border border-border bg-surface flex items-center justify-center font-bold text-[11px] font-mono text-text shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-text text-sm block truncate">{cat.name}</span>
                    <span className="text-[11px] text-muted">
                      {cat.units || 0} {cat.units === 1 ? 'unit' : 'units'} sold • {share}% revenue share
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto text-right shrink-0">
                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-text">
                      {formatCurrency(cat.revenue)}
                    </div>
                    <div className="text-[11px] text-muted flex items-center justify-end gap-1 font-mono">
                      <span>Profit: {formatCurrency(cat.profit)}</span>
                      <span>•</span>
                      <span className="font-semibold text-brand-sage-text">{cat.marginPct?.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Proportional Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-3 rounded-full bg-border/60 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                    style={{ width: `${Math.min(100, Math.max(4, pctOfMax))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted font-mono">
                  <span>Relative scale: {pctOfMax}% of peak category</span>
                  <span className="flex items-center gap-1 text-text font-medium">
                    COGS: {formatCurrency(cat.cogs || 0)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Takeaway Footnote */}
      <div className="p-3.5 rounded-lg border border-border bg-surface text-xs text-muted flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-text font-medium">
          <Sparkles size={14} className="text-brand-sage shrink-0" />
          <span>Category Strategy: High revenue categories provide customer footfall; high margin categories generate net profit.</span>
        </span>
        <span className="font-mono text-[11px] text-muted shrink-0 hidden md:inline">
          Aggregated Live
        </span>
      </div>
    </div>
  );
}
