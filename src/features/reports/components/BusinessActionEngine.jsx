import { formatCurrency } from '@/shared/lib/format';
import {
  Sparkles,
  Archive,
  CreditCard,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export function BusinessActionEngine({ actions = {} }) {
  const stockoutAlerts = actions.stockoutAlerts || [];
  const attachOpportunity = actions.attachOpportunity || {};
  const deadCapital = actions.deadCapital || { totalTrappedCapital: 0, items: [] };
  const mdrSavings = actions.mdrSavings || { currentCost: 0, potentialSavings: 0 };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
        <div>
          <h2 className="text-base font-semibold text-text">
            Executive Business Improvement Engine
          </h2>
          <p className="text-xs text-muted">
            Actionable profit levers, inventory capital preservation, and fee reduction recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface border border-border text-muted">
            4 Actionable Levers Active
          </span>
        </div>
      </div>

      {/* 4 Action Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lever 1: Stockout Prevention Watchlist */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-4 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                <ShieldAlert size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text">
                  Stockout Risk Watchlist
                </h3>
                <span className="text-xs text-muted">Fast-movers at or below safety reorder level</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-red-500/30 bg-red-500/10 text-red-600">
              High Priority
            </span>
          </div>

          <p className="text-xs text-muted">
            The following SKUs are running critically low. Stockouts on these high-ticket items risk immediate lost revenue.
          </p>

          <div className="space-y-2.5">
            {stockoutAlerts.length > 0 ? (
              stockoutAlerts.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-border bg-bg/50 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-text truncate">{item.name}</div>
                    <div className="text-[10px] text-muted font-mono truncate">
                      SKU: {item.sku} • {item.currentStock} in stock (Reorder at {item.reorderLevel})
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-red-600">
                      {formatCurrency(item.revenueAtRisk)}
                    </div>
                    <div className="text-[10px] text-muted">Revenue at risk</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-lg border border-border bg-bg/30 text-center text-xs text-muted">
                All high-velocity inventory levels are healthy.
              </div>
            )}
          </div>
        </div>

        {/* Lever 2: High-Margin Accessory Attachment */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-4 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text">
                  High-Margin Cross-Sell Opportunity
                </h3>
                <span className="text-xs text-muted">Smartphones vs Accessories Attachment</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
              Profit Driver
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-bg/40 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Smartphones (High Ticket, Low Margin):</span>
              <span className="font-semibold text-text">~13.7% Margin</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Accessories (Cases, Chargers, Audio):</span>
              <span className="font-semibold text-emerald-600">~45.1% Margin</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-border">
              <span className="text-muted">Current Attachment Ratio:</span>
              <span className="font-mono text-text">
                {(attachOpportunity.currentAttachRatio || 4.8).toFixed(1)}% of volume
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-1.5 text-xs">
            <div className="font-medium text-text">
              Action: Bundle fast chargers & premium cases at billing counter
            </div>
            <p className="text-muted text-[11px] leading-relaxed">
              Attaching ₹1,500 in accessories to 25% of smartphone sales injects{' '}
              <strong className="text-emerald-600 font-semibold">
                +{formatCurrency(attachOpportunity.targetAttachGain || 28500)}
              </strong>{' '}
              in incremental gross profit each month with zero additional customer acquisition cost.
            </p>
          </div>
        </div>

        {/* Lever 3: Dead Working Capital Audit */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-4 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <Archive size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text">
                  Dead Working Capital Audit
                </h3>
                <span className="text-xs text-muted">Stock holding capital with zero recent sales</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-amber-500/30 bg-amber-500/10 text-amber-600">
              Capital Release
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-bg/40">
            <div>
              <span className="text-[10px] font-medium text-muted uppercase block">
                Total Trapped Capital
              </span>
              <div className="text-xl font-semibold text-text">
                {formatCurrency(deadCapital.totalTrappedCapital || 0)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-muted">
                {deadCapital.count || deadCapital.items?.length || 0} slow-moving SKUs
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {(deadCapital.items || []).slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg border border-border bg-bg/30 flex items-center justify-between text-xs"
              >
                <div className="truncate">
                  <div className="font-medium text-text truncate">{item.name}</div>
                  <div className="text-[10px] text-muted">{item.qty} units in warehouse</div>
                </div>
                <div className="font-mono text-text font-medium shrink-0">
                  {formatCurrency(item.trappedCapital)}
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-muted flex items-center gap-1.5 pt-1">
            <ArrowRight size={12} className="text-amber-500 shrink-0" />
            <span>Recommendation: Offer 7–10% festive clearance discounts to liberate cash back to bank account.</span>
          </div>
        </div>

        {/* Lever 4: Card POS Fee Optimization */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-4 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
                <CreditCard size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text">
                  Payment Gateway Fee Optimization
                </h3>
                <span className="text-xs text-muted">Shift Card Interchange to Zero-MDR UPI</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-purple-500/30 bg-purple-500/10 text-purple-600">
              Cost Saving
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-border bg-bg/40">
              <span className="text-[10px] text-muted uppercase block">Estimated Card MDR Cost</span>
              <div className="text-base font-semibold text-text mt-0.5">
                {formatCurrency(mdrSavings.currentCost || 0)}
              </div>
              <span className="text-[10px] text-muted">@ 1.8% POS swipe charge</span>
            </div>
            <div className="p-3 rounded-lg border border-border bg-bg/40">
              <span className="text-[10px] text-muted uppercase block">Potential Monthly Savings</span>
              <div className="text-base font-semibold text-emerald-600 mt-0.5">
                {formatCurrency(mdrSavings.potentialSavings || 0)}
              </div>
              <span className="text-[10px] text-muted">If 50% shifted to UPI QR</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-bg/30 text-xs text-muted space-y-1">
            <div className="font-medium text-text">Counter Staff Protocol:</div>
            <p className="text-[11px] leading-relaxed">
              UPI payments carry 0% MDR fee and settle instantly into your current account. Instruct billing staff to prominently present the dynamic QR display before offering card swipe POS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
