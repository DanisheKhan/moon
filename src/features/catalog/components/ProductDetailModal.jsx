import { Modal, Button, Badge } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/format';
import { useCart } from '../hooks/useCatalog';
import { SITE } from '@/shared/lib/site';
import { ShoppingBag, MessageSquare, ShieldCheck, Check, Smartphone, Tv } from 'lucide-react';
import { useState } from 'react';

export function ProductDetailModal({ product, isOpen, onClose }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const inStockQty = product.inventory?.[0]?.quantity_on_hand ?? 0;
  const isAvailable = inStockQty > 0;
  const isMobileStore = product.stores?.code === 'mobiles';

  function handleAdd() {
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleInquire() {
    const text = encodeURIComponent(
      `Hello Star Enterprises, I have an enquiry about *${product.name}* (SKU: ${product.sku}, Price: ${formatCurrency(product.selling_price)}). Is it currently available for immediate store pickup/delivery?`
    );
    window.open(`https://wa.me/${SITE.whatsappPhone}?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product.name} size="xl">
      <div className="space-y-6 text-text min-w-0">
        {/* Brand & Store Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border border-border bg-bg flex items-center justify-center text-text">
              {isMobileStore ? <Smartphone size={16} /> : <Tv size={16} />}
            </div>
            <div>
              <div className="text-xs font-medium">{product.brands?.name || 'Star Certified'}</div>
              <div className="text-[11px] text-muted">{product.stores?.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAvailable ? (
              <Badge variant={inStockQty < 2 ? 'danger' : 'success'} className="text-xs">
                In Stock ({inStockQty} units)
              </Badge>
            ) : (
              <Badge variant="danger" className="text-xs">
                Out of Stock
              </Badge>
            )}
            <Badge variant="accent" className="text-xs">
              SKU: {product.sku}
            </Badge>
          </div>
        </div>

        {/* Product Image Showcase */}
        {product.image_url && (
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden bg-surface border border-border flex items-center justify-center shadow-2xs">
            <img
              src={product.image_url}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover block"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Pricing Banner */}
        <div className="p-4 rounded-xl border border-border bg-bg flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs text-muted">Special Store Price:</div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-text">
              {formatCurrency(product.selling_price)}
            </div>
          </div>
          <div className="text-right">
            {product.mrp && product.mrp > product.selling_price && (
              <div className="text-sm font-mono text-muted line-through">
                MRP {formatCurrency(product.mrp)}
              </div>
            )}
            <div className="text-xs text-muted">
              Includes {product.gst_rate}% GST • Official Tax Invoice
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted">Description</h4>
          <p className="text-sm text-text leading-relaxed">{product.description}</p>
        </div>

        {/* Technical Specifications Grid */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted">
              Technical Specifications
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(product.specs).map(([key, val]) => (
                <div
                  key={key}
                  className="p-2.5 rounded-lg border border-border bg-surface flex flex-col justify-center min-w-0"
                >
                  <span className="text-muted capitalize text-[11px]">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="font-medium text-text truncate">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warranty & Assurance */}
        <div className="p-3 rounded-lg border border-border bg-bg flex items-center gap-3 text-xs text-muted">
          <ShieldCheck size={18} className="text-text shrink-0" />
          <span>
            100% Genuine Certified Product with Star Enterprises store warranty & doorstep servicing support.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Button
            variant="solid"
            className="flex-1 justify-center gap-2 text-xs py-2.5 cursor-pointer"
            onClick={handleAdd}
          >
            {added ? (
              <>
                <Check size={16} /> Added to Cart!
              </>
            ) : (
              <>
                <ShoppingBag size={16} /> Add to Cart
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="flex-1 justify-center gap-2 text-xs py-2.5 cursor-pointer"
            onClick={handleInquire}
          >
            <MessageSquare size={16} /> WhatsApp Inquiry
          </Button>
        </div>
      </div>
    </Modal>
  );
}
