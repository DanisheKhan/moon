import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '@/shared/ui';
import { formatCurrency, formatPhone } from '@/shared/lib/format';
import {
  Search,
  Building2,
  Phone,
  FileText,
  CreditCard,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export function DealerDirectoryTable({
  dealers = [],
  isLoading,
  onOpenAddBill,
  onOpenRecordPayment,
  basePath = '/admin/dealers',
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [balanceFilter, setBalanceFilter] = useState('all'); // all | has_balance | overdue

  const filteredDealers = useMemo(() => {
    return dealers.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        d.name?.toLowerCase().includes(q) ||
        d.brand_name?.toLowerCase().includes(q) ||
        d.contact_person?.toLowerCase().includes(q) ||
        d.phone?.includes(q) ||
        d.gstin?.toLowerCase().includes(q);

      const matchType = typeFilter === 'all' || d.dealer_type === typeFilter;

      let matchBalance = true;
      if (balanceFilter === 'has_balance') {
        matchBalance = (d.metrics?.totalBalance || 0) > 0;
      } else if (balanceFilter === 'overdue') {
        matchBalance = (d.metrics?.overdueAmount || 0) > 0;
      }

      return matchSearch && matchType && matchBalance;
    });
  }, [dealers, search, typeFilter, balanceFilter]);

  return (
    <Card className="bg-surface border border-border rounded-xl shadow-2xs overflow-hidden">
      {/* Top Filter Bar */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search dealers by brand (Godrej, Samsung...), contact, phone, GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter dealers by category"
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            >
              <option value="all">All Categories</option>
              <option value="brand_direct">Brand Direct (OEM)</option>
              <option value="distributor">Distributors / Stockists</option>
              <option value="wholesaler">Wholesalers</option>
              <option value="local_vendor">Local / Cash Vendors</option>
            </select>

            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              aria-label="Filter dealers by balance status"
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage"
            >
              <option value="all">All Balances</option>
              <option value="has_balance">With Outstanding Balance</option>
              <option value="overdue">Overdue Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-w-0">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-subtle/70 border-b border-border text-[11px] font-bold text-muted uppercase tracking-wider">
              <th className="py-3 px-4">Dealer / Brand</th>
              <th className="py-3 px-4">Contact & Location</th>
              <th className="py-3 px-4">Billing & Credit Terms</th>
              <th className="py-3 px-4 text-right">Outstanding Khata</th>
              <th className="py-3 px-4 text-center">Avg Payment Speed</th>
              <th className="py-3 px-4 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">
                  Loading dealer network & ledgers...
                </td>
              </tr>
            ) : filteredDealers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted space-y-2">
                  <Building2 size={32} className="mx-auto text-muted/50 mb-2" />
                  <p className="font-semibold text-text">No dealers found matching your filters</p>
                  <p className="text-xs text-muted">
                    Try adjusting your search or add a new dealer below.
                  </p>
                </td>
              </tr>
            ) : (
              filteredDealers.map((d) => {
                const totalBalance = d.metrics?.totalBalance || 0;
                const gstBalance = d.metrics?.gstBalance || 0;
                const kacchaBalance = d.metrics?.kacchaBalance || 0;
                const overdueAmount = d.metrics?.overdueAmount || 0;
                const avgSpeed = d.metrics?.avgDaysTaken;

                return (
                  <tr
                    key={d.id}
                    className="hover:bg-surface-subtle/50 transition-colors group"
                  >
                    {/* 1. Dealer / Brand */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-brand-sage-subtle border border-brand-sage-border/50 text-brand-sage flex items-center justify-center font-bold text-sm shrink-0">
                          {d.brand_name?.slice(0, 2).toUpperCase() || 'DL'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-text text-sm hover:text-brand-sage transition-colors">
                              <Link to={`${basePath}/${d.id}`}>{d.brand_name || d.name}</Link>
                            </span>
                            {d.dealer_type === 'brand_direct' && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                OEM Brand
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted truncate max-w-[220px]">
                            {d.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Contact & City */}
                    <td className="py-3.5 px-4 min-w-[150px]">
                      <div className="space-y-0.5">
                        <div className="font-medium text-text">
                          {d.contact_person || 'Distributor Desk'}
                        </div>
                        <div className="text-[11px] text-muted font-mono flex items-center gap-1">
                          <Phone size={10} /> {formatPhone(d.phone)}
                        </div>
                        {d.city && (
                          <div className="text-[10px] text-muted">{d.city}</div>
                        )}
                      </div>
                    </td>

                    {/* 3. Billing & Credit Terms */}
                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {d.billing_mode === 'both' ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              GST & Kaccha
                            </span>
                          ) : d.billing_mode === 'gst' ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              GST Only
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Kaccha Only
                            </span>
                          )}
                          <span className="text-[11px] text-muted font-medium">
                            {d.default_credit_days || 30}d Credit
                          </span>
                        </div>
                        {d.gstin ? (
                          <div className="text-[10px] font-mono text-muted truncate">
                            GSTIN: {d.gstin}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted italic">No GSTIN registered</div>
                        )}
                      </div>
                    </td>

                    {/* 4. Balance & Khata */}
                    <td className="py-3.5 px-4 text-right min-w-[160px]">
                      <div className="space-y-0.5">
                        <div
                          className={`text-sm font-bold font-mono ${
                            totalBalance > 0 ? 'text-text' : 'text-emerald-600'
                          }`}
                        >
                          {totalBalance > 0 ? formatCurrency(totalBalance) : '₹0 (Settled)'}
                        </div>
                        {totalBalance > 0 && (
                          <div className="text-[10px] text-muted flex items-center justify-end gap-1.5">
                            {gstBalance > 0 && (
                              <span className="text-brand-sage font-medium">
                                GST: {formatCurrency(gstBalance)}
                              </span>
                            )}
                            {kacchaBalance > 0 && (
                              <span className="text-amber-700 font-medium">
                                Kaccha: {formatCurrency(kacchaBalance)}
                              </span>
                            )}
                          </div>
                        )}
                        {overdueAmount > 0 && (
                          <div className="text-[10px] font-semibold text-brand-crimson flex items-center justify-end gap-1">
                            <AlertCircle size={10} />
                            {formatCurrency(overdueAmount)} Overdue
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 5. Avg Payment Speed */}
                    <td className="py-3.5 px-4 text-center min-w-[120px]">
                      {avgSpeed != null ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-[11px] font-semibold text-text">
                          <Clock size={11} className="text-muted" />
                          <span>{avgSpeed} Days</span>
                        </div>
                      ) : (
                        <span className="text-muted text-[11px]">-</span>
                      )}
                    </td>

                    {/* 6. Quick Action Buttons */}
                    <td className="py-3.5 px-4 text-right min-w-[170px]">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenAddBill(d)}
                          title="Add New Purchase Bill"
                          className="px-2 py-1 text-[11px] font-semibold rounded bg-surface border border-border hover:bg-surface-hover text-text flex items-center gap-1 transition-colors"
                        >
                          <Plus size={12} />
                          <span>Bill</span>
                        </button>

                        <button
                          onClick={() => onOpenRecordPayment(d)}
                          title="Record Partial or Full Payment"
                          className="px-2 py-1 text-[11px] font-semibold rounded bg-brand-sage-subtle border border-brand-sage-border text-brand-sage hover:bg-brand-sage hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <CreditCard size={12} />
                          <span>Pay</span>
                        </button>

                        <Link
                          to={`${basePath}/${d.id}`}
                          title="Open Complete Khata Passbook"
                          className="p-1 rounded text-muted hover:text-text hover:bg-surface-subtle transition-colors"
                        >
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
