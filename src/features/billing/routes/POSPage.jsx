import { useState, useMemo, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Button,
  Input,
  Badge,
  Card,
  Modal,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
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
  Printer,
  CheckCircle,
  AlertCircle,
  Banknote,
  QrCode,
  CreditCard,
  RotateCcw,
  FileText,
  User,
  Phone,
  Building,
  Package,
  X,
  Layers,
} from 'lucide-react';

export function POSPage() {
  const { store } = useOutletContext();
  const searchInputRef = useRef(null);

  // Bill Customer State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [billingNotes, setBillingNotes] = useState('');

  // Bill Items
  const [cart, setCart] = useState([]);

  // Barcode / SKU Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Tender / Payment State
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi' | 'card'
  const [paymentReference, setPaymentReference] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Add Product to Bill Handler
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
          discount: 0,
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
        hsn_code: pendingProduct.hsn_code || (store.code === 'mobiles' ? '8517' : '9401'),
        selling_price: parseFloat(pendingProduct.selling_price) || 0,
        gst_rate: !isNaN(parseFloat(pendingProduct.gst_rate)) ? parseFloat(pendingProduct.gst_rate) : 18,
        is_serialized: true,
        serial_number: unit.serial_number,
        condition_grade: unit.condition_grade,
        quantity: 1,
        discount: 0,
      },
    ]);

    setIsUnitSelectorOpen(false);
    setPendingProduct(null);
    searchInputRef.current?.focus();
  }

  // Quantity stepper
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
    if (cart.length > 0 && !window.confirm('Clear all items from this bill?')) {
      return;
    }
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerGstin('');
    setBillingNotes('');
    setPaymentReference('');
    setErrorMessage('');
  }

  // Atomically calculate GST and totals
  const subtotal = cart.reduce((acc, item) => {
    const netRate = Math.max(item.selling_price - (item.discount || 0), 0);
    return acc + netRate * item.quantity;
  }, 0);

  const totalTax = cart.reduce((acc, item) => {
    const netRate = Math.max(item.selling_price - (item.discount || 0), 0);
    const taxable = netRate * item.quantity;
    return acc + taxable * (item.gst_rate / 100);
  }, 0);

  const cgstAmount = totalTax / 2;
  const sgstAmount = totalTax / 2;
  const grandTotal = Math.round(subtotal + totalTax);

  // Complete Sale & Generate Invoice
  async function handleCompleteSale() {
    if (cart.length === 0) {
      setErrorMessage('Please add at least one product to the invoice.');
      return;
    }

    if (paymentMode !== 'cash' && !paymentReference.trim()) {
      setErrorMessage(
        `Please provide a transaction or reference number for ${
          paymentMode === 'upi' ? 'UPI' : 'Card'
        } payment.`
      );
      return;
    }

    setErrorMessage('');

    try {
      const payload = {
        storeId: store.id,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || null,
        customerGstin: customerGstin.trim() || null,
        notes: billingNotes.trim() || null,
        items: cart.map((item) => ({
          product_id: item.product_id,
          unit_id: item.unit_id,
          quantity: item.quantity,
          unit_price: item.selling_price,
          discount: item.discount || 0,
        })),
        payments: [
          {
            payment_method: paymentMode,
            amount: grandTotal,
            reference_number: paymentReference.trim() || null,
          },
        ],
      };

      const result = await placeSaleMutation.mutateAsync(payload);
      setCompletedInvoiceId(result.invoice_id);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerGstin('');
      setBillingNotes('');
      setPaymentReference('');
      setIsReceiptOpen(true);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* 1. Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-text">
            {store?.name} Billing (POS)
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Fast checkout, barcode scan ready, atomic GST invoice generator.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs font-medium">
            {cart.length} {cart.length === 1 ? 'Item' : 'Items'} in Bill
          </Badge>
          {cart.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearBill}
              className="text-xs gap-1.5 text-muted hover:text-danger hover:border-danger/30 rounded-lg font-medium"
            >
              <RotateCcw size={13} /> Reset Bill
            </Button>
          )}
        </div>
      </div>

      {/* 2. Customer Details Card (Inline) */}
      <Card className="p-5 sm:p-6 rounded-xl border border-border bg-surface space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-medium text-text pb-2 border-b border-border">
          <div className="flex items-center gap-1.5">
            <User size={14} className="text-muted" />
            <span>Customer & GST Details</span>
          </div>
          <span className="text-[11px] text-muted font-normal">
            Default: Walk-in Customer (B2C)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted flex items-center gap-1">
              <User size={12} /> Customer Name
            </label>
            <Input
              id="cust-name-input"
              placeholder="e.g. Rahul Sharma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-9 text-xs bg-bg"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted flex items-center gap-1">
              <Phone size={12} /> Mobile Number (WhatsApp)
            </label>
            <Input
              id="cust-phone-input"
              type="tel"
              placeholder="e.g. 9820012345"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="h-9 text-xs bg-bg"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted flex items-center gap-1">
              <Building size={12} /> Customer GSTIN (Optional B2B)
            </label>
            <Input
              id="cust-gstin-input"
              placeholder="e.g. 27ABCDE1234F1Z5"
              value={customerGstin}
              onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
              className="h-9 text-xs bg-bg font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted flex items-center gap-1">
              <FileText size={12} /> Invoice Remarks / Delivery
            </label>
            <Input
              id="billing-notes-input"
              placeholder="e.g. Screen guard installed, cash paid"
              value={billingNotes}
              onChange={(e) => setBillingNotes(e.target.value)}
              className="h-9 text-xs bg-bg"
            />
          </div>
        </div>
      </Card>

      {/* 3. Fast Barcode / SKU Command Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl border border-border bg-surface shadow-2xs">
        <div className="relative flex-1 min-w-0">
          <Input
            ref={searchInputRef}
            id="pos-barcode-search"
            placeholder="Scan Barcode or Type Product Name / SKU (Press Enter to Add)... [F2]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-9 pr-9 bg-bg h-10 text-xs sm:text-sm font-normal"
          />
          <Barcode
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-muted bg-surface border border-border rounded">
              F2
            </kbd>
          )}
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1 overflow-x-auto min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors shrink-0',
              selectedCategory === 'all'
                ? 'bg-accent text-accent-fg shadow-2xs'
                : 'bg-bg text-muted hover:text-text border border-border'
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
                'px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors shrink-0',
                selectedCategory === cat.id
                  ? 'bg-accent text-accent-fg shadow-2xs'
                  : 'bg-bg text-muted hover:text-text border border-border'
              )}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* 4. NEW SECTION: Available Store Items (Quick-Add Product Palette) */}
      {/* 4. Available Store Items (Quick-Add Product Palette) */}
      <Card className="p-5 sm:p-6 rounded-xl border border-border bg-surface space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Package size={15} className="text-muted" />
            <h2 className="text-xs font-medium text-text uppercase tracking-wider">
              Available Store Items
            </h2>
            <Badge variant="default" className="text-[10px] font-medium">
              {displayItems.length} products
            </Badge>
          </div>
          <span className="text-[11px] text-muted">
            Click any item to add directly to the bill
          </span>
        </div>

        {displayItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted border border-dashed border-border rounded-lg">
            No products match "{search}" in {selectedCategory === 'all' ? 'catalog' : 'this category'}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 max-h-80 overflow-y-auto pr-1">
            {displayItems.map((prod) => {
              const qtyOnHand = prod.inventory?.[0]?.quantity_on_hand ?? 0;
              const inStock = qtyOnHand > 0;

              return (
                <button
                  key={prod.id}
                  type="button"
                  disabled={!inStock}
                  onClick={() => handleAddProduct(prod)}
                  className={cn(
                    'group rounded-lg border border-border bg-bg p-3 flex flex-col justify-between text-left transition-all cursor-pointer min-w-0 select-none shadow-2xs h-36',
                    inStock
                      ? 'hover:border-text/40 hover:bg-surface'
                      : 'opacity-50 cursor-not-allowed bg-bg/50'
                  )}
                  title={inStock ? `Add ${prod.name} to bill` : 'Out of Stock'}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Edge-to-edge fitted product image */}
                    <div className="relative w-14 h-14 rounded-lg border border-border bg-surface overflow-hidden shrink-0">
                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover block"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted">
                          <Package size={18} />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] text-muted font-mono truncate">
                          {prod.sku}
                        </span>
                        {prod.is_serialized ? (
                          <Badge variant="accent" className="text-[9px] px-1.5 py-0 font-mono shrink-0">
                            {store.code === 'mobiles' ? 'IMEI' : 'Serial'}
                          </Badge>
                        ) : (
                          <span
                            className={cn(
                              'text-[10px] font-medium px-1.5 py-0 rounded-md border shrink-0',
                              inStock
                                ? 'bg-surface border-border text-muted'
                                : 'bg-danger/10 border-danger/30 text-danger'
                            )}
                          >
                            {inStock ? `Stock: ${qtyOnHand}` : 'Out'}
                          </span>
                        )}
                      </div>

                      <div
                        className="font-medium text-xs text-text line-clamp-2 leading-snug group-hover:text-accent transition-colors"
                        title={prod.name}
                      >
                        {prod.name}
                      </div>
                    </div>
                  </div>

                  {/* Price & Add Footer */}
                  <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between gap-1">
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-text truncate">
                        {formatCurrency(prod.selling_price)}
                      </div>
                      <div className="text-[10px] text-muted">+{prod.gst_rate}% GST</div>
                    </div>

                    <span
                      className={cn(
                        'text-xs font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-colors',
                        inStock
                          ? 'bg-surface border-border text-text group-hover:bg-accent group-hover:text-accent-fg group-hover:border-accent'
                          : 'bg-bg border-border text-muted'
                      )}
                    >
                      <Plus size={12} /> Add
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* 5. Itemized Tax Invoice Data Table */}
      <Table containerClassName="rounded-xl border border-border bg-surface shadow-xs min-w-0">
        <TableHead>
          <TableRow>
            <TableHeaderCell className="w-12 text-center">#</TableHeaderCell>
            <TableHeaderCell className="min-w-64">Item Description</TableHeaderCell>
            <TableHeaderCell className="w-24 text-center">HSN/SAC</TableHeaderCell>
            <TableHeaderCell className="w-28 text-right">Rate (₹)</TableHeaderCell>
            <TableHeaderCell className="w-32 text-center">Quantity</TableHeaderCell>
            <TableHeaderCell className="w-24 text-center">GST %</TableHeaderCell>
            <TableHeaderCell className="w-28 text-right">Taxable</TableHeaderCell>
            <TableHeaderCell className="w-32 text-right">Total (₹)</TableHeaderCell>
            <TableHeaderCell className="w-12 text-center" />
          </TableRow>
        </TableHead>

        <TableBody>
          {cart.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="py-12 text-center text-muted">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-full border border-dashed border-border bg-bg flex items-center justify-center text-muted">
                    <Layers size={18} className="opacity-50" />
                  </div>
                  <div className="text-xs font-medium text-text">No Items in Current Bill</div>
                  <p className="text-[11px] text-muted max-w-sm">
                    Click any item from the Available Store Items section above, or scan barcode to add lines to this bill.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            cart.map((item, index) => {
              const lineTaxable = (item.selling_price - (item.discount || 0)) * item.quantity;
              const lineTax = lineTaxable * (item.gst_rate / 100);
              const lineTotal = lineTaxable + lineTax;

              return (
                <TableRow key={`${item.product_id}-${item.unit_id || index}`}>
                  <TableCell className="text-center font-mono text-xs text-muted">
                    {index + 1}
                  </TableCell>

                  <TableCell>
                    <div className="font-medium text-text text-xs leading-tight truncate max-w-64" title={item.name}>
                      {item.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted font-mono">{item.sku}</span>
                      {item.serial_number && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-bg border border-border text-text shrink-0">
                          <CheckCircle size={10} className="text-emerald-600" />
                          SN: {item.serial_number}
                          {item.condition_grade && <span>({item.condition_grade})</span>}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-center font-mono text-xs text-muted">
                    {item.hsn_code}
                  </TableCell>

                  <TableCell className="text-right font-medium text-xs">
                    {formatCurrency(item.selling_price)}
                  </TableCell>

                  <TableCell className="text-center">
                    {!item.is_serialized ? (
                      <div className="inline-flex items-center border border-border rounded-lg bg-bg">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(index, -1)}
                          className="px-2 py-0.5 text-muted hover:text-text cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 text-xs font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(index, 1)}
                          className="px-2 py-0.5 text-muted hover:text-text cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-mono font-medium text-muted bg-bg px-2.5 py-0.5 rounded-md border border-border">
                        1 Unit
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-center text-xs text-muted">
                    {item.gst_rate}%
                  </TableCell>

                  <TableCell className="text-right text-xs text-muted">
                    {formatCurrency(lineTaxable)}
                  </TableCell>

                  <TableCell className="text-right text-xs font-medium text-text">
                    {formatCurrency(lineTotal)}
                  </TableCell>

                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 rounded-md text-muted hover:text-danger hover:bg-bg transition-colors cursor-pointer"
                      title="Remove row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* 6. Financial Settlement & Payment Tender Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        {/* Left: Tender Mode & Reference Number (7 Cols) */}
        <Card className="lg:col-span-7 p-5 sm:p-6 rounded-xl border border-border bg-surface space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-medium text-text uppercase tracking-wider">
              Payment Method & Settlement
            </span>
            <span className="text-xs text-muted">Select collection tender:</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMode('cash')}
              className={cn(
                'py-2 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors',
                paymentMode === 'cash'
                  ? 'bg-accent text-accent-fg border-accent shadow-2xs'
                  : 'bg-bg text-muted border-border hover:text-text'
              )}
            >
              <Banknote size={15} /> Cash at Counter
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('upi')}
              className={cn(
                'py-2 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors',
                paymentMode === 'upi'
                  ? 'bg-accent text-accent-fg border-accent shadow-2xs'
                  : 'bg-bg text-muted border-border hover:text-text'
              )}
            >
              <QrCode size={15} /> UPI / QR Scan
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('card')}
              className={cn(
                'py-2 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors',
                paymentMode === 'card'
                  ? 'bg-accent text-accent-fg border-accent shadow-2xs'
                  : 'bg-bg text-muted border-border hover:text-text'
              )}
            >
              <CreditCard size={15} /> Card / POS Swipe
            </button>
          </div>

          {paymentMode !== 'cash' && (
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text block">
                {paymentMode === 'upi' ? 'UPI UTR / Transaction ID' : 'Card Auth / Slip Ref No.'} *
              </label>
              <Input
                id="pos-payment-ref"
                placeholder={
                  paymentMode === 'upi' ? 'e.g. UPI-9281746201' : 'e.g. AUTH-482910'
                }
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="h-9 text-xs bg-bg font-mono"
                required
              />
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger font-medium flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </Card>

        {/* Right: Grand Financial Summary & Execution Button (5 Cols) */}
        <Card className="lg:col-span-5 p-5 sm:p-6 rounded-xl border border-border bg-surface space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>Taxable Subtotal</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>CGST Amount</span>
              <span className="font-mono">{formatCurrency(cgstAmount)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>SGST Amount</span>
              <span className="font-mono">{formatCurrency(sgstAmount)}</span>
            </div>
            <div className="pt-2 border-t border-border flex items-baseline justify-between">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted block">
                  Total Payable
                </span>
                <span className="text-[10px] text-muted">Inclusive of all taxes</span>
              </div>
              <span className="text-2xl sm:text-3xl font-medium text-text tracking-tight font-mono">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          <Button
            variant="solid"
            size="lg"
            disabled={cart.length === 0 || placeSaleMutation.isPending}
            pending={placeSaleMutation.isPending}
            onClick={handleCompleteSale}
            className="w-full h-11 text-xs sm:text-sm font-medium gap-2 rounded-lg"
          >
            <Printer size={16} />
            {cart.length === 0
              ? 'Add Items to Generate Bill'
              : `Complete Sale & Print Bill (${formatCurrency(grandTotal)})`}
          </Button>
        </Card>
      </div>

      {/* Serial Unit Selector Modal */}
      <Modal
        isOpen={isUnitSelectorOpen}
        onClose={() => {
          setIsUnitSelectorOpen(false);
          setPendingProduct(null);
        }}
        title={
          store?.code === 'mobiles'
            ? `Select Device IMEI - ${pendingProduct?.name}`
            : `Select Unit Serial Number - ${pendingProduct?.name}`
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-muted">
            {store?.code === 'mobiles'
              ? 'This mobile device requires IMEI registration. Please select the specific unit from in-store inventory:'
              : 'This electronic appliance is serialized. Please select the specific unit from in-store inventory:'}
          </p>

          {unitsLoading ? (
            <div className="py-8 text-center text-xs text-muted">Loading available units...</div>
          ) : availableUnits.length === 0 ? (
            <div className="py-6 text-center text-danger border border-dashed border-danger/30 rounded-xl text-xs">
              No in-stock serialized units found for this product in {store?.name}.
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-xl max-h-64 overflow-y-auto">
              {availableUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="p-3 flex items-center justify-between hover:bg-bg/60 transition-colors"
                >
                  <div>
                    <div className="font-mono text-xs font-medium text-text">
                      {unit.serial_number}
                    </div>
                    <div className="text-[11px] text-muted flex gap-2 mt-0.5">
                      <span>Condition: Grade {unit.condition_grade}</span>
                      {unit.battery_health && <span>• Battery: {unit.battery_health}%</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="solid"
                    onClick={() => handleSelectUnit(unit)}
                    className="text-xs h-8 px-3"
                  >
                    Select Unit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Official Tax Invoice & Thermal/A4 Print Modal */}
      <InvoicePrintModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        invoiceDetail={invoiceDetail}
      />
    </div>
  );
}
