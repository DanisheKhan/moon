import { Download, RefreshCw, Printer, Building2 } from 'lucide-react';

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
  onRefresh,
  isFetching,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
      <div>
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted block mb-1">
          EXECUTIVE INTELLIGENCE
        </span>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-text">
          Analytics & Reports
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
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

        {/* Refresh Live Data Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          title="Refresh live metrics from database"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border bg-surface text-text hover:bg-bg cursor-pointer transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin text-accent' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Print GSTR-1 / Statement */}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border bg-surface text-text hover:bg-bg cursor-pointer transition-colors"
        >
          <Printer size={13} />
          <span className="hidden sm:inline">Print GSTR-1</span>
        </button>

        {/* Export Statement */}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border bg-surface text-text hover:bg-bg cursor-pointer transition-colors"
        >
          <Download size={13} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
