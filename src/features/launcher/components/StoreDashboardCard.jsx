import { Card, Badge, Button } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/format';
import {
  Smartphone,
  Tv,
  ArrowRight,
  Package,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

/**
 * Branch Operational Dashboard Card
 * @param {Object} props
 * @param {Object} props.store
 * @param {Object} props.stats
 * @param {string} props.branchLabel
 * @param {string} props.dateRangeLabel
 * @param {Function} props.onLaunchPos
 * @param {Function} props.onManageInventory
 */
export function StoreDashboardCard({
  store,
  stats = {},
  branchLabel,
  dateRangeLabel,
  onLaunchPos,
  onManageInventory,
}) {
  const isMobiles = store.code === 'mobiles';
  const {
    sales = 0,
    invoiceCount = 0,
    averageOrderValue = 0,
    inventoryValuation = 0,
    lowStockCount = 0,
    newPhonesCount = 0,
    preOwnedCount = 0,
    accessoriesCount = 0,
    pendingIntakes = 0,
    tvCount = 0,
    fridgeCount = 0,
    furnitureCount = 0,
  } = stats;

  return (
    <Card className="p-6 rounded-xl border border-border bg-surface flex flex-col justify-between space-y-6 min-w-0">
      {/* Branch Header */}
      <div className="space-y-4 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl border border-border bg-bg flex items-center justify-center text-text shrink-0">
              {isMobiles ? <Smartphone size={22} /> : <Tv size={22} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-text tracking-tight truncate">
                  {store.name}
                </h2>
              </div>
              <p className="text-xs text-muted truncate">
                GSTIN: <span className="font-mono text-text">{store.gstin}</span>
              </p>
            </div>
          </div>
          <Badge variant="default" className="text-[11px] shrink-0 font-medium">
            {branchLabel}
          </Badge>
        </div>

        {/* Live Sales Stat Block */}
        <div className="p-4 rounded-lg border border-border bg-bg/50 grid grid-cols-2 gap-3 min-w-0">
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider truncate">
              Branch Sales ({dateRangeLabel})
            </div>
            <div className="text-xl font-semibold text-text tracking-tight mt-0.5 truncate">
              {formatCurrency(sales)}
            </div>
            <div className="text-[11px] text-muted mt-0.5 truncate">
              {invoiceCount} {invoiceCount === 1 ? 'invoice' : 'invoices'} billed
            </div>
          </div>

          <div className="min-w-0 border-l border-border pl-3">
            <div className="text-[11px] font-medium text-muted uppercase tracking-wider truncate">
              Avg Order Value
            </div>
            <div className="text-xl font-semibold text-text tracking-tight mt-0.5 truncate">
              {formatCurrency(averageOrderValue)}
            </div>
            <div className="text-[11px] text-muted mt-0.5 truncate">
              Valuation: {formatCurrency(inventoryValuation)}
            </div>
          </div>
        </div>

        {/* Branch Specific Live Stock Breakdown */}
        <div className="space-y-2 min-w-0">
          <div className="text-xs font-semibold text-text uppercase tracking-wider">
            {isMobiles ? 'Serialized & Inventory Status' : 'Category Units in Stock'}
          </div>

          {isMobiles ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-center justify-between min-w-0">
                <span className="text-muted truncate">New Phones (IMEI):</span>
                <span className="font-semibold text-text ml-1.5 shrink-0">{newPhonesCount}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-center justify-between min-w-0">
                <span className="text-muted truncate">Pre-Owned Stock:</span>
                <span className="font-semibold text-text ml-1.5 shrink-0">{preOwnedCount}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-center justify-between min-w-0">
                <span className="text-muted truncate">Accessories Stock:</span>
                <span className="font-semibold text-text ml-1.5 shrink-0">{accessoriesCount}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-surface flex items-center justify-between min-w-0">
                <span className="text-muted truncate">Trade-in Queue:</span>
                <span className="font-semibold text-text ml-1.5 shrink-0">
                  {pendingIntakes > 0 ? `${pendingIntakes} awaiting QA` : '0 pending'}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-border bg-surface flex flex-col justify-between min-w-0">
                <span className="text-muted truncate text-[11px]">Smart TVs</span>
                <span className="font-semibold text-text text-sm mt-1">{tvCount} units</span>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-surface flex flex-col justify-between min-w-0">
                <span className="text-muted truncate text-[11px]">Refrigerators</span>
                <span className="font-semibold text-text text-sm mt-1">{fridgeCount} units</span>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-surface flex flex-col justify-between min-w-0">
                <span className="text-muted truncate text-[11px]">Furniture Sets</span>
                <span className="font-semibold text-text text-sm mt-1">{furnitureCount} units</span>
              </div>
            </div>
          )}
        </div>

        {/* Stock Alert Badge */}
        <div className="pt-1 flex items-center justify-between text-xs min-w-0">
          {lowStockCount > 0 ? (
            <div className="flex items-center gap-1.5 text-danger font-medium truncate">
              <AlertTriangle size={14} className="shrink-0" />
              <span className="truncate">{lowStockCount} items at or below reorder level</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted truncate">
              <FileCheck size={14} className="shrink-0 text-text" />
              <span className="truncate">All SKU stock levels healthy</span>
            </div>
          )}
          <span className="text-muted font-mono text-[11px] shrink-0">
            Series: {store.invoice_prefix}-2026
          </span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="pt-4 border-t border-border flex items-center gap-2.5 min-w-0">
        <Button
          variant="solid"
          onClick={onLaunchPos}
          className="flex-1 gap-2 rounded-lg text-xs cursor-pointer min-w-0"
        >
          <span className="truncate">Open {isMobiles ? 'Mobiles' : 'Furniture'} POS</span>
          <ArrowRight size={14} className="shrink-0" />
        </Button>
        <Button
          variant="outline"
          onClick={onManageInventory}
          className="gap-1.5 rounded-lg text-xs cursor-pointer shrink-0"
        >
          <Package size={14} />
          <span>Inventory</span>
        </Button>
      </div>
    </Card>
  );
}
