import {
  CreditCard,
  ShieldCheck,
  Truck,
  MapPin,
  MessageCircle,
  Calculator,
  Store,
  ArrowUpRight,
} from 'lucide-react';
import { Container, Button } from '@/shared/ui';
import { motion } from '@/shared/motion';
import { SITE } from '@/shared/lib/site';
import { FlipWords } from '@/components/ui/flip-words';

const HERO_WORDS = ['Enterprises', 'Furniture', 'Electronics', 'Smartphones'];

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center min-w-0">

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
                <div className="text-[clamp(1.8rem,5vw,3.2rem)] font-black tracking-tight leading-tight text-text">
                  <FlipWords
                    words={HERO_WORDS}
                    className="px-0 text-text font-black tracking-tight"
                  />
                </div>
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
                  className="cursor-pointer font-bold px-7 py-3 text-sm rounded-lg"
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

            {/* ── Right: Flagship Showroom Hero Visual ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl overflow-hidden border border-border bg-surface shadow-sm min-w-0 aspect-video w-full"
            >
              <img
                src="/images/storePic.jpeg"
                alt="Star Enterprises Flagship Showroom — Md. Ali Road, Bhiwandi"
                className="w-full h-full object-cover block"
                style={{ width: '100%', height: '100%' }}
                loading="eager"
              />

              {/* Top status overlay */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/95 border border-border text-xs font-semibold text-text shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-brand-sage shrink-0" />
                  <span>Open 7 Days · 10 AM – 10 PM</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/95 border border-border text-xs font-semibold text-brand-crimson shadow-xs">
                  <Store size={13} className="shrink-0" />
                  <span>Flagship Showroom</span>
                </div>
              </div>

              {/* Bottom location & direction strip overlay */}
              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-auto">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface/95 border border-border text-xs font-medium text-text shadow-xs truncate">
                  <MapPin size={13} className="text-brand-crimson shrink-0" />
                  <span className="truncate">Near Reliance Smart, Md. Ali Road</span>
                </div>

                <a
                  href="https://maps.google.com/?q=Near+Reliance+Smart+Md+Ali+Road+Bhiwandi"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-accent text-accent-fg hover:bg-brand-sage-hover text-xs font-semibold transition-colors shadow-2xs shrink-0"
                >
                  <span>Directions</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </motion.div>
          </div>
        </Container>
      </div>
    </section>
  );
}
