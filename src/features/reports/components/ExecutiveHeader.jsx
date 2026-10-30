import { Building2 } from 'lucide-react';

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
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1">
          EXECUTIVE INTELLIGENCE
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
          Analytics & Reports
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
          Real-time financial telemetry, GST sales registers, payment methods, and business profit levers.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Store Branch Selector */}
        <div className="relative">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text">
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
        <div className="flex items-center bg-surface border border-border rounded-lg p-1 text-xs">
          {DATE_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setDateRange(r.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                dateRange === r.id
                  ? 'bg-text text-bg'
                  : 'text-muted hover:text-text'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Live Automatic Synchronization Indicator */}
        <div
          title="Telemetry auto-synchronized with live billing in real time"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border bg-surface text-muted select-none shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-brand-sage animate-pulse shrink-0" />
          <span className="text-[11px] font-medium text-text hidden sm:inline">Live Synced</span>
        </div>
      </div>
    </div>
  );
}
