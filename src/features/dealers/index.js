export { DealersHubPage } from './routes/DealersHubPage';
export { DealerKhataPage } from './routes/DealerKhataPage';
export { DealerStatsHeader } from './components/DealerStatsHeader';
export { DealerDirectoryTable } from './components/DealerDirectoryTable';
export { BillsRegisterTable } from './components/BillsRegisterTable';
export { DealerKhataLedger } from './components/DealerKhataLedger';
export { AddDealerModal } from './components/AddDealerModal';
export { AddBillModal } from './components/AddBillModal';
export { RecordPaymentModal } from './components/RecordPaymentModal';
export { BillTimelineModal } from './components/BillTimelineModal';
export { DebitNoteModal } from './components/DebitNoteModal';

export {
  useDealers,
  useDealer,
  useDealerBills,
  useDealerBillDetail,
  useDealerPayments,
  useDealerStatement,
  useDealerAnalytics,
  useCreateDealer,
  useUpdateDealer,
  useCreateDealerBill,
  useRecordDealerPayment,
  useCreateDealerDebitNote,
  dealerKeys,
} from './hooks/useDealers';

export {
  listDealers,
  getDealerById,
  createDealer,
  updateDealer,
  listDealerBills,
  getDealerBillDetail,
  createDealerBill,
  recordDealerPayment,
  createDealerDebitNote,
  listDealerPayments,
  getDealerStatement,
  getDealerAnalyticsSummary,
} from './api/dealers.api';
