import { formatCurrency } from '@/shared/lib/format';
import { Clock, Users, ArrowUpRight } from 'lucide-react';

export function OperationalHourlyHeatmap({ hourlySales = [] }) {
  const maxRevenue = Math.max(...hourlySales.map((h) => h.revenue), 1);
  const totalHourlyBills = hourlySales.reduce((acc, h) => acc + h.invoices, 0);

  // Find peak hour
  const peakHour = [...hourlySales].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
        <div>
          <h2 className="text-base font-semibold text-text flex items-center gap-2">
            <Clock size={17} className="text-muted" />
            Operational Sales & Footfall Velocity (10:00 AM – 10:00 PM)
          </h2>
          <p className="text-xs text-muted">
            Hour-by-hour transaction density. Use peak windows to optimize checkout counter coverage.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted">
            Total Billed: <strong className="text-text">{totalHourlyBills} invoices</strong>
          </span>
          {peakHour && (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium border border-blue-500/30 bg-blue-500/10 text-blue-600">
              Peak: {peakHour.label} ({formatCurrency(peakHour.revenue)})
            </span>
          )}
        </div>
      </div>

      {/* Hourly Bar Chart Container */}
      <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-4 min-w-0">
        <div className="flex items-center justify-between text-xs text-muted pb-2 border-b border-border">
          <span>Sales Volume Density</span>
          <span>Hours of Store Operation</span>
        </div>

        {/* 12-Hour Vertical Bars */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-6 pb-2 items-end min-h-48">
          {hourlySales.map((item) => {
            const heightPct = Math.max(12, Math.round((item.revenue / maxRevenue) * 100));
            const isPeak = peakHour && item.hour === peakHour.hour && item.revenue > 0;

            return (
              <div key={item.hour} className="flex flex-col items-center gap-2 group min-w-0">
                {/* Popover/Value on top */}
                <div className="text-[10px] font-mono text-muted group-hover:text-text transition-colors text-center truncate w-full">
                  {item.revenue > 0 ? formatCurrency(item.revenue) : '—'}
                </div>

                {/* The Bar */}
                <div className="w-full max-w-8 h-36 bg-bg/80 rounded-t-md relative flex items-end overflow-hidden border border-border">
                  <div
                    className={`w-full rounded-t transition-all ${
                      isPeak
                        ? 'bg-blue-600'
                        : item.revenue > 0
                        ? 'bg-text/75 hover:bg-text'
                        : 'bg-muted/20'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>

                {/* Hour Label & Bills */}
                <div className="text-center">
                  <div className={`text-[11px] font-medium ${isPeak ? 'text-blue-600 font-semibold' : 'text-text'}`}>
                    {item.label}
                  </div>
                  <div className="text-[9px] text-muted font-mono">
                    {item.invoices} {item.invoices === 1 ? 'bill' : 'bills'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Operational Staffing Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border text-xs">
          <div className="p-3 rounded-lg border border-border bg-bg/40 space-y-1">
            <div className="font-medium text-text flex items-center gap-1.5">
              <Users size={14} className="text-blue-600 shrink-0" />
              <span>Cashier Desk Optimization</span>
            </div>
            <p className="text-muted text-[11px] leading-relaxed">
              Peak transaction rush occurs between <strong>12:00 PM – 2:00 PM</strong> and <strong>6:30 PM – 8:30 PM</strong>. Ensure both POS billing counters and UPI QR displays are fully staffed to prevent customer walkouts.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border bg-bg/40 space-y-1">
            <div className="font-medium text-text flex items-center gap-1.5">
              <ArrowUpRight size={14} className="text-emerald-600 shrink-0" />
              <span>Restocking & Break Windows</span>
            </div>
            <p className="text-muted text-[11px] leading-relaxed">
              Lowest transaction density is between <strong>2:30 PM – 4:30 PM</strong>. Ideal window for inventory unboxing, display shelf replenishment, and staff meal breaks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
