import { formatCurrency } from '@/shared/lib/format';
import { Layers } from 'lucide-react';

export function CategoryMarginTable({ categories = [] }) {
  const totalRevenue = categories.reduce((acc, c) => acc + c.revenue, 0);
  const totalCogs = categories.reduce((acc, c) => acc + c.cogs, 0);
  const totalProfit = totalRevenue - totalCogs;
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const totalUnits = categories.reduce((acc, c) => acc + c.units, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
        <div>
          <h2 className="text-base font-semibold text-text flex items-center gap-2">
            <Layers size={17} className="text-muted" />
            Category Profitability & Margin Matrix
          </h2>
          <p className="text-xs text-muted">
            Separates high-volume cash flow drivers from high-margin profit engines.
          </p>
        </div>
        <div className="text-xs font-mono text-muted">
          {categories.length} Active Product Categories
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg/60 border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider">
              <tr className="h-11">
                <th className="px-4 py-0 align-middle">Product Category</th>
                <th className="px-4 py-0 align-middle text-center">Units Sold</th>
                <th className="px-4 py-0 align-middle text-right">Gross Revenue</th>
                <th className="px-4 py-0 align-middle text-right">Cost of Goods (COGS)</th>
                <th className="px-4 py-0 align-middle text-right">Gross Profit (₹)</th>
                <th className="px-4 py-0 align-middle text-center">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => {
                const margin = cat.marginPct || 0;
                let badgeClass = 'bg-amber-500/10 text-amber-600 border-amber-500/30';
                if (margin >= 30) {
                  badgeClass = 'bg-brand-sage-subtle text-brand-sage-text border-brand-sage-border';
                } else if (margin >= 18) {
                  badgeClass = 'bg-blue-500/10 text-blue-600 border-blue-500/30';
                }

                return (
                  <tr key={cat.slug} className="h-14 min-h-14 hover:bg-bg/40 transition-colors">
                    <td className="px-4 py-2.5 align-middle">
                      <div className="font-medium text-text leading-tight">{cat.name}</div>
                      <div className="text-[10px] text-muted font-mono leading-tight">{cat.slug}</div>
                    </td>
                    <td className="px-4 py-2.5 align-middle text-center font-mono text-text">
                      {cat.units}
                    </td>
                    <td className="px-4 py-2.5 align-middle text-right font-medium text-text">
                      <div className="leading-tight">{formatCurrency(cat.revenue)}</div>
                      <div className="text-[10px] text-muted font-mono leading-tight">
                        {(cat.revenueShare || (totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0)).toFixed(1)}% share
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-middle text-right font-mono text-muted">
                      {formatCurrency(cat.cogs)}
                    </td>
                    <td className="px-4 py-2.5 align-middle text-right font-medium text-text">
                      {formatCurrency(cat.profit)}
                    </td>
                    <td className="px-4 py-2.5 align-middle text-center">
                      <span className={`inline-flex items-center justify-center h-5 px-2 py-0 rounded text-[10px] font-semibold border ${badgeClass}`}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Total Row */}
            <tfoot className="bg-bg/60 border-t border-border font-semibold text-text">
              <tr className="h-14 min-h-14">
                <td className="px-4 py-2.5 align-middle uppercase text-[11px] tracking-wider">Consolidated Total</td>
                <td className="px-4 py-2.5 align-middle text-center font-mono">{totalUnits} units</td>
                <td className="px-4 py-2.5 align-middle text-right">{formatCurrency(totalRevenue)}</td>
                <td className="px-4 py-2.5 align-middle text-right font-mono text-muted">{formatCurrency(totalCogs)}</td>
                <td className="px-4 py-2.5 align-middle text-right text-text font-bold">{formatCurrency(totalProfit)}</td>
                <td className="px-4 py-2.5 align-middle text-center">
                  <span className="inline-flex items-center justify-center h-5 px-2 py-0 rounded text-[10px] font-semibold bg-brand-sage-subtle text-brand-sage-text border border-brand-sage-border">
                    {overallMargin.toFixed(1)}% avg
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
