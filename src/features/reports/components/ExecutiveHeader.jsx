import { Building2, Printer, Download } from 'lucide-react';

const DATE_RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 Days' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
];

const STORE_OPTIONS = [
  { id: 'all', label: 'All Stores & Branches' },
  { id: 'mobiles', label: 'Star Mobiles & Electronics' },
  { id: 'furniture-electronics', label: 'Star Furniture & Home Living' },
];

export function ExecutiveHeader({
  dateRange,
  setDateRange,
  storeCode,
  setStoreCode,
  onOpenEodModal,
  onExportGstr1,
}) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-border">
      {/* Title & Live Status */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
            EXECUTIVE INTELLIGENCE
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-sage-subtle border border-brand-sage-border text-brand-sage-text select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-sage animate-pulse shrink-0" />
            <span>Live Synced</span>
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
          Analytics & Reports
        </h1>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Consolidated financial telemetry, tax registers, till balancing, and inventory ROI.
        </p>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Store Selector */}
        <div className="relative">
          <div className="h-8 flex items-center gap-1.5 px-2.5 rounded-lg border border-border bg-surface text-xs font-medium text-text shadow-2xs">
            <Building2 size={13} className="text-muted shrink-0" />
            <select
              value={storeCode}
              onChange={(e) => setStoreCode(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-text focus:outline-none cursor-pointer pr-1"
            >
              {STORE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-surface text-text">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filters */}
        <div className="h-8 flex items-center bg-surface border border-border rounded-lg p-0.5 text-xs shadow-2xs">
          {DATE_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setDateRange(r.id)}
              className={`h-full px-3 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                dateRange === r.id
                  ? 'bg-brand-sage text-white font-semibold shadow-2xs'
                  : 'text-muted hover:text-text'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Action: Day-End Z-Report */}
        {onOpenEodModal && (
          <button
            type="button"
            onClick={onOpenEodModal}
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg border border-border bg-surface hover:bg-surface-subtle text-text text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0 select-none"
            title="Open printable Day-End EOD Z-Report for cashier handover"
          >
            <Printer size={13} className="text-muted" />
            <span>Z-Report</span>
          </button>
        )}

        {/* Action: GSTR-1 Export */}
        {onExportGstr1 && (
          <button
            type="button"
            onClick={onExportGstr1}
            className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg border border-brand-sage-border bg-brand-sage-subtle text-brand-sage-text hover:bg-brand-sage-subtle/80 text-xs font-semibold transition-all cursor-pointer shadow-2xs shrink-0 select-none"
            title="Export GSTR-1 Sales Register as CSV"
          >
            <Download size={13} className="text-brand-sage" />
            <span>GSTR-1 CSV</span>
          </button>
        )}
      </div>
    </div>
  );
}
