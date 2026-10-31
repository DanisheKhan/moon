import {
  CreditCard,
  ShieldCheck,
  Truck,
  MapPin,
  MessageCircle,
  Calculator,
  Clock,
  Store,
} from 'lucide-react';
import { Container, Button } from '@/shared/ui';
import { motion } from '@/shared/motion';
import { SITE } from '@/shared/lib/site';

/**
 * @param {Object} props
 * @param {() => void} props.onExploreCatalog
 * @param {() => void} [props.onOpenCalculator]
 */
export function StoreHeroShowcase({ onExploreCatalog, onOpenCalculator }) {
  const whatsappUrl = `https://wa.me/${SITE.whatsappPhone}?text=${encodeURIComponent(
    'Hello Star Enterprises! I am visiting your store website and would like to inquire about product availability and 0% EMI financing.'
  )}`;

  return (
    <section className="min-h-[calc(100dvh-4rem)] flex flex-col justify-center border-b border-border bg-bg min-w-0">

      {/* ── Main hero body ── */}
      <div className="flex-1 flex items-center py-12 sm:py-16 lg:py-20">
        <Container size="xl" className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch min-w-0">

            {/* ── Left: Typography column ── */}
            <div className="flex flex-col gap-7 min-w-0">

              {/* Eyebrow — city + store type */}
              <div className="flex items-center gap-3">
                <span className="w-6 h-px bg-brand-crimson shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-crimson">
                  Bhiwandi · Maharashtra · Est. 2013
                </span>
              </div>

              {/* Master headline */}
              <div className="space-y-1 min-w-0">
                <h1 className="text-[clamp(3rem,8vw,5.5rem)] font-black tracking-tight leading-[0.95] text-brand-crimson">
                  STAR
                </h1>
                <p className="text-[clamp(1.8rem,5vw,3.2rem)] font-black tracking-tight leading-tight text-text">
                  Enterprises
                </p>
                {/* Gold rule with tagline */}
                <div className="flex items-center gap-3 pt-3">
                  <span className="h-px flex-1 bg-brand-gold/40" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold whitespace-nowrap">
                    Furniture · Electronics · Smartphones
                  </span>
                  <span className="h-px flex-1 bg-brand-gold/40" />
                </div>
              </div>

              {/* Description — one clean paragraph */}
              <p className="text-sm text-muted leading-relaxed max-w-md">
                Visit our flagship showroom on Md. Ali Road, next to Reliance Smart.
                Hall sofas, inverter ACs, refrigerators, and certified smartphones —
                with direct pricing, brand warranty, and 0% paperless EMI.
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="solid"
                  size="md"
                  onClick={onExploreCatalog}
                  className="cursor-pointer font-bold px-7 py-3 bg-text text-accent-fg hover:bg-accent text-sm rounded-lg"
                >
                  Browse Catalog
                </Button>

                {onOpenCalculator && (
                  <button
                    type="button"
                    onClick={onOpenCalculator}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-surface text-text hover:border-brand-gold hover:text-brand-gold text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <Calculator size={15} className="text-brand-gold" />
                    0% EMI Calculator
                  </button>
                )}

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-brand-sage transition-colors font-medium px-1"
                >
                  <MessageCircle size={14} className="text-brand-sage" />
                  WhatsApp Inquiry
                </a>
              </div>

              {/* ── Trust stats — horizontal inline strip ── */}
              <div className="pt-1 border-t border-border grid grid-cols-2 gap-x-8 gap-y-3.5">
                <div className="flex items-center gap-2.5 text-xs font-medium text-text">
                  <CreditCard size={15} className="text-brand-gold shrink-0" />
                  0% EMI via Bajaj &amp; TVS
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-text">
                  <ShieldCheck size={15} className="text-brand-crimson shrink-0" />
                  100% Brand Warranty
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-text">
                  <Truck size={15} className="text-brand-sage shrink-0" />
                  Free Doorstep Setup
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-text">
                  <MapPin size={15} className="text-brand-crimson shrink-0" />
                  Near Reliance Smart
                </div>
              </div>
            </div>

            {/* ── Right: Showroom image ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl overflow-hidden border border-border bg-surface shadow-sm min-w-0 h-full flex flex-col"
            >
              {/* Image — flex-1 fills remaining height, no fixed aspect ratio */}
              <div className="relative flex-1 min-h-0 overflow-hidden bg-surface-subtle">
                <img
                  src="/images/storePic.jpeg"
                  alt="Star Enterprises Flagship Showroom — Md. Ali Road, Bhiwandi"
                  className="absolute inset-0 w-full h-full object-cover object-center block"
                  loading="eager"
                />
                {/* Minimal corner badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface/95 border border-border text-[11px] font-semibold shadow-sm">
                  <Store size={11} className="text-brand-crimson" />
                  <span>Md. Ali Road Showroom</span>
                </div>
              </div>

              {/* Card footer */}
              <div className="px-5 py-3.5 bg-surface border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-brand-sage shrink-0" />
                    Open 7 Days · 10 AM – 10 PM
                  </span>
                </div>
                <a
                  href="https://maps.google.com/?q=Near+Reliance+Smart+Md+Ali+Road+Bhiwandi"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-crimson hover:underline font-bold"
                >
                  Get Directions →
                </a>
              </div>
            </motion.div>
          </div>
        </Container>
      </div>

      {/* ── Bottom stat bar — full width, separated by top border ── */}
      <div className="border-t border-border bg-surface-subtle py-4">
        <Container size="xl">
          <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            <span>10+ Years of Trust</span>
            <span className="w-px h-3.5 bg-border hidden sm:block" />
            <span>500+ Happy Families</span>
            <span className="w-px h-3.5 bg-border hidden sm:block" />
            <span>0% Interest EMI</span>
            <span className="w-px h-3.5 bg-border hidden sm:block" />
            <span>Official GST Billing</span>
            <span className="w-px h-3.5 bg-border hidden sm:block" />
            <span className="font-mono normal-case tracking-normal text-text font-bold">
              {SITE.displayPhone}
            </span>
          </div>
        </Container>
      </div>
    </section>
  );
}
