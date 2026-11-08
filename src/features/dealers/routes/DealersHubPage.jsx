import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/shared/ui';
import {
  useDealers,
  useDealerBills,
  useDealerPayments,
  useDealerAnalytics,
} from '../hooks/useDealers';
import { useStores } from '@/features/stores';
import { DealerStatsHeader } from '../components/DealerStatsHeader';
import { DealerDirectoryTable } from '../components/DealerDirectoryTable';
import { BillsRegisterTable } from '../components/BillsRegisterTable';
import { AddDealerModal } from '../components/AddDealerModal';
import { AddBillModal } from '../components/AddBillModal';
import { RecordPaymentModal } from '../components/RecordPaymentModal';
import { DebitNoteModal } from '../components/DebitNoteModal';
import { BillTimelineModal } from '../components/BillTimelineModal';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import {
  Building2,
  Receipt,
  Plus,
  CreditCard,
  FileText,
  Clock,
  TrendingDown,
  Layers,
  ArrowRight,
} from 'lucide-react';

export function DealersHubPage() {
  const { storeCode } = useParams();
  const { data: stores = [] } = useStores();

  const currentStore = stores.find((s) => s.code === storeCode);
  const storeId = currentStore?.id || null;

  const [activeTab, setActiveTab] = useState('directory'); // directory | bills | payments

  // Modals state
  const [isAddDealerOpen, setIsAddDealerOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isDebitNoteOpen, setIsDebitNoteOpen] = useState(false);
  const [timelineBillId, setTimelineBillId] = useState(null);

  // Selected item contexts for modals
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);

  // Data queries
  const { data: dealers = [], isLoading: isLoadingDealers } = useDealers({
    storeId,
  });
  const { data: bills = [], isLoading: isLoadingBills } = useDealerBills({
    storeId,
  });
  const { data: payments = [], isLoading: isLoadingPayments } = useDealerPayments();
  const { data: analytics, isLoading: isLoadingAnalytics } = useDealerAnalytics(storeId);

  const basePath = storeCode ? `/admin/${storeCode}/dealers` : '/admin/dealers';

  function handleOpenAddBill(dealer = null) {
    setSelectedDealer(dealer);
    setIsAddBillOpen(true);
  }

  function handleOpenRecordPayment(dealer = null, bill = null) {
    setSelectedDealer(dealer);
    setSelectedBill(bill);
    setIsRecordPaymentOpen(true);
  }

  function handleOpenDebitNote(dealer = null) {
    setSelectedDealer(dealer);
    setIsDebitNoteOpen(true);
  }

  function handleOpenTimeline(billId) {
    setTimelineBillId(billId);
  }

  return (
    <div className="w-full space-y-6 min-w-0 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border min-w-0">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-1">
            ACCOUNTS PAYABLE & PROCUREMENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Dealer & Supplier Khata
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
            Multi-dealer central ledgers (Godrej, Samsung, Onida), partial payments, aging timeline, and strict GST vs. Kaccha separation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenAddBill()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-[#1B382B] text-white hover:bg-[#142d22] active:scale-[0.99] shadow-xs transition-all cursor-pointer"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Add Bill</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDebitNote()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-700 text-white hover:bg-purple-800 active:scale-[0.99] shadow-xs transition-all cursor-pointer"
          >
            <TrendingDown size={14} className="stroke-[2.5]" />
            <span>Debit Note</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenRecordPayment()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.99] shadow-xs transition-all cursor-pointer"
          >
            <CreditCard size={14} className="stroke-[2.5]" />
            <span>Record Payment</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddDealerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-brand-sage text-white hover:bg-brand-sage-hover active:scale-[0.99] shadow-xs transition-all cursor-pointer"
          >
            <Building2 size={14} className="stroke-[2.5]" />
            <span>Add Dealer</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Analytics & Aging Header */}
      <DealerStatsHeader analytics={analytics} isLoading={isLoadingAnalytics} />

      {/* 3. Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-px overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('directory')}
            className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'directory'
                ? 'border-brand-sage text-brand-sage'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <Building2 size={14} />
            <span>Dealer Directory ({dealers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bills')}
            className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'bills'
                ? 'border-brand-sage text-brand-sage'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <FileText size={14} />
            <span>All Bills & Aging ({bills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-brand-sage text-brand-sage'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <CreditCard size={14} />
            <span>Payment Vouchers ({payments.length})</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Content */}
      {activeTab === 'directory' && (
        <DealerDirectoryTable
          dealers={dealers}
          isLoading={isLoadingDealers}
          onOpenAddBill={handleOpenAddBill}
          onOpenRecordPayment={handleOpenRecordPayment}
          basePath={basePath}
        />
      )}

      {activeTab === 'bills' && (
        <BillsRegisterTable
          bills={bills}
          isLoading={isLoadingBills}
          onOpenRecordPayment={handleOpenRecordPayment}
          onOpenTimeline={handleOpenTimeline}
        />
      )}

      {activeTab === 'payments' && (
        <div className="bg-surface border border-border rounded-xl shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-border">
            <h3 className="text-xs font-bold text-text uppercase tracking-wide">
              Recent Supplier Payments & Bank Settlements
            </h3>
          </div>
          <div className="overflow-x-auto min-w-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-subtle/80 border-b border-border text-[11px] font-bold text-muted uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Supplier / Brand</th>
                  <th className="py-3 px-4">Bill Settled</th>
                  <th className="py-3 px-4">Payment Mode & Ref</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingPayments ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted">
                      Loading payment vouchers...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-text whitespace-nowrap">
                        {formatDate(p.payment_date, false)}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-text whitespace-nowrap">
                        {p.payment_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-text">
                        {p.dealer?.brand_name || p.dealer?.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {p.bill ? (
                          <span className="text-text font-medium">
                            {p.bill.bill_number} ({p.bill.bill_type.toUpperCase()})
                          </span>
                        ) : (
                          <span className="text-muted italic">On-Account</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text uppercase text-[11px]">
                          {p.payment_mode}
                        </div>
                        {p.transaction_ref && (
                          <div className="text-[10px] font-mono text-muted">
                            Ref: {p.transaction_ref}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            p.payment_channel === 'official_bank'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {p.payment_channel === 'official_bank'
                            ? 'Official Bank'
                            : 'Cash / Secondary'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-brand-sage whitespace-nowrap">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddDealerModal
        isOpen={isAddDealerOpen}
        onClose={() => setIsAddDealerOpen(false)}
        storeId={storeId}
      />

      <AddBillModal
        isOpen={isAddBillOpen}
        onClose={() => setIsAddBillOpen(false)}
        dealers={dealers}
        preselectedDealer={selectedDealer}
        storeId={storeId}
      />

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        dealers={dealers}
        preselectedDealer={selectedDealer}
        preselectedBill={selectedBill}
        storeId={storeId}
      />

      <DebitNoteModal
        isOpen={isDebitNoteOpen}
        onClose={() => setIsDebitNoteOpen(false)}
        dealers={dealers}
        preselectedDealer={selectedDealer}
        storeId={storeId}
      />

      {timelineBillId && (
        <BillTimelineModal
          isOpen={Boolean(timelineBillId)}
          onClose={() => setTimelineBillId(null)}
          billId={timelineBillId}
          onOpenRecordPayment={handleOpenRecordPayment}
        />
      )}
    </div>
  );
}
