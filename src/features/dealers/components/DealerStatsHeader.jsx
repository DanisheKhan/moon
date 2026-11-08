import { useMemo } from 'react';
import { Card, Badge } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/format';
import {
  TrendingUp,
  Receipt,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export function DealerStatsHeader({ analytics, isLoading }) {
  const aging = analytics?.aging || {};

  const totalOverdue = analytics?.overdueAmount || 0;
  const overdueCount = analytics?.overdueCount || 0;
  const totalPayable = analytics?.totalPayable || 0;
  const gstPayable = analytics?.gstPayable || 0;
  const kacchaPayable = analytics?.kacchaPayable || 0;
  const avgTurnaround = analytics?.avgDaysToClear;

  // Aging proportions for visual bar
  const agingSegments = useMemo(() => {
    if (totalPayable <= 0) return [];
    return [
      {
        label: 'Current (Within Terms)',
        amount: aging.current?.amount || 0,
        count: aging.current?.count || 0,
        color: 'bg-emerald-500',
        textColor: 'text-emerald-700',
      },
      {
        label: '1–15 Days Overdue',
        amount: aging.bucket0_15?.amount || 0,
        count: aging.bucket0_15?.count || 0,
        color: 'bg-amber-400',
        textColor: 'text-amber-700',
      },
      {
        label: '16–30 Days Overdue',
        amount: aging.bucket16_30?.amount || 0,
        count: aging.bucket16_30?.count || 0,
        color: 'bg-amber-600',
        textColor: 'text-amber-800',
      },
      {
        label: '31–60 Days Overdue',
        amount: aging.bucket31_60?.amount || 0,
        count: aging.bucket31_60?.count || 0,
        color: 'bg-rose-500',
        textColor: 'text-rose-700',
      },
      {
        label: '60+ Days Critical',
        amount: aging.bucket60_plus?.amount || 0,
        count: aging.bucket60_plus?.count || 0,
        color: 'bg-red-700',
        textColor: 'text-red-900',
      },
    ].filter((seg) => seg.amount > 0);
  }, [totalPayable, aging]);

  return (
    <div className="space-y-4">
      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Net Payables */}
        <Card className="p-4 bg-surface border border-border rounded-xl shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-muted">
              Total Accounts Payable
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-subtle flex items-center justify-center text-text">
              <Receipt size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold tracking-tight text-text">
              {isLoading ? '...' : formatCurrency(totalPayable)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted">
              <span>All active dealer balances</span>
            </div>
          </div>
        </Card>

        {/* 2. GST Invoices Outstanding */}
        <Card className="p-4 bg-surface border border-brand-sage-border/60 rounded-xl shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-brand-sage-text">
              GST Invoices (Pakka)
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-sage-subtle flex items-center justify-center text-brand-sage">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold tracking-tight text-brand-sage-text">
              {isLoading ? '...' : formatCurrency(gstPayable)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-brand-sage-text/80 font-medium">
              <span>Official Tax Invoices with ITC</span>
            </div>
          </div>
        </Card>

        {/* 3. Kaccha Bills Outstanding */}
        <Card className="p-4 bg-surface border border-amber-200/70 rounded-xl shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-900">
              Kaccha (Non-GST / Estimates)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Layers size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold tracking-tight text-amber-950">
              {isLoading ? '...' : formatCurrency(kacchaPayable)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-800 font-medium">
              <span>Insulated cash & estimate ledger</span>
            </div>
          </div>
        </Card>

        {/* 4. Overdue Balance & Speed */}
        <Card
          className={`p-4 bg-surface border rounded-xl shadow-2xs hover:shadow-xs transition-shadow ${
            totalOverdue > 0 ? 'border-brand-crimson-border bg-brand-crimson-subtle/30' : 'border-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold tracking-wider uppercase ${
                totalOverdue > 0 ? 'text-brand-crimson-text' : 'text-muted'
              }`}
            >
              Overdue Aging
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                totalOverdue > 0 ? 'bg-brand-crimson-subtle text-brand-crimson' : 'bg-surface-subtle text-muted'
              }`}
            >
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <div
              className={`text-2xl font-bold tracking-tight ${
                totalOverdue > 0 ? 'text-brand-crimson-text' : 'text-text'
              }`}
            >
              {isLoading ? '...' : formatCurrency(totalOverdue)}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-muted">
              <span>{overdueCount} bills past credit terms</span>
              {avgTurnaround != null && (
                <span className="font-semibold text-text flex items-center gap-1">
                  <Clock size={11} /> {avgTurnaround}d avg clear
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Visual Aging Distribution Bar (when payables exist) */}
      {totalPayable > 0 && agingSegments.length > 0 && (
        <Card className="p-4 bg-surface border border-border rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text uppercase tracking-wide">
                Payables Aging Breakdown (Timeline)
              </span>
              <span className="text-[11px] text-muted">
                How credit balances are distributed by maturity
              </span>
            </div>
            <div className="text-xs font-semibold text-text">
              Total Outstanding: <span className="text-brand-sage">{formatCurrency(totalPayable)}</span>
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full h-3 rounded-full bg-surface-subtle overflow-hidden flex border border-border">
            {agingSegments.map((seg, idx) => {
              const widthPct = Math.max(3, (seg.amount / totalPayable) * 100);
              return (
                <div
                  key={idx}
                  title={`${seg.label}: ${formatCurrency(seg.amount)} (${seg.count} bills)`}
                  className={`${seg.color} h-full transition-all`}
                  style={{ width: `${widthPct}%` }}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-2 border-t border-border/60 text-xs">
            {agingSegments.map((seg, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
                <span className="text-muted">{seg.label}:</span>
                <span className="font-bold text-text">{formatCurrency(seg.amount)}</span>
                <span className="text-[11px] text-muted font-mono">({seg.count})</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
