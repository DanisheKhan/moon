import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/shared/ui';
import { formatCurrency, formatPhone } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
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
  CheckCircle2,
  MapPin,
  Layers,
  MessageCircle,
} from 'lucide-react';

export function DealerDirectoryTable({
  dealers = [],
  isLoading,
  onOpenAddDealer,
  onOpenAddBill,
  onOpenRecordPayment,
  basePath = '/admin/dealers',
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [balanceFilter, setBalanceFilter] = useState('all'); // all | has_balance | overdue | settled

  const filteredDealers = useMemo(() => {
    return dealers.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        d.name?.toLowerCase().includes(q) ||
        d.brand_name?.toLowerCase().includes(q) ||
        d.contact_person?.toLowerCase().includes(q) ||
        d.phone?.includes(q) ||
        d.gstin?.toLowerCase().includes(q) ||
        d.city?.toLowerCase().includes(q);

      const matchType = typeFilter === 'all' || d.dealer_type === typeFilter;

      let matchBalance = true;
      const totalBal = d.metrics?.totalBalance || 0;
      if (balanceFilter === 'has_balance') {
        matchBalance = totalBal > 0;
      } else if (balanceFilter === 'overdue') {
        matchBalance = (d.metrics?.overdueAmount || 0) > 0;
      } else if (balanceFilter === 'settled') {
        matchBalance = totalBal <= 0;
      }

      return matchSearch && matchType && matchBalance;
    });
  }, [dealers, search, typeFilter, balanceFilter]);

  // Total outstanding balance across all filtered dealers
  const totalPayables = useMemo(() => {
    return filteredDealers.reduce((sum, d) => sum + (d.metrics?.totalBalance || 0), 0);
  }, [filteredDealers]);

  // WhatsApp Khata Reminder Dispatcher
  function handleSendDealerWhatsApp(dealer) {
    const dealerName = dealer.name || dealer.brand_name || 'Valued Partner';
    const total = dealer.metrics?.totalBalance || 0;
    const gstBal = dealer.metrics?.gstBalance || 0;
    const kacchaBal = dealer.metrics?.kacchaBalance || 0;
    const overdue = dealer.metrics?.overdueAmount || 0;

    const breakdownLines = [];
    if (gstBal > 0) breakdownLines.push(`• Official GST Book: ${formatCurrency(gstBal)}`);
    if (kacchaBal > 0) breakdownLines.push(`• Kaccha Khata Book: ${formatCurrency(kacchaBal)}`);

    const text = `*KHATA STATEMENT & PAYMENT REMINDER - STAR ENTERPRISES*
----------------------------------------
*Dear ${dealerName},*
This is a gentle reminder regarding your current ledger balance:

💼 *Supplier Khata:* ${dealerName}
${overdue > 0 ? `⚠️ *OVERDUE AMOUNT:* ${formatCurrency(overdue)}\n` : ''}🔴 *TOTAL OUTSTANDING BALANCE:* ${formatCurrency(total)}
${breakdownLines.length > 0 ? `\n📊 *Ledger Breakdown:*\n${breakdownLines.join('\n')}\n` : ''}----------------------------------------
Kindly verify your records and process the pending payment clearance.

*From:* Star Enterprises
📞 *Contact:* +91 93700 11653

Thank you!`;

    const rawPhone = (dealer.phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const encoded = encodeURIComponent(text);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-4">
      {/* Top Filter & Actions Bar */}
      <div className="bg-surface border border-border rounded-xl shadow-2xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
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
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="brand_direct">OEM / Brand Direct</option>
              <option value="distributor">Distributors / Stockists</option>
              <option value="wholesaler">Wholesalers</option>
              <option value="local_vendor">Local / Cash Vendors</option>
            </select>

            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              aria-label="Filter dealers by balance status"
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-brand-sage cursor-pointer"
            >
              <option value="all">All Balances</option>
              <option value="has_balance">With Outstanding Balance</option>
              <option value="overdue">Overdue Only</option>
              <option value="settled">Fully Settled (₹0)</option>
            </select>

            {/* Top Primary Action */}
            {onOpenAddDealer && (
              <button
                type="button"
                onClick={onOpenAddDealer}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#1B382B] text-white hover:bg-[#142d22] active:scale-[0.99] shadow-2xs transition-all cursor-pointer shrink-0"
              >
                <Plus size={13} className="stroke-[2.5]" />
                <span>Add Dealer</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Counter & Payable Summary Bar */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted">
          <span>
            Showing <strong className="text-text font-semibold">{filteredDealers.length}</strong>{' '}
            {filteredDealers.length === 1 ? 'supplier ledger' : 'supplier ledgers'}
          </span>
          {totalPayables > 0 && (
            <span>
              Total Network Payables:{' '}
              <strong className="text-brand-crimson font-mono font-bold">
                {formatCurrency(totalPayables)}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 text-center bg-surface border border-border rounded-xl shadow-2xs space-y-2">
          <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted">Loading dealer network & ledgers...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredDealers.length === 0 && (
        <div className="py-16 text-center bg-surface border border-dashed border-border rounded-xl shadow-2xs space-y-2">
          <Building2 size={34} className="mx-auto text-muted/50 mb-1" />
          <p className="font-semibold text-text text-sm">No suppliers found</p>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {search || typeFilter !== 'all' || balanceFilter !== 'all'
              ? 'No suppliers match your active search or filter criteria. Try clearing filters.'
              : 'No suppliers registered yet. Click "+ Add Dealer" to add your first supplier or brand ledger.'}
          </p>
        </div>
      )}

      {/* Individual Dealer Cards / Sections */}
      {!isLoading && filteredDealers.length > 0 && (
        <div className="space-y-3.5">
          {filteredDealers.map((d) => {
            const totalBalance = d.metrics?.totalBalance || 0;
            const gstBalance = d.metrics?.gstBalance || 0;
            const kacchaBalance = d.metrics?.kacchaBalance || 0;
            const overdueAmount = d.metrics?.overdueAmount || 0;
            const avgSpeed = d.metrics?.avgDaysTaken;
            const initials = (d.brand_name || d.name || 'DL').slice(0, 2).toUpperCase();

            return (
              <div
                key={d.id}
                className="bg-surface border border-border rounded-xl shadow-2xs hover:border-brand-sage/40 transition-all overflow-hidden"
              >
                {/* 1. Header: Brand Identity & Balance Status */}
                <div className="px-4 py-3 bg-surface-subtle/70 border-b border-border flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Brand Avatar */}
                    <div className="w-9 h-9 rounded-lg bg-brand-sage-subtle border border-brand-sage-border/60 text-brand-sage flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`${basePath}/${d.id}`}
                          className="font-bold text-sm text-text hover:text-brand-sage transition-colors truncate"
                        >
                          {d.name || d.brand_name}
                        </Link>

                        {/* Category Badge */}
                        <span
                          className={cn(
                            'text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0',
                            d.dealer_type === 'brand_direct'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : d.dealer_type === 'distributor'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          )}
                        >
                          {d.dealer_type === 'brand_direct'
                            ? 'OEM / Brand Direct'
                            : d.dealer_type === 'distributor'
                            ? 'Distributor'
                            : d.dealer_type === 'wholesaler'
                            ? 'Wholesaler'
                            : 'Local Vendor'}
                        </span>

                        {d.brand_name && d.brand_name !== d.name && (
                          <span className="text-xs text-muted font-medium">
                            ({d.brand_name})
                          </span>
                        )}
                      </div>

                      {/* Location & Contact Subtitle */}
                      <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {d.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} className="text-muted shrink-0" />
                            <span>{d.city}</span>
                          </span>
                        )}
                        {d.city && d.contact_person && <span>•</span>}
                        {d.contact_person && (
                          <span>Contact: <strong>{d.contact_person}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Balance status indicator */}
                  <div className="flex items-center gap-2 shrink-0">
                    {overdueAmount > 0 ? (
                      <span className="text-[11px] font-bold text-brand-crimson bg-brand-crimson-subtle border border-brand-crimson-border rounded px-2.5 py-0.5 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{formatCurrency(overdueAmount)} Overdue</span>
                      </span>
                    ) : totalBalance > 0 ? (
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded px-2.5 py-0.5">
                        Balance Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-0.5 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Khata Settled</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Body Grid: Contact / Billing / Financials */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Column A: Contact & Compliance */}
                  <div className="space-y-1.5 md:col-span-4 md:border-r md:border-border/60 md:pr-4 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Phone size={12} className="text-brand-sage" />
                      <span>Contact & Compliance</span>
                    </div>

                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted text-[11px]">Phone:</span>
                        <span className="font-mono font-medium text-text">
                          {d.phone ? formatPhone(d.phone) : '—'}
                        </span>
                      </div>

                      {d.gstin ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted text-[11px]">GSTIN:</span>
                          <span className="font-mono font-bold text-brand-sage uppercase">
                            {d.gstin}
                          </span>
                        </div>
                      ) : (
                        <div className="text-muted italic text-[11px]">
                          Non-GST Supplier
                        </div>
                      )}

                      {d.address && (
                        <div className="text-[11px] text-muted truncate pt-0.5">
                          {d.address}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column B: Billing Terms & Credit Agreement */}
                  <div className="space-y-1.5 md:col-span-4 md:border-r md:border-border/60 md:pr-4 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <FileText size={12} className="text-brand-sage" />
                      <span>Billing & Credit Terms</span>
                    </div>

                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-muted text-[11px]">Book Mode:</span>
                        <span
                          className={cn(
                            'text-[10px] font-semibold px-2 py-0.5 rounded border',
                            d.billing_mode === 'both'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : d.billing_mode === 'gst'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          )}
                        >
                          {d.billing_mode === 'both'
                            ? 'GST & Kaccha Separation'
                            : d.billing_mode === 'gst'
                            ? 'GST Invoices Only'
                            : 'Kaccha / Cash Only'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-muted text-[11px]">Credit Term:</span>
                        <span className="font-semibold text-text">
                          {d.default_credit_days || 30} Days
                        </span>
                      </div>

                      {avgSpeed != null && (
                        <div className="text-[11px] text-muted flex items-center gap-1">
                          <Clock size={11} className="text-muted shrink-0" />
                          <span>
                            Avg Clearance Speed: <strong className="text-text">{avgSpeed} days</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column C: Outstanding Khata Balance */}
                  <div className="space-y-2 md:col-span-4 text-left md:text-right">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                        Outstanding Khata Balance
                      </span>
                      <span
                        className={cn(
                          'font-mono text-xl font-bold block',
                          totalBalance > 0 ? 'text-brand-crimson' : 'text-emerald-600'
                        )}
                      >
                        {totalBalance > 0 ? formatCurrency(totalBalance) : '₹0 (Settled)'}
                      </span>
                    </div>

                    {totalBalance > 0 && (
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between md:justify-end gap-3 text-xs">
                        <div className="text-[11px] text-muted flex items-center gap-2 flex-wrap">
                          {gstBalance > 0 && (
                            <span>
                              GST Book: <strong className="font-mono text-text">{formatCurrency(gstBalance)}</strong>
                            </span>
                          )}
                          {gstBalance > 0 && kacchaBalance > 0 && <span>•</span>}
                          {kacchaBalance > 0 && (
                            <span>
                              Kaccha Book: <strong className="font-mono text-amber-800">{formatCurrency(kacchaBalance)}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Footer Toolbar Actions */}
                <div className="px-4 py-2.5 bg-surface-subtle/40 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Summary Metrics */}
                  <div className="text-xs text-muted flex items-center gap-2 flex-wrap">
                    <span>
                      Supplier Ledger ID:{' '}
                      <strong className="font-mono text-[11px] text-text">
                        {d.id.slice(0, 8)}...
                      </strong>
                    </span>
                    {d.metrics?.totalBillsCount != null && (
                      <>
                        <span>•</span>
                        <span>
                          {d.metrics.totalBillsCount}{' '}
                          {d.metrics.totalBillsCount === 1 ? 'bill recorded' : 'bills recorded'}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* Add Bill Button */}
                    {onOpenAddBill && (
                      <button
                        type="button"
                        onClick={() => onOpenAddBill(d)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface text-text hover:bg-surface-subtle shadow-2xs transition-all cursor-pointer"
                        title={`Add purchase bill for ${d.name || d.brand_name}`}
                      >
                        <Plus size={13} className="stroke-[2.5]" />
                        <span>Add Bill</span>
                      </button>
                    )}

                    {/* WhatsApp Reminder (Only if balance is not fully settled) */}
                    {totalBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSendDealerWhatsApp(d)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-2xs transition-all cursor-pointer font-medium"
                        title={`Send WhatsApp ledger balance reminder to ${d.name || d.brand_name} for ${formatCurrency(totalBalance)}`}
                      >
                        <MessageCircle size={13} className="stroke-[2.5]" />
                        <span>WhatsApp Reminder</span>
                      </button>
                    )}

                    {/* Pay Khata Button (if balance > 0) */}
                    {totalBalance > 0 && onOpenRecordPayment && (
                      <button
                        type="button"
                        onClick={() => onOpenRecordPayment(d)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white shadow-2xs transition-all cursor-pointer font-medium"
                        title={`Record payment against balance of ${formatCurrency(totalBalance)}`}
                      >
                        <CreditCard size={13} className="stroke-[2.5]" />
                        <span>Pay Khata ({formatCurrency(totalBalance)})</span>
                      </button>
                    )}

                    {/* View Passbook / Complete Ledger */}
                    <Link
                      to={`${basePath}/${d.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#1B382B] hover:bg-[#142d22] active:scale-[0.99] text-white shadow-2xs transition-all cursor-pointer font-medium"
                      title="Open complete multi-book khata ledger and statement passbook"
                    >
                      <span>Passbook & Ledger</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
