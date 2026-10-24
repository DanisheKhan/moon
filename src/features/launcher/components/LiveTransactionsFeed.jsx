import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button } from '@/shared/ui';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { Receipt, ArrowRight, Clock } from 'lucide-react';

/**
 * Cross-Store Live Transactions Feed
 * @param {Object} props
 * @param {Array} props.invoices
 */
export function LiveTransactionsFeed({ invoices = [] }) {
  const navigate = useNavigate();

  return (
    <Card className="h-full p-6 rounded-xl border border-border bg-surface flex flex-col justify-between space-y-4 min-w-0">
      <div className="space-y-3 min-w-0">
        {/* Header with separated title and subtitle */}
        <div className="pb-3 border-b border-border space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-text text-base tracking-tight truncate">
                Live Sales Activity
              </h3>
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" title="Live stream" />
            </div>
            <span className="text-[11px] font-mono text-muted shrink-0">Realtime</span>
          </div>
          <p className="text-xs text-muted">
            Latest customer checkouts across both branches
          </p>
        </div>

        {invoices.length === 0 ? (
          <div className="py-8 text-center text-muted space-y-2">
            <Receipt size={24} className="mx-auto text-muted/60" />
            <p className="text-xs">No transactions recorded for the selected time range.</p>
          </div>
        ) : (
          <div className="divide-y divide-border min-w-0">
            {invoices.slice(0, 5).map((inv) => {
              const isMobiles = inv.storeCode === 'mobiles';
              return (
                <div
                  key={inv.id}
                  className="h-14 min-h-14 flex items-center justify-between gap-3 text-xs min-w-0"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <Badge variant="default" className="h-5 text-[10px] px-1.5 py-0 shrink-0 font-normal inline-flex items-center">
                        {isMobiles ? 'Mobiles' : 'Furniture'}
                      </Badge>
                      <span className="font-mono font-medium text-text truncate">
                        {inv.invoiceNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted truncate">
                      {inv.customerName}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-semibold text-text">
                      {formatCurrency(inv.grandTotal)}
                    </div>
                    <div className="text-[10px] text-muted flex items-center justify-end gap-1 mt-0.5">
                      <Clock size={10} />
                      <span>{formatDate(inv.createdAt, true)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
        <span className="text-muted text-[11px]">
          POS synchronization active
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/all')}
          className="text-xs cursor-pointer gap-1"
        >
          <span>All Invoices</span>
          <ArrowRight size={13} />
        </Button>
      </div>
    </Card>
  );
}
