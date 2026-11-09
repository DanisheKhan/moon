import { useState, useMemo } from 'react';
import { formatCurrency } from '@/shared/lib/format';
import {
  Trophy,
  Search,
  Sparkles,
  ArrowUpDown,
  Tag,
  Package,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Flame,
} from 'lucide-react';

export function StarProductsSalesMatrix({ starProducts = [], totalSales = 0 }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [sortBy, setSortBy] = useState('revenue'); // 'revenue' | 'profit' | 'units' | 'margin'

  // Filter & Sort
  const processedProducts = useMemo(() => {
    let list = [...starProducts];

    // Branch filter
    if (selectedBranch !== 'all') {
      list = list.filter((p) => p.storeCode === selectedBranch);
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'revenue') return b.revenue - a.revenue;
      if (sortBy === 'profit') return b.profit - a.profit;
      if (sortBy === 'units') return (b.unitsSold || 0) - (a.unitsSold || 0);
      if (sortBy === 'margin') return b.marginPct - a.marginPct;
      return 0;
    });

    return list;
  }, [starProducts, selectedBranch, searchTerm, sortBy]);

  const totalMatrixRevenue = processedProducts.reduce((acc, p) => acc + p.revenue, 0);
  const totalMatrixProfit = processedProducts.reduce((acc, p) => acc + p.profit, 0);
  const totalMatrixUnits = processedProducts.reduce((acc, p) => acc + (p.unitsSold || 0), 0);

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-5 min-w-0">
      {/* Header & Description */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border border-brand-sage-border bg-brand-sage-subtle flex items-center justify-center text-brand-sage shrink-0">
              <Trophy size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-text flex items-center gap-2">
                Star Products Sales Matrix
                <span className="text-[11px] font-medium font-mono px-2 py-0.5 rounded-full border border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text">
                  {processedProducts.length} Items Listed
                </span>
              </h3>
              <p className="text-xs text-muted">
                Detailed product-level telemetry ranking sales velocity, units sold, unit COGS, profit yield, and stock levels.
              </p>
            </div>
          </div>
        </div>

        {/* Aggregate Pill */}
        <div className="flex items-center gap-3 text-xs self-start lg:self-auto">
          <div className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-border bg-bg/50 flex items-center gap-3 font-mono">
            <div>
              <span className="text-[10px] text-muted block uppercase">Volume</span>
              <strong className="text-text">{totalMatrixUnits} units</strong>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <span className="text-[10px] text-muted block uppercase">Matrix Revenue</span>
              <strong className="text-brand-sage">{formatCurrency(totalMatrixRevenue)}</strong>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <span className="text-[10px] text-muted block uppercase">Matrix Profit</span>
              <strong className="text-brand-gold-text">{formatCurrency(totalMatrixProfit)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by product, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-bg text-text text-xs placeholder:text-muted focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Branch Filter & Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Branch Selector */}
          <div className="inline-flex rounded-lg border border-border bg-bg p-0.5 select-none">
            <button
              type="button"
              onClick={() => setSelectedBranch('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                selectedBranch === 'all'
                  ? 'bg-accent text-accent-fg shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              All Branches
            </button>
            <button
              type="button"
              onClick={() => setSelectedBranch('mobiles')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                selectedBranch === 'mobiles'
                  ? 'bg-accent text-accent-fg shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              Mobiles
            </button>
            <button
              type="button"
              onClick={() => setSelectedBranch('furniture-electronics')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                selectedBranch === 'furniture-electronics'
                  ? 'bg-accent text-accent-fg shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              Furniture & Living
            </button>
          </div>

          {/* Sort By Toggle */}
          <div className="inline-flex rounded-lg border border-border bg-bg p-0.5 select-none">
            <button
              type="button"
              onClick={() => setSortBy('revenue')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                sortBy === 'revenue'
                  ? 'bg-brand-sage text-white shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              By Revenue
            </button>
            <button
              type="button"
              onClick={() => setSortBy('profit')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                sortBy === 'profit'
                  ? 'bg-brand-sage text-white shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              By Profit
            </button>
            <button
              type="button"
              onClick={() => setSortBy('units')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                sortBy === 'units'
                  ? 'bg-brand-sage text-white shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              By Units
            </button>
            <button
              type="button"
              onClick={() => setSortBy('margin')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                sortBy === 'margin'
                  ? 'bg-brand-sage text-white shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              By Margin %
            </button>
          </div>
        </div>
      </div>

      {/* The Star Products Matrix Table */}
      {processedProducts.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-border rounded-xl space-y-2">
          <Package size={28} className="mx-auto text-muted" />
          <h4 className="text-sm font-bold text-text">No Matching Products Found</h4>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Try adjusting your search query or branch filter to view Star Products.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface no-scrollbar">
          <table className="w-full text-left text-xs divide-y divide-border">
            <thead className="bg-bg/60 text-[10px] uppercase font-bold text-muted tracking-wider select-none">
              <tr>
                <th className="py-3 px-3.5"># Rank & Product</th>
                <th className="py-3 px-3">Performance Tier</th>
                <th className="py-3 px-3 text-center">Units Sold</th>
                <th className="py-3 px-3 text-right">Gross Revenue</th>
                <th className="py-3 px-3 text-right">Wholesale COGS</th>
                <th className="py-3 px-3 text-right">Gross Profit</th>
                <th className="py-3 px-3 text-center">Margin %</th>
                <th className="py-3 px-3.5 text-right">Stock Runway</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processedProducts.map((p, idx) => {
                const isHero = idx < 3;
                return (
                  <tr
                    key={p.id || p.sku || idx}
                    className="hover:bg-bg/40 transition-colors group"
                  >
                    {/* Rank & Product */}
                    <td className="py-3.5 px-3.5 max-w-xs">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-md border flex items-center justify-center font-bold text-[11px] font-mono shrink-0 ${
                            isHero
                              ? 'border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text'
                              : 'border-border bg-bg text-muted'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-text text-xs group-hover:text-brand-sage transition-colors truncate">
                            {p.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted font-mono truncate">
                            <span>SKU: {p.sku}</span>
                            <span>•</span>
                            <span>{p.category}</span>
                            <span>•</span>
                            <span className="text-text font-medium">{p.storeName || p.storeCode}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Performance Tier */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {p.marginPct >= 35 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text">
                          <Sparkles size={11} />
                          High Margin
                        </span>
                      ) : p.revenue >= 50000 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border border-brand-gold-border bg-brand-gold-subtle text-brand-gold-text">
                          <Flame size={11} />
                          Star Hero
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border border-border bg-bg text-muted">
                          <Tag size={11} />
                          Volume Driver
                        </span>
                      )}
                    </td>

                    {/* Units Sold */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-md font-bold font-mono text-xs bg-bg border border-border text-text">
                        {p.unitsSold || 0} {p.unitsSold === 1 ? 'unit' : 'units'}
                      </span>
                    </td>

                    {/* Gross Revenue */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="font-bold font-mono text-text text-xs sm:text-sm">
                        {formatCurrency(p.revenue)}
                      </div>
                      {p.revenueShare > 0 && (
                        <span className="text-[10px] text-muted font-mono">
                          {p.revenueShare}% of sales
                        </span>
                      )}
                    </td>

                    {/* Wholesale COGS */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono text-xs text-muted">
                      {formatCurrency(p.cogs || 0)}
                    </td>

                    {/* Gross Profit */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="font-bold font-mono text-brand-sage-text text-xs sm:text-sm">
                        {formatCurrency(p.profit)}
                      </div>
                    </td>

                    {/* Margin % */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono border border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text">
                        {p.marginPct?.toFixed(1)}%
                      </span>
                    </td>

                    {/* On-Hand Stock Status */}
                    <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.stockStatus === 'low_stock' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/30 bg-amber-500/10 text-amber-700">
                            <AlertTriangle size={11} />
                            {p.currentStock} left (Low)
                          </span>
                        ) : p.stockStatus === 'out_of_stock' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/30 bg-red-500/10 text-red-600">
                            Out of stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border border-border bg-bg text-text font-mono">
                            <CheckCircle2 size={11} className="text-brand-sage" />
                            {p.currentStock} in stock
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
