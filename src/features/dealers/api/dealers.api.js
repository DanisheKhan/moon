import { supabase } from '@/shared/lib/supabase';
import { getPersistentCache, setPersistentCache } from '@/shared/lib/cachePersistence';

/**
 * Lists all active dealers with computed ledger summaries
 */
export async function listDealers({ storeId, includeInactive = false } = {}) {
  try {
    let query = supabase
      .from('dealers')
      .select(`
        *,
        bills:dealer_bills(id, bill_type, total_amount, paid_amount, balance_amount, status, due_date, cleared_at, payment_days_taken)
      `)
      .order('brand_name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    if (storeId) {
      query = query.or(`store_id.eq.${storeId},store_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const enriched = (data || []).map((dealer) => {
      const bills = dealer.bills || [];
      const totalPurchases = bills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
      const totalPaid = bills.reduce((sum, b) => sum + Number(b.paid_amount || 0), 0);
      const totalBalance = bills.reduce((sum, b) => sum + Number(b.balance_amount || 0), 0);

      const gstBalance = bills
        .filter((b) => b.bill_type === 'gst')
        .reduce((sum, b) => sum + Number(b.balance_amount || 0), 0);

      const kacchaBalance = bills
        .filter((b) => b.bill_type === 'kaccha')
        .reduce((sum, b) => sum + Number(b.balance_amount || 0), 0);

      const todayStr = new Date().toISOString().split('T')[0];
      const overdueBills = bills.filter(
        (b) => b.balance_amount > 0 && b.due_date && b.due_date < todayStr
      );
      const overdueAmount = overdueBills.reduce((sum, b) => sum + Number(b.balance_amount || 0), 0);

      // Average payment speed (days taken for cleared bills)
      const clearedBills = bills.filter((b) => b.status === 'paid' && b.payment_days_taken != null);
      const avgDaysTaken =
        clearedBills.length > 0
          ? Math.round(
              clearedBills.reduce((sum, b) => sum + Number(b.payment_days_taken), 0) /
                clearedBills.length
            )
          : null;

      return {
        ...dealer,
        metrics: {
          totalBills: bills.length,
          totalPurchases,
          totalPaid,
          totalBalance,
          gstBalance,
          kacchaBalance,
          overdueCount: overdueBills.length,
          overdueAmount,
          avgDaysTaken,
        },
      };
    });

    setPersistentCache('dealers_directory', enriched);
    return enriched;
  } catch (err) {
    console.warn('[Dealers API] Network error loading dealers, using cache:', err);
    return getPersistentCache('dealers_directory') || [];
  }
}

/**
 * Gets a single dealer profile with bills and recent payments
 */
export async function getDealerById(dealerId) {
  const { data, error } = await supabase
    .from('dealers')
    .select(`
      *,
      bills:dealer_bills(*),
      payments:dealer_payments(*),
      debit_notes:dealer_debit_notes(*)
    `)
    .eq('id', dealerId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Creates a new dealer profile
 */
export async function createDealer(payload) {
  const { data, error } = await supabase
    .from('dealers')
    .insert([
      {
        name: payload.name.trim(),
        brand_name: payload.brand_name?.trim() || payload.name.trim(),
        contact_person: payload.contact_person?.trim() || null,
        phone: payload.phone.trim(),
        alternate_phone: payload.alternate_phone?.trim() || null,
        email: payload.email?.trim() || null,
        address: payload.address?.trim() || null,
        city: payload.city?.trim() || 'Local',
        state_code: payload.state_code || '09',
        gstin: payload.gstin?.trim().toUpperCase() || null,
        pan_number: payload.pan_number?.trim().toUpperCase() || null,
        bank_name: payload.bank_name?.trim() || null,
        account_number: payload.account_number?.trim() || null,
        ifsc_code: payload.ifsc_code?.trim().toUpperCase() || null,
        upi_id: payload.upi_id?.trim() || null,
        dealer_type: payload.dealer_type || 'brand_direct',
        billing_mode: payload.billing_mode || 'both',
        default_credit_days: Number(payload.default_credit_days) || 30,
        opening_balance: Number(payload.opening_balance) || 0,
        notes: payload.notes?.trim() || null,
        store_id: payload.store_id || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Updates an existing dealer profile
 */
export async function updateDealer(id, payload) {
  const { data, error } = await supabase
    .from('dealers')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Lists dealer bills with optional filters (dealerId, billType: gst/kaccha, status, storeId)
 */
export async function listDealerBills({
  dealerId,
  billType,
  status,
  storeId,
  limit = 100,
} = {}) {
  let query = supabase
    .from('dealer_bills')
    .select(`
      *,
      dealer:dealers(id, name, brand_name, phone, gstin, billing_mode),
      payments:dealer_payments(id, payment_number, payment_date, amount, payment_mode, transaction_ref),
      debit_notes:dealer_debit_notes(id, note_number, note_date, amount, reason)
    `)
    .order('bill_date', { ascending: false })
    .limit(limit);

  if (dealerId) {
    query = query.eq('dealer_id', dealerId);
  }
  if (billType && billType !== 'all') {
    query = query.eq('bill_type', billType);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (storeId) {
    query = query.or(`store_id.eq.${storeId},store_id.is.null`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  return (data || []).map((bill) => {
    let daysOverdue = 0;
    let daysUntilDue = 0;
    if (bill.due_date && bill.balance_amount > 0) {
      const due = new Date(bill.due_date);
      const diffDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        daysOverdue = diffDays;
      } else {
        daysUntilDue = Math.abs(diffDays);
      }
    }

    return {
      ...bill,
      daysOverdue,
      daysUntilDue,
      isOverdue: daysOverdue > 0,
    };
  });
}

/**
 * Gets comprehensive detail for a single bill including full payment and debit note timeline
 */
export async function getDealerBillDetail(billId) {
  const { data, error } = await supabase
    .from('dealer_bills')
    .select(`
      *,
      dealer:dealers(*),
      payments:dealer_payments(*),
      debit_notes:dealer_debit_notes(*)
    `)
    .eq('id', billId)
    .single();

  if (error) throw error;

  // Sort timeline chronologically
  const payments = (data.payments || []).map((p) => ({
    ...p,
    timelineType: 'payment',
    timestamp: p.payment_date,
  }));

  const debits = (data.debit_notes || []).map((d) => ({
    ...d,
    timelineType: 'debit_note',
    timestamp: d.note_date,
  }));

  const timeline = [...payments, ...debits].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  return {
    ...data,
    sortedTimeline: timeline,
  };
}

/**
 * Creates a new dealer bill (GST Tax Invoice or Kaccha Estimate)
 */
export async function createDealerBill(payload) {
  const creditDays = Number(payload.credit_days) || 30;
  const billDate = payload.bill_date || new Date().toISOString().split('T')[0];

  // Auto calculate due date
  const dueDateObj = new Date(billDate);
  dueDateObj.setDate(dueDateObj.getDate() + creditDays);
  const dueDate = dueDateObj.toISOString().split('T')[0];

  const totalAmount = Number(payload.total_amount || 0);
  const taxableAmount = Number(payload.taxable_amount || 0);
  const cgst = Number(payload.cgst_amount || 0);
  const sgst = Number(payload.sgst_amount || 0);
  const igst = Number(payload.igst_amount || 0);

  const { data, error } = await supabase
    .from('dealer_bills')
    .insert([
      {
        dealer_id: payload.dealer_id,
        store_id: payload.store_id || null,
        bill_type: payload.bill_type || 'gst',
        bill_number: payload.bill_number.trim(),
        bill_date: billDate,
        credit_days: creditDays,
        due_date: dueDate,
        taxable_amount: taxableAmount,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        total_amount: totalAmount,
        notes: payload.notes?.trim() || null,
        attachment_url: payload.attachment_url || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Records a partial or full payment against a dealer bill
 */
export async function recordDealerPayment(payload) {
  const paymentNumber =
    payload.payment_number ||
    `PAY-${Date.now().toString().slice(-6)}`;

  const { data, error } = await supabase
    .from('dealer_payments')
    .insert([
      {
        dealer_id: payload.dealer_id,
        bill_id: payload.bill_id || null,
        store_id: payload.store_id || null,
        payment_number: paymentNumber,
        payment_date: payload.payment_date || new Date().toISOString().split('T')[0],
        amount: Number(payload.amount),
        payment_mode: payload.payment_mode || 'bank_transfer',
        payment_channel: payload.payment_channel || 'official_bank',
        transaction_ref: payload.transaction_ref?.trim() || null,
        cheque_date: payload.cheque_date || null,
        receipt_attachment_url: payload.receipt_attachment_url || null,
        notes: payload.notes?.trim() || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Creates a debit note for returns, damage or rate revisions
 */
export async function createDealerDebitNote(payload) {
  const noteNumber =
    payload.note_number ||
    `DN-${Date.now().toString().slice(-6)}`;

  const { data, error } = await supabase
    .from('dealer_debit_notes')
    .insert([
      {
        dealer_id: payload.dealer_id,
        bill_id: payload.bill_id || null,
        store_id: payload.store_id || null,
        note_number: noteNumber,
        note_date: payload.note_date || new Date().toISOString().split('T')[0],
        amount: Number(payload.amount),
        reason: payload.reason || 'purchase_return',
        description: payload.description?.trim() || null,
        attachment_url: payload.attachment_url || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Lists all payment records with filters
 */
export async function listDealerPayments({ dealerId, billId, limit = 100 } = {}) {
  let query = supabase
    .from('dealer_payments')
    .select(`
      *,
      dealer:dealers(id, name, brand_name),
      bill:dealer_bills(id, bill_number, bill_type, total_amount, balance_amount, status)
    `)
    .order('payment_date', { ascending: false })
    .limit(limit);

  if (dealerId) {
    query = query.eq('dealer_id', dealerId);
  }
  if (billId) {
    query = query.eq('bill_id', billId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Generates an end-to-end chronological Khata statement (passbook) for a dealer
 */
export async function getDealerStatement(dealerId, { billType = 'all' } = {}) {
  const [dealerRes, billsRes, paymentsRes, debitsRes] = await Promise.all([
    supabase.from('dealers').select('*').eq('id', dealerId).single(),
    supabase.from('dealer_bills').select('*').eq('dealer_id', dealerId).order('bill_date', { ascending: true }),
    supabase.from('dealer_payments').select('*, bill:dealer_bills(bill_number, bill_type)').eq('dealer_id', dealerId).order('payment_date', { ascending: true }),
    supabase.from('dealer_debit_notes').select('*, bill:dealer_bills(bill_number, bill_type)').eq('dealer_id', dealerId).order('note_date', { ascending: true }),
  ]);

  if (dealerRes.error) throw dealerRes.error;
  const dealer = dealerRes.data;

  let bills = billsRes.data || [];
  let payments = paymentsRes.data || [];
  let debits = debitsRes.data || [];

  if (billType !== 'all') {
    bills = bills.filter((b) => b.bill_type === billType);
    payments = payments.filter((p) => !p.bill || p.bill.bill_type === billType);
    debits = debits.filter((d) => !d.bill || d.bill.bill_type === billType);
  }

  // Combine into single ledger flow
  const ledgerEntries = [];

  bills.forEach((b) => {
    ledgerEntries.push({
      id: b.id,
      date: b.bill_date,
      entryType: 'BILL',
      billType: b.bill_type,
      refNumber: b.bill_number,
      description: `${b.bill_type === 'gst' ? 'GST Tax Invoice' : 'Kaccha Parchi/Slip'} (${b.status})`,
      debit: Number(b.total_amount), // Increases payable
      credit: 0,
      metadata: b,
    });
  });

  payments.forEach((p) => {
    ledgerEntries.push({
      id: p.id,
      date: p.payment_date,
      entryType: 'PAYMENT',
      billType: p.bill?.bill_type || 'unlinked',
      refNumber: p.payment_number,
      description: `Payment (${p.payment_mode?.toUpperCase()}${p.transaction_ref ? ` - ${p.transaction_ref}` : ''})`,
      debit: 0,
      credit: Number(p.amount), // Reduces payable
      metadata: p,
    });
  });

  debits.forEach((d) => {
    ledgerEntries.push({
      id: d.id,
      date: d.note_date,
      entryType: 'DEBIT_NOTE',
      billType: d.bill?.bill_type || 'unlinked',
      refNumber: d.note_number,
      description: `Debit Note (${d.reason.replace('_', ' ')})`,
      debit: 0,
      credit: Number(d.amount), // Reduces payable
      metadata: d,
    });
  });

  // Sort chronological
  ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Compute running balance
  let running = Number(dealer.opening_balance || 0);
  const rowsWithBalance = ledgerEntries.map((row) => {
    running = running + row.debit - row.credit;
    return {
      ...row,
      runningBalance: running,
    };
  });

  return {
    dealer,
    openingBalance: Number(dealer.opening_balance || 0),
    closingBalance: running,
    totalBillsAmount: bills.reduce((s, b) => s + Number(b.total_amount), 0),
    totalPaidAmount: payments.reduce((s, p) => s + Number(p.amount), 0),
    totalDebitsAmount: debits.reduce((s, d) => s + Number(d.amount), 0),
    entries: rowsWithBalance,
  };
}

/**
 * Computes high level executive analytics across all dealers
 */
export async function getDealerAnalyticsSummary({ storeId } = {}) {
  let query = supabase.from('dealer_bills').select(`
    id, bill_type, total_amount, paid_amount, balance_amount, status, bill_date, due_date, cleared_at, payment_days_taken, store_id
  `);

  if (storeId) {
    query = query.or(`store_id.eq.${storeId},store_id.is.null`);
  }

  const { data: bills, error } = await query;
  if (error) throw error;

  const allBills = bills || [];
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  let totalPayable = 0;
  let gstPayable = 0;
  let kacchaPayable = 0;
  let totalPurchases = 0;
  let totalPaid = 0;

  let overdueCount = 0;
  let overdueAmount = 0;

  // Aging buckets for outstanding balances
  const aging = {
    current: { count: 0, amount: 0 }, // 0 to due_date
    bucket0_15: { count: 0, amount: 0 }, // 1 to 15 days overdue
    bucket16_30: { count: 0, amount: 0 }, // 16 to 30 days overdue
    bucket31_60: { count: 0, amount: 0 }, // 31 to 60 days overdue
    bucket60_plus: { count: 0, amount: 0 }, // 60+ days overdue
  };

  const clearedDays = [];

  allBills.forEach((b) => {
    const total = Number(b.total_amount || 0);
    const paid = Number(b.paid_amount || 0);
    const balance = Number(b.balance_amount || 0);

    totalPurchases += total;
    totalPaid += paid;
    totalPayable += balance;

    if (b.bill_type === 'gst') {
      gstPayable += balance;
    } else {
      kacchaPayable += balance;
    }

    if (b.status === 'paid' && b.payment_days_taken != null) {
      clearedDays.push(Number(b.payment_days_taken));
    }

    if (balance > 0 && b.due_date) {
      const due = new Date(b.due_date);
      const diffDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        aging.current.count += 1;
        aging.current.amount += balance;
      } else {
        overdueCount += 1;
        overdueAmount += balance;

        if (diffDays <= 15) {
          aging.bucket0_15.count += 1;
          aging.bucket0_15.amount += balance;
        } else if (diffDays <= 30) {
          aging.bucket16_30.count += 1;
          aging.bucket16_30.amount += balance;
        } else if (diffDays <= 60) {
          aging.bucket31_60.count += 1;
          aging.bucket31_60.amount += balance;
        } else {
          aging.bucket60_plus.count += 1;
          aging.bucket60_plus.amount += balance;
        }
      }
    }
  });

  const avgDaysToClear =
    clearedDays.length > 0
      ? Math.round(clearedDays.reduce((a, c) => a + c, 0) / clearedDays.length)
      : null;

  return {
    totalPayable,
    gstPayable,
    kacchaPayable,
    totalPurchases,
    totalPaid,
    overdueCount,
    overdueAmount,
    avgDaysToClear,
    aging,
  };
}
