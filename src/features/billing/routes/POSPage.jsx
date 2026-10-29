import { useState, useMemo, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Button,
  Input,
  Badge,
  Card,
  Modal,
} from '@/shared/ui';
import { useProducts, useProductUnits } from '@/features/inventory';
import { usePlaceSale, useInvoiceDetail } from '../hooks/useBilling';
import { InvoicePrintModal } from '../components/InvoicePrintModal';
import { formatCurrency } from '@/shared/lib/format';
import { getErrorMessage } from '@/shared/lib/errors';
import { cn } from '@/shared/lib/cn';
import {
  Barcode,
  Plus,
  Minus,
  Trash2,
  Check,
  AlertCircle,
  Banknote,
  QrCode,
  CreditCard,
  RotateCcw,
  User,
  Building,
  Package,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Tag,
  Coins,
  Receipt,
  FileCheck2,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Cart Items', icon: ShoppingBag },
  { id: 2, label: 'Customer Details', icon: User },
  { id: 3, label: 'Payment & Settlement', icon: Banknote },
];

export function POSPage() {
  const { store } = useOutletContext();
  const searchInputRef = useRef(null);

  // Stepper state (1: Cart Items, 2: Customer, 3: Payment & Settlement)
  const [currentStep, setCurrentStep] = useState(1);

  // Bill Items Cart State
  const [cart, setCart] = useState([]);

  // Bill-Level Discount State
  const [billDiscountType, setBillDiscountType] = useState('flat'); // 'flat' (₹) | 'percent' (%)
  const [billDiscountValue, setBillDiscountValue] = useState('');

  // Customer State (Step 2)
  const [customerType, setCustomerType] = useState('walkin'); // 'walkin' | 'registered'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [billingNotes, setBillingNotes] = useState('');

  // Payment Tender State (Step 3)
  const [settlementType, setSettlementType] = useState('full'); // 'full' | 'partial' | 'pending'
  const [partialCollectedAmount, setPartialCollectedAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi' | 'card' | 'emi'
  const [cashTendered, setCashTendered] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Barcode / Catalog Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Receipt Modal State
  const [completedInvoiceId, setCompletedInvoiceId] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Serial Unit Selector Modal State
  const [isUnitSelectorOpen, setIsUnitSelectorOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);

  // Data Queries
  const { data: products = [] } = useProducts(store?.id);
  const { data: availableUnits = [], isLoading: unitsLoading } = useProductUnits(
    store?.id,
    pendingProduct?.id,
    'in_stock',
    {
      enabled: Boolean(store?.id && pendingProduct?.id && isUnitSelectorOpen),
    }
  );
  const { data: invoiceDetail } = useInvoiceDetail(completedInvoiceId);
  const placeSaleMutation = usePlaceSale();

  // Keyboard shortcut: Press F2 or / to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.key === 'F2' || e.key === '/') && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        if (currentStep === 1) {
          searchInputRef.current?.focus();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  // Extract categories for filter tabs
  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (p.categories?.name) {
        const catId = p.categories.id || p.categories.name;
        const existing = map.get(catId);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(catId, { id: catId, name: p.categories.name, count: 1 });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Matching items to display in the Available Items section & search
  const displayItems = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all') {
        const matchCat =
          p.categories?.id === selectedCategory || p.categories?.name === selectedCategory;
        if (!matchCat) return false;
      }
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        p.brands?.name?.toLowerCase().includes(q) ||
        p.categories?.name?.toLowerCase().includes(q)
      );
    });
  }, [products, search, selectedCategory]);

  // Add Product to Cart Handler
  function handleAddProduct(product) {
    if (product.is_serialized) {
      setPendingProduct(product);
      setIsUnitSelectorOpen(true);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id && !item.unit_id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id && !item.unit_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          unit_id: null,
          name: product.name,
          sku: product.sku,
          hsn_code: product.hsn_code || '8517',
          selling_price: parseFloat(product.selling_price) || 0,
          gst_rate: !isNaN(parseFloat(product.gst_rate)) ? parseFloat(product.gst_rate) : 18,
          is_serialized: false,
          serial_number: null,
          quantity: 1,
        },
      ];
    });

    searchInputRef.current?.focus();
  }

  // Handle barcode scanner Enter key
  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = search.trim().toLowerCase();
      if (!q) return;

      const exact = products.find(
        (p) => p.sku?.toLowerCase() === q || p.name?.toLowerCase() === q
      );
      const target = exact || (displayItems.length === 1 ? displayItems[0] : null);

      if (target) {
        handleAddProduct(target);
        setSearch('');
      }
    }
  }

  // Select Unit for Serialized Item
  function handleSelectUnit(unit) {
    if (!pendingProduct) return;

    if (cart.some((item) => item.unit_id === unit.id)) {
      alert('This unit is already added to the bill.');
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        product_id: pendingProduct.id,
        unit_id: unit.id,
        name: pendingProduct.name,
        sku: pendingProduct.sku,
        hsn_code: pendingProduct.hsn_code || (store?.code === 'mobiles' ? '8517' : '9401'),
        selling_price: parseFloat(pendingProduct.selling_price) || 0,
        gst_rate: !isNaN(parseFloat(pendingProduct.gst_rate)) ? parseFloat(pendingProduct.gst_rate) : 18,
        is_serialized: true,
        serial_number: unit.serial_number,
        condition_grade: unit.condition_grade,
        quantity: 1,
      },
    ]);

    setIsUnitSelectorOpen(false);
    setPendingProduct(null);
    searchInputRef.current?.focus();
  }

  // Update Item Quantity
  function handleUpdateQuantity(index, delta) {
    setCart((prev) =>
      prev
        .map((item, i) => {
          if (i !== index) return item;
          if (item.is_serialized) return item;
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        })
        .filter(Boolean)
    );
  }

  // Remove single line item
  function handleRemoveItem(index) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  // Clear entire bill
  function handleClearBill() {
    if (cart.length > 0 && !window.confirm('Clear all items and reset this bill?')) {
      return;
    }
    setCart([]);
    setCurrentStep(1);
    setBillDiscountValue('');
    setCustomerType('walkin');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerGstin('');
    setBillingNotes('');
    setSettlementType('full');
    setPartialCollectedAmount('');
    setCashTendered('');
    setPaymentReference('');
    setErrorMessage('');
  }

  // -------------------------------------------------------------
  // DYNAMIC FINANCIAL & DISCOUNT ENGINE
  // -------------------------------------------------------------
  const grossTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.selling_price || 0) * (item.quantity || 1), 0);
  }, [cart]);

  // Bill-Level Overall Discount (Settled in Step 3)
  const billDiscountAmount = useMemo(() => {
    const val = parseFloat(billDiscountValue);
    if (isNaN(val) || val <= 0) return 0;
    if (billDiscountType === 'percent') {
      return (grossTotal * Math.min(val, 100)) / 100;
    }
    return Math.min(val, grossTotal);
  }, [billDiscountType, billDiscountValue, grossTotal]);

  const netTaxableSubtotal = Math.max(grossTotal - billDiscountAmount, 0);

  // Dynamic GST Calculation
  const totalTax = useMemo(() => {
    if (grossTotal === 0 || netTaxableSubtotal === 0) return 0;
    const ratio = grossTotal > 0 ? netTaxableSubtotal / grossTotal : 1;
    return cart.reduce((acc, item) => {
      const itemTaxable = (item.selling_price || 0) * (item.quantity || 1) * ratio;
      const rate = item.gst_rate ?? 18;
      return acc + itemTaxable * (rate / 100);
    }, 0);
  }, [cart, grossTotal, netTaxableSubtotal]);

  const cgstAmount = Math.round((totalTax / 2) * 100) / 100;
  const sgstAmount = Math.round((totalTax / 2) * 100) / 100;
  const rawGrandTotal = netTaxableSubtotal + totalTax;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Math.round((grandTotal - rawGrandTotal) * 100) / 100;

  // Effective Collected Amount and Balance Due (Step 3)
  const effectiveCollectedAmount = useMemo(() => {
    if (settlementType === 'full') return grandTotal;
    if (settlementType === 'pending') return 0;
    const p = parseFloat(partialCollectedAmount);
    return isNaN(p) ? 0 : Math.min(Math.max(p, 0), grandTotal);
  }, [settlementType, grandTotal, partialCollectedAmount]);

  const balanceDueAmount = Math.max(grandTotal - effectiveCollectedAmount, 0);

  // Cash Change Calculation
  const targetCashAmount = settlementType === 'full' ? grandTotal : effectiveCollectedAmount;
  const cashReceivedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(cashReceivedNum - targetCashAmount, 0);

  // Complete Sale & Generate Invoice (Step 3 Final Submission)
  async function handleCompleteSale() {
    if (cart.length === 0) {
      setErrorMessage('Please add at least one product to the invoice.');
      return;
    }

    if (settlementType === 'partial' && effectiveCollectedAmount <= 0) {
      setErrorMessage('Please enter an amount collected now, or choose "Pay Later (Credit)".');
      return;
    }

    if (settlementType === 'pending' && (!customerName.trim() || customerName.trim() === 'Walk-in Customer')) {
      setErrorMessage('Please specify the customer name or phone number in Step 2 before creating a credit/pending bill.');
      return;
    }

    if (settlementType !== 'pending' && paymentMode !== 'cash' && !paymentReference.trim()) {
      setErrorMessage(
        `Please provide a transaction or reference number for ${
          paymentMode === 'upi' ? 'UPI' : paymentMode === 'card' ? 'Card' : 'Financing'
        } payment.`
      );
      return;
    }

    setErrorMessage('');

    try {
      const resolvedCustomerName =
        customerType === 'walkin'
          ? (customerName.trim() || 'Walk-in Customer (B2C)')
          : (customerName.trim() || 'Walk-in Customer');

      const paymentsPayload =
        effectiveCollectedAmount > 0
          ? [
              {
                payment_method: paymentMode,
                amount: effectiveCollectedAmount,
                reference_number:
                  paymentReference.trim() ||
                  (paymentMode === 'cash' && cashReceivedNum > 0
                    ? `Cash: ₹${cashReceivedNum}, Change: ₹${changeDue}`
                    : null),
              },
            ]
          : [];

      const payload = {
        storeId: store?.id,
        customerName: resolvedCustomerName,
        customerPhone: customerPhone.trim() || null,
        customerGstin: customerGstin.trim().toUpperCase() || null,
        notes: billingNotes.trim() || null,
        items: cart.map((item) => {
          const itemGross = (item.selling_price || 0) * (item.quantity || 1);
          const itemShareDiscount = grossTotal > 0 ? (billDiscountAmount * itemGross) / grossTotal : 0;
          const unitDiscount = item.quantity > 0 ? itemShareDiscount / item.quantity : 0;
          return {
            product_id: item.product_id,
            unit_id: item.unit_id,
            quantity: item.quantity,
            unit_price: item.selling_price,
            discount: Math.round(unitDiscount * 100) / 100,
          };
        }),
        payments: paymentsPayload,
      };

      const result = await placeSaleMutation.mutateAsync(payload);
      setCompletedInvoiceId(result.invoice_id);
      setCart([]);
      setCurrentStep(1);
      setSettlementType('full');
      setPartialCollectedAmount('');
      setBillDiscountValue('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerGstin('');
      setBillingNotes('');
      setCashTendered('');
      setPaymentReference('');
      setIsReceiptOpen(true);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6 min-w-0 pb-12">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              POINT OF SALE
            </span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-brand-sage font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-sage animate-pulse" />
              Counter Billing Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text">
            {store?.name} Billing
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Guided 3-step checkout with catalog search, customer invoicing, and counter discount settlement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearBill}
              className="text-xs gap-1.5 text-muted hover:text-danger hover:border-danger/30 rounded-lg font-medium cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Bill</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Interactive Stepper Progress Bar */}
      <div className="rounded-xl border border-border bg-surface p-2 shadow-2xs">
        <div className="grid grid-cols-3 gap-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isCurrent = currentStep === s.id;
            const isCompleted = currentStep > s.id;
            const isClickable = s.id < currentStep || (s.id === 2 && cart.length > 0) || (s.id === 3 && cart.length > 0);

            return (
              <button
                key={s.id}
                type="button"
                disabled={!isClickable && !isCurrent}
                onClick={() => {
                  if (s.id === 2 && cart.length === 0) return;
                  if (s.id === 3 && cart.length === 0) return;
                  setCurrentStep(s.id);
                  setErrorMessage('');
                }}
                className={cn(
                  'flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left select-none',
                  isCurrent && 'bg-text text-bg font-semibold shadow-2xs',
                  isCompleted && 'bg-surface-subtle text-text hover:bg-surface-hover cursor-pointer border border-border',
                  !isCurrent && !isCompleted && 'text-muted opacity-60 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                    isCurrent && 'bg-bg text-text',
                    isCompleted && 'bg-brand-sage text-white',
                    !isCurrent && !isCompleted && 'border border-border text-muted'
                  )}
                >
                  {isCompleted ? <Check size={12} /> : <Icon size={12} />}
                </div>
                <div className="hidden sm:block min-w-0">
                  <div className="truncate font-semibold">{s.label}</div>
                  <div className="text-[10px] opacity-75 truncate">
                    {s.id === 1 && `${cart.length} ${cart.length === 1 ? 'item' : 'items'}`}
                    {s.id === 2 && (customerType === 'walkin' ? 'Walk-in B2C' : 'Registered B2B')}
                    {s.id === 3 && formatCurrency(grandTotal)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-xs font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 1: CART, PRODUCT CATALOG & LINE-ITEM DISCOUNTS           */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Barcode Search & Category Filters */}
          <Card className="p-4 sm:p-5 rounded-xl border border-border bg-surface space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Barcode size={16} className="absolute left-3.5 top-3 text-muted pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Scan Barcode or Type Product Name / SKU (Press Enter to Add)... [F2]"
                  className="w-full min-h-10 pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-xs sm:text-sm text-text placeholder:text-muted focus:outline-brand-sage transition-colors"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors',
                    selectedCategory === 'all'
                      ? 'bg-text text-bg font-semibold'
                      : 'bg-surface-subtle text-muted hover:text-text border border-border'
                  )}
                >
                  All ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors',
                      selectedCategory === cat.id
                        ? 'bg-text text-bg font-semibold'
                        : 'bg-surface-subtle text-muted hover:text-text border border-border'
                    )}
                  >
                    {cat.name} ({cat.count})
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Available Items Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                <Package size={14} className="text-text" />
                <span>Available Store Items</span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {displayItems.length} products
                </Badge>
              </span>
              <span className="text-[11px] text-muted hidden sm:inline">
                Click any item to add directly to the bill
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {displayItems.map((p) => {
                const stockQty = p.inventory?.[0]?.quantity_on_hand ?? 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleAddProduct(p)}
                    className="p-3 rounded-xl border border-border bg-surface hover:border-text/40 hover:bg-surface-subtle transition-all cursor-pointer flex flex-col justify-between shadow-2xs group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-[10px] font-mono text-muted uppercase tracking-wider truncate">
                          {p.sku}
                        </span>
                        {p.is_serialized ? (
                          <Badge variant="sage" className="text-[9px] px-1 py-0 uppercase">
                            Serial
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted font-mono">
                            Stock: {stockQty}
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-xs text-text line-clamp-2 leading-snug group-hover:text-accent">
                        {p.name}
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-between border-t border-border/60 mt-2">
                      <div>
                        <div className="font-semibold font-mono text-xs text-text">
                          {formatCurrency(p.selling_price)}
                        </div>
                        <div className="text-[9px] text-muted">
                          +{p.gst_rate ?? 18}% GST
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        className="h-6 px-2 text-[11px] rounded-md gap-1 font-medium pointer-events-none"
                      >
                        <Plus size={11} /> Add
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Bill Cart */}
          <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-brand-sage" />
                <h2 className="text-sm sm:text-base font-semibold text-text">
                  Bill Items
                </h2>
                <Badge variant="default" className="text-xs font-mono">
                  {cart.length} {cart.length === 1 ? 'line' : 'lines'}
                </Badge>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center space-y-2 border border-dashed border-border rounded-xl">
                <ShoppingBag size={28} className="text-muted mx-auto" />
                <p className="text-xs font-semibold text-text">Your bill is currently empty</p>
                <p className="text-[11px] text-muted max-w-sm mx-auto">
                  Scan a barcode above or click on any available product to add it to this bill.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-border">
                    <thead>
                      <tr className="text-[10px] uppercase font-semibold text-muted bg-surface-subtle">
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3 text-right">MRP (₹)</th>
                        <th className="py-2.5 px-3 text-center">Quantity</th>
                        <th className="py-2.5 px-3 text-center">GST %</th>
                        <th className="py-2.5 px-3 text-right">Line Total (₹)</th>
                        <th className="py-2.5 px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {cart.map((item, idx) => {
                        const lineTaxable = (item.selling_price || 0) * (item.quantity || 1);
                        const lineTotal = Math.round(lineTaxable * (1 + (item.gst_rate / 100)));

                        return (
                          <tr key={item.unit_id || `${item.product_id}-${idx}`} className="hover:bg-surface-subtle/40 transition-colors">
                            <td className="py-3 px-3 min-w-48">
                              <div className="font-semibold text-text text-xs">{item.name}</div>
                              <div className="text-[10px] text-muted font-mono flex items-center gap-1.5 mt-0.5">
                                <span>SKU: {item.sku}</span>
                                {item.serial_number && (
                                  <>
                                    <span>•</span>
                                    <span className="text-brand-sage font-semibold">S/N: {item.serial_number}</span>
                                  </>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-medium text-text whitespace-nowrap">
                              {formatCurrency(item.selling_price)}
                            </td>

                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {item.is_serialized ? (
                                <span className="font-mono font-semibold px-2 py-0.5 bg-surface-subtle border border-border rounded text-xs">
                                  1
                                </span>
                              ) : (
                                <div className="inline-flex items-center border border-border rounded-lg bg-surface">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQuantity(idx, -1)}
                                    className="p-1 hover:bg-surface-subtle text-muted hover:text-text cursor-pointer"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="px-2 font-mono font-semibold text-xs text-text min-w-6 text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQuantity(idx, 1)}
                                    className="p-1 hover:bg-surface-subtle text-muted hover:text-text cursor-pointer"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center font-mono text-muted text-xs whitespace-nowrap">
                              {item.gst_rate}%
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-semibold text-text whitespace-nowrap">
                              {formatCurrency(lineTotal)}
                            </td>

                            <td className="py-3 px-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-muted hover:text-danger rounded hover:bg-danger/10 cursor-pointer transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Step 1 Footer Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-border">
                  <div className="space-y-0.5 text-xs">
                    <div className="text-muted">
                      Gross Subtotal: <strong className="font-mono text-text">{formatCurrency(grossTotal)}</strong>
                    </div>
                    <div className="text-sm font-semibold text-text font-mono">
                      Estimated Total: {formatCurrency(grandTotal)}
                    </div>
                  </div>

                  <Button
                    size="lg"
                    type="button"
                    onClick={() => {
                      if (cart.length === 0) {
                        setErrorMessage('Please add at least one item to proceed.');
                        return;
                      }
                      setErrorMessage('');
                      setCurrentStep(2);
                    }}
                    className="rounded-lg gap-2 text-xs font-semibold px-6 shadow-2xs cursor-pointer"
                  >
                    <span>Proceed to Customer Details ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: CUSTOMER & DELIVERY INVOICE DETAILS                   */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card className="p-5 sm:p-6 rounded-xl border border-border bg-surface space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-text flex items-center gap-2">
                  <User size={16} className="text-brand-sage" />
                  <span>Customer & GST Invoice Details</span>
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Select Walk-in B2C for instantaneous counter sales or fill GSTIN for registered tax invoicing.
                </p>
              </div>

              {/* Quick Customer Type Selector */}
              <div className="inline-flex rounded-lg border border-border bg-surface-subtle p-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerType('walkin');
                    setCustomerName('Walk-in Customer');
                    setCustomerGstin('');
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors text-xs flex items-center gap-1.5',
                    customerType === 'walkin'
                      ? 'bg-text text-bg font-semibold shadow-2xs'
                      : 'text-muted hover:text-text'
                  )}
                >
                  <User size={13} />
                  <span>Quick Walk-in (B2C)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerType('registered');
                    if (customerName === 'Walk-in Customer') setCustomerName('');
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors text-xs flex items-center gap-1.5',
                    customerType === 'registered'
                      ? 'bg-text text-bg font-semibold shadow-2xs'
                      : 'text-muted hover:text-text'
                  )}
                >
                  <Building size={13} />
                  <span>Business / GSTIN (B2B)</span>
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                id="pos-customer-name"
                label="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={customerType === 'walkin' ? 'Walk-in Customer' : 'e.g. Rahul Sharma / Apex Tech'}
                required
              />

              <Input
                id="pos-customer-phone"
                label="Mobile Number (WhatsApp Bill)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9820012345"
              />

              <Input
                id="pos-customer-gstin"
                label="Customer GSTIN (Optional B2B)"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value)}
                placeholder="e.g. 27ABCDE1234F1Z5"
                maxLength={15}
                className="font-mono uppercase"
              />
            </div>

            {/* Delivery / Invoice Remarks */}
            <div>
              <Input
                id="pos-billing-notes"
                label="Delivery Remarks / In-Store Instructions"
                value={billingNotes}
                onChange={(e) => setBillingNotes(e.target.value)}
                placeholder="e.g. Screen guard installed, 1-year store warranty acknowledged"
              />
            </div>

            {/* Mini Bill Preview Strip */}
            <div className="p-3.5 rounded-xl border border-border bg-surface-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Receipt size={15} className="text-muted shrink-0" />
                <span className="text-muted">
                  Billing <strong className="text-text">{cart.length} items</strong> for{' '}
                  <strong className="text-text font-mono">{formatCurrency(grandTotal)}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-brand-sage hover:underline font-medium cursor-pointer"
              >
                Modify Cart Items
              </button>
            </div>

            {/* Step 2 Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                variant="outline"
                type="button"
                onClick={() => setCurrentStep(1)}
                className="rounded-lg gap-2 text-xs font-medium cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Cart</span>
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setCurrentStep(3);
                }}
                className="rounded-lg gap-2 text-xs font-semibold px-6 shadow-2xs cursor-pointer"
              >
                <span>Proceed to Payment & Settlement</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 3: TENDER SELECTION, CHANGE CALCULATOR & PRINT INVOICE  */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (col-span-7): Tender & Payment Selection */}
          <div className="lg:col-span-7 space-y-5">
            <Card className="p-5 sm:p-6 rounded-xl border border-border bg-surface space-y-5 shadow-2xs">
              <div className="pb-3 border-b border-border">
                <h2 className="text-sm sm:text-base font-semibold text-text flex items-center gap-2">
                  <Coins size={16} className="text-brand-sage" />
                  <span>Payment Tender & Collection</span>
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Select payment instrument, manage partial/pending terms, and calculate change return.
                </p>
              </div>

              {/* Settlement Terms Selector: Full vs Partial vs Pay Later */}
              <div className="p-3.5 rounded-xl border border-border bg-surface-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text">Payment Settlement Term</span>
                  <Badge
                    variant={settlementType === 'full' ? 'success' : settlementType === 'partial' ? 'amber' : 'outline'}
                    className="text-[10px] font-mono uppercase"
                  >
                    {settlementType === 'full'
                      ? 'Full Payment'
                      : settlementType === 'partial'
                      ? 'Partial / Token'
                      : 'Credit / Udhaar'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSettlementType('full');
                      setPartialCollectedAmount('');
                    }}
                    className={cn(
                      'p-2 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer',
                      settlementType === 'full'
                        ? 'bg-text text-bg border-text font-bold shadow-2xs'
                        : 'border-border bg-surface text-muted hover:text-text'
                    )}
                  >
                    Full Payment
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSettlementType('partial');
                      if (!partialCollectedAmount) {
                        setPartialCollectedAmount(Math.round(grandTotal / 2).toString());
                      }
                    }}
                    className={cn(
                      'p-2 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer',
                      settlementType === 'partial'
                        ? 'bg-text text-bg border-text font-bold shadow-2xs'
                        : 'border-border bg-surface text-muted hover:text-text'
                    )}
                  >
                    Partial / Token
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSettlementType('pending');
                      setPartialCollectedAmount('0');
                    }}
                    className={cn(
                      'p-2 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer',
                      settlementType === 'pending'
                        ? 'bg-text text-bg border-text font-bold shadow-2xs'
                        : 'border-border bg-surface text-muted hover:text-text'
                    )}
                  >
                    Pay Later (Credit)
                  </button>
                </div>

                {settlementType === 'partial' && (
                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="partial-collected" className="text-xs font-medium text-text">
                        Amount Collected Now (Advance / Token)
                      </label>
                      <span className="text-[11px] font-mono text-muted">
                        Bill: {formatCurrency(grandTotal)}
                      </span>
                    </div>
                    <Input
                      id="partial-collected"
                      type="number"
                      min="1"
                      max={grandTotal}
                      value={partialCollectedAmount}
                      onChange={(e) => setPartialCollectedAmount(e.target.value)}
                      placeholder="e.g. 10000"
                      className="font-mono text-sm font-bold"
                    />
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted">Balance Due (Credit):</span>
                      <span className="font-mono font-bold text-danger">
                        {formatCurrency(balanceDueAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {settlementType === 'pending' && (
                  <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 text-xs space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>100% Pending / Credit (Udhaar) Bill</span>
                    </div>
                    <p className="text-[11px]">
                      No payment will be collected now. Full amount of <strong>{formatCurrency(grandTotal)}</strong> will remain outstanding on the customer account ledger.
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Mode Selector Tabs (Hidden if 100% pending) */}
              {settlementType !== 'pending' && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('cash')}
                      className={cn(
                        'p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-2 cursor-pointer transition-all',
                        paymentMode === 'cash'
                          ? 'border-text bg-text text-bg font-semibold shadow-2xs'
                          : 'border-border bg-surface text-muted hover:text-text hover:bg-surface-subtle'
                      )}
                    >
                      <Banknote size={18} />
                      <span>Cash Register</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('upi')}
                      className={cn(
                        'p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-2 cursor-pointer transition-all',
                        paymentMode === 'upi'
                          ? 'border-text bg-text text-bg font-semibold shadow-2xs'
                          : 'border-border bg-surface text-muted hover:text-text hover:bg-surface-subtle'
                      )}
                    >
                      <QrCode size={18} />
                      <span>UPI / QR Scan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('card')}
                      className={cn(
                        'p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-2 cursor-pointer transition-all',
                        paymentMode === 'card'
                          ? 'border-text bg-text text-bg font-semibold shadow-2xs'
                          : 'border-border bg-surface text-muted hover:text-text hover:bg-surface-subtle'
                      )}
                    >
                      <CreditCard size={18} />
                      <span>Card / POS Swipe</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('emi')}
                      className={cn(
                        'p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-2 cursor-pointer transition-all',
                        paymentMode === 'emi'
                          ? 'border-text bg-text text-bg font-semibold shadow-2xs'
                          : 'border-border bg-surface text-muted hover:text-text hover:bg-surface-subtle'
                      )}
                    >
                      <FileCheck2 size={18} />
                      <span>Consumer EMI</span>
                    </button>
                  </div>

                  {/* Mode-Specific Payment Inputs */}
                  {paymentMode === 'cash' && (
                    <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text uppercase tracking-wider">
                          Cash Tender Calculator
                        </span>
                        <span className="text-[11px] text-muted font-mono">
                          Collect: {formatCurrency(targetCashAmount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div>
                          <Input
                            id="pos-cash-tendered"
                            label="Cash Received From Customer (₹)"
                            type="number"
                            min="0"
                            value={cashTendered}
                            onChange={(e) => setCashTendered(e.target.value)}
                            placeholder={`e.g. ${targetCashAmount}`}
                            className="text-base font-mono font-bold"
                          />

                          {/* Quick Denomination Pills */}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
                            <button
                              type="button"
                              onClick={() => setCashTendered(String(targetCashAmount))}
                              className="px-2 py-0.5 rounded bg-surface border border-border text-[11px] font-mono hover:bg-surface-hover cursor-pointer"
                            >
                              Exact (₹{targetCashAmount})
                            </button>
                            {targetCashAmount < 500 && (
                              <button
                                type="button"
                                onClick={() => setCashTendered('500')}
                                className="px-2 py-0.5 rounded bg-surface border border-border text-[11px] font-mono hover:bg-surface-hover cursor-pointer"
                              >
                                ₹500
                              </button>
                            )}
                            {targetCashAmount < 2000 && (
                              <button
                                type="button"
                                onClick={() => setCashTendered('2000')}
                                className="px-2 py-0.5 rounded bg-surface border border-border text-[11px] font-mono hover:bg-surface-hover cursor-pointer"
                              >
                                ₹2,000
                              </button>
                            )}
                            {targetCashAmount < 5000 && (
                              <button
                                type="button"
                                onClick={() => setCashTendered(String(Math.ceil(targetCashAmount / 500) * 500))}
                                className="px-2 py-0.5 rounded bg-surface border border-border text-[11px] font-mono hover:bg-surface-hover cursor-pointer"
                              >
                                Round Up
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Change Return Result Box */}
                        <div className="p-3.5 rounded-lg border border-border bg-surface text-center space-y-1">
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted block">
                            Change Return to Customer
                          </span>
                          <div
                            className={cn(
                              'text-2xl font-bold font-mono',
                              changeDue > 0 ? 'text-brand-sage' : 'text-text'
                            )}
                          >
                            {formatCurrency(changeDue)}
                          </div>
                          <span className="text-[10px] text-muted block">
                            {cashReceivedNum >= targetCashAmount
                              ? 'Collect cash & return change'
                              : 'Awaiting cash receipt'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMode === 'upi' && (
                    <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-text">
                        <QrCode size={15} className="text-brand-sage" />
                        <span>Instant UPI / QR Code Settlement</span>
                      </div>
                      <Input
                        id="pos-upi-ref"
                        label="UPI UTR / Bank Reference Number"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="e.g. 428901928374 (12-digit UTR)"
                        required
                      />
                      <p className="text-[11px] text-muted">
                        Ask customer to scan store QR for <strong>{formatCurrency(targetCashAmount)}</strong> and enter the 12-digit UTR.
                      </p>
                    </div>
                  )}

                  {paymentMode === 'card' && (
                    <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-text">
                        <CreditCard size={15} className="text-purple-600" />
                        <span>Card POS Swipe Terminal</span>
                      </div>
                      <Input
                        id="pos-card-ref"
                        label="POS Authorization / Slip Number"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="e.g. TXN-948291 / AUTH-0482"
                        required
                      />
                      <p className="text-[11px] text-muted">
                        Swipe or tap customer card on EDC terminal for <strong>{formatCurrency(targetCashAmount)}</strong>.
                      </p>
                    </div>
                  )}

                  {paymentMode === 'emi' && (
                    <div className="p-4 rounded-xl border border-border bg-surface-subtle space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-text">
                        <FileCheck2 size={15} className="text-blue-600" />
                        <span>Financier Consumer Loan / EMI</span>
                      </div>
                      <Input
                        id="pos-emi-ref"
                        label="Financier Loan Approval / File ID"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="e.g. BAJAJ-DO-948291 / HDFC-F-0482"
                        required
                      />
                    </div>
                  )}
                </>
              )}

              {/* Customer Delivery Confirmation */}
              <div className="p-3.5 rounded-xl border border-border bg-surface-subtle text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text">Invoiced To:</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-brand-sage hover:underline cursor-pointer"
                  >
                    Edit Customer Info
                  </button>
                </div>
                <div className="text-text font-medium">
                  {customerName.trim() || 'Walk-in Customer (B2C)'}
                  {customerPhone && ` • ${customerPhone}`}
                </div>
                {customerGstin && (
                  <div className="text-[11px] font-mono text-muted">
                    GSTIN: {customerGstin.toUpperCase()}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column (col-span-5): Final Financial Ledger Summary */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="p-5 sm:p-6 rounded-xl border border-border bg-surface space-y-4 shadow-2xs">
              <div className="pb-3 border-b border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
                  ORDER SUMMARY
                </span>
                <h3 className="text-base font-semibold text-text mt-0.5">
                  Tax Invoice Settlement
                </h3>
              </div>

              {/* Item Lines Summary */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cart.map((it, idx) => {
                  const lineTotal = Math.round((it.selling_price || 0) * (it.quantity || 1) * (1 + (it.gst_rate || 0) / 100));

                  return (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/50">
                      <div className="min-w-0 pr-2">
                        <div className="font-medium text-text truncate">{it.name}</div>
                        <div className="text-[10px] text-muted">
                          Qty: {it.quantity} × {formatCurrency(it.selling_price)}
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-text shrink-0">
                        {formatCurrency(lineTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Special Discount / Concession in Step 3 */}
              <div className="p-3.5 rounded-xl border border-border bg-surface-subtle space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                    <Tag size={13} className="text-brand-sage shrink-0" />
                    <span>Special Discount / Concession</span>
                  </div>
                  {billDiscountAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setBillDiscountValue('')}
                      className="text-[10px] text-muted hover:text-danger cursor-pointer transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setBillDiscountType('flat')}
                      className={cn(
                        'px-2.5 py-1 rounded-md cursor-pointer font-medium transition-colors text-xs',
                        billDiscountType === 'flat' ? 'bg-text text-bg font-bold' : 'text-muted'
                      )}
                    >
                      Flat ₹
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillDiscountType('percent')}
                      className={cn(
                        'px-2.5 py-1 rounded-md cursor-pointer font-medium transition-colors text-xs',
                        billDiscountType === 'percent' ? 'bg-text text-bg font-bold' : 'text-muted'
                      )}
                    >
                      %
                    </button>
                  </div>

                  <input
                    type="number"
                    min="0"
                    placeholder={billDiscountType === 'flat' ? 'e.g. 500' : 'e.g. 5'}
                    value={billDiscountValue}
                    onChange={(e) => setBillDiscountValue(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-mono text-text focus:outline-brand-sage text-right"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <span className="text-[10px] text-muted">Quick:</span>
                  {(billDiscountType === 'flat' ? [100, 250, 500, 1000] : [2, 5, 10, 15]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBillDiscountValue(val.toString())}
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded border border-border hover:bg-surface transition-colors cursor-pointer font-mono',
                        billDiscountValue === val.toString()
                          ? 'bg-text text-bg font-bold border-text'
                          : 'bg-surface text-muted hover:text-text'
                      )}
                    >
                      {billDiscountType === 'flat' ? `₹${val}` : `${val}%`}
                    </button>
                  ))}
                </div>

                {billDiscountAmount > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-brand-sage font-medium pt-1 border-t border-border/40">
                    <span>Discount Applied:</span>
                    <span className="font-mono">-{formatCurrency(billDiscountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Ledger Breakdown */}
              <div className="space-y-2 pt-2 border-t border-border text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span>Gross Total (MRP):</span>
                  <span className="font-mono text-text">{formatCurrency(grossTotal)}</span>
                </div>

                {billDiscountAmount > 0 && (
                  <div className="flex items-center justify-between text-brand-sage font-medium">
                    <span>Discount Savings:</span>
                    <span className="font-mono">-{formatCurrency(billDiscountAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-muted">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono text-text">{formatCurrency(netTaxableSubtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-muted">
                  <span>CGST (Central Tax):</span>
                  <span className="font-mono text-text">{formatCurrency(cgstAmount)}</span>
                </div>

                <div className="flex items-center justify-between text-muted">
                  <span>SGST (State Tax):</span>
                  <span className="font-mono text-text">{formatCurrency(sgstAmount)}</span>
                </div>

                {roundOff !== 0 && (
                  <div className="flex items-center justify-between text-muted text-[11px]">
                    <span>Round-off:</span>
                    <span className="font-mono">{roundOff > 0 ? `+₹${roundOff}` : `-₹${Math.abs(roundOff)}`}</span>
                  </div>
                )}

                {settlementType !== 'full' && (
                  <div className="pt-2 border-t border-border/50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Collected Now:</span>
                      <span className="font-mono font-semibold text-brand-sage">
                        {formatCurrency(effectiveCollectedAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-danger font-semibold">Balance Due (Credit):</span>
                      <span className="font-mono font-bold text-danger">
                        {formatCurrency(balanceDueAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Payable Headline */}
              <div className="p-4 rounded-xl border border-border bg-surface-subtle text-center space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">
                  TOTAL AMOUNT PAYABLE
                </span>
                <div className="text-3xl font-extrabold font-mono text-text tracking-tight">
                  {formatCurrency(grandTotal)}
                </div>
                <span className="text-[10px] text-muted block">
                  {settlementType === 'full' && 'Includes CGST + SGST (GST Invoice Ready)'}
                  {settlementType === 'partial' && `Token of ${formatCurrency(effectiveCollectedAmount)} collected now`}
                  {settlementType === 'pending' && '100% Credit / Unpaid — Account Receivable'}
                </span>
              </div>

              {/* Final Complete Sale & Print Action Button */}
              <div className="space-y-2 pt-2">
                <Button
                  size="lg"
                  type="button"
                  onClick={handleCompleteSale}
                  disabled={cart.length === 0 || placeSaleMutation.isPending}
                  pending={placeSaleMutation.isPending}
                  className="w-full justify-center py-3.5 text-xs sm:text-sm font-semibold rounded-xl gap-2 shadow-2xs cursor-pointer"
                >
                  <Receipt size={16} />
                  <span>
                    {settlementType === 'full' && `Complete Sale & Print Bill (${formatCurrency(grandTotal)})`}
                    {settlementType === 'partial' && `Complete Sale (Collected ${formatCurrency(effectiveCollectedAmount)} • Due ${formatCurrency(balanceDueAmount)})`}
                    {settlementType === 'pending' && `Generate Credit Bill (${formatCurrency(grandTotal)} Due)`}
                  </span>
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full justify-center text-xs font-medium rounded-lg gap-2 cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Back to Customer Details</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Serialized Unit Selector Modal */}
      {isUnitSelectorOpen && (
        <Modal
          isOpen={isUnitSelectorOpen}
          onClose={() => {
            setIsUnitSelectorOpen(false);
            setPendingProduct(null);
          }}
          title={
            pendingProduct ? (
              <div className="flex items-center gap-2">
                <Package size={16} className="text-brand-sage" />
                <span>Select Serial Number for {pendingProduct.name}</span>
              </div>
            ) : (
              'Select Product Unit'
            )
          }
          size="lg"
        >
          {unitsLoading ? (
            <div className="py-12 text-center text-xs text-muted">
              Scanning serial inventory database...
            </div>
          ) : availableUnits.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <AlertCircle size={24} className="text-danger mx-auto" />
              <p className="text-xs font-semibold text-text">No in-stock units available</p>
              <p className="text-[11px] text-muted">
                All serialized units for this SKU have been sold or reserved.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted">
                Choose the exact serial number scanned at the counter:
              </p>
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {availableUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="p-3 flex items-center justify-between hover:bg-surface-subtle transition-colors text-xs"
                  >
                    <div>
                      <div className="font-mono font-semibold text-text">
                        {unit.serial_number}
                      </div>
                      {unit.condition_grade && (
                        <div className="text-[10px] text-muted uppercase">
                          Grade: {unit.condition_grade}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleSelectUnit(unit)}
                      className="text-xs font-medium rounded-md gap-1"
                    >
                      <Check size={12} />
                      <span>Select Unit</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* GST Tax Invoice Print Modal */}
      {completedInvoiceId && (
        <InvoicePrintModal
          isOpen={isReceiptOpen}
          onClose={() => {
            setIsReceiptOpen(false);
            setCompletedInvoiceId(null);
          }}
          invoiceDetail={invoiceDetail}
        />
      )}
    </div>
  );
}
