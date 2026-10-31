import { 
  MapPin, 
  Clock, 
  Phone, 
  CreditCard, 
  CheckCircle2, 
  MessageCircle, 
  ExternalLink 
} from 'lucide-react';
import { Container, Card } from '@/shared/ui';
import { SITE } from '@/shared/lib/site';

export function StoreSpotlightSection() {
  const mapsUrl = 'https://maps.google.com/?q=Near+Reliance+Smart+Md+Ali+Road+Bhiwandi+Maharashtra';
  const whatsappUrl = `https://wa.me/${SITE.whatsappPhone}?text=${encodeURIComponent(
    'Hello Star Enterprises! I would like to check my 0% EMI finance eligibility with Bajaj Finserv / TVS Credit.'
  )}`;

  return (
    <section id="showroom-section" className="py-20 sm:py-28 border-b border-border bg-bg min-w-0">
      <Container size="xl" className="space-y-10 sm:space-y-12">

        {/* Consistent Section Header */}
        <div className="space-y-2 mb-10 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-sage">
            SHOWROOM & SERVICES
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-text">
            Visit Us in Bhiwandi
          </h2>
          <p className="text-sm text-muted max-w-xl">
            Test furniture comfort and live appliance displays in person, or get instant paperless financing on any purchase above ₹5,000.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">

          {/* Showroom Visit Panel */}
          <Card className="p-6 sm:p-8 space-y-6 bg-surface border border-border rounded-2xl flex flex-col justify-between shadow-sm min-w-0">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-widest text-muted">
                  Flagship Showroom
                </span>
                <span className="text-xs font-medium text-text bg-bg px-2.5 py-0.5 rounded border border-border">
                  Open 7 Days
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-text">Near Reliance Smart, Bhiwandi</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Md. Ali Road, Bhiwandi, Maharashtra 421302. Over 2,500 sq.ft showroom featuring hall sofas, dining sets, refrigerators, split ACs, and certified smartphones.
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-muted">
                  <Clock size={14} className="text-brand-sage shrink-0" />
                  <span>Timings: <strong className="text-text font-medium">10:00 AM – 10:00 PM</strong> (Everyday)</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <MapPin size={14} className="text-brand-sage shrink-0" />
                  <span>Landmark: <strong className="text-text font-medium">Directly next to Reliance Smart</strong></span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Phone size={14} className="text-brand-sage shrink-0" />
                  <span>Helpline: <strong className="text-text font-mono font-medium">{SITE.displayPhone}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex flex-wrap gap-2.5">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-text text-accent-fg hover:bg-accent text-xs font-semibold transition-colors"
              >
                <ExternalLink size={13} /> Open in Google Maps
              </a>

              <a
                href={`tel:${SITE.supportPhone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface border border-border text-text hover:bg-surface-subtle text-xs font-medium transition-colors"
              >
                <Phone size={13} /> Call Showroom
              </a>
            </div>
          </Card>

          {/* 0% EMI Finance Panel */}
          <Card className="p-6 sm:p-8 space-y-6 bg-surface border border-border rounded-2xl flex flex-col justify-between shadow-sm min-w-0">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-widest text-muted">
                  All Finance Available
                </span>
                <span className="text-xs font-medium text-brand-gold-text bg-brand-gold-subtle px-2.5 py-0.5 rounded border border-brand-gold-border">
                  0% Interest Scheme
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-text">Instant 10-Minute Paperless Approvals</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Official in-store financing with Bajaj Finserv, TVS Credit, and HDB Financial Services. Zero down payment options with tenures from 3 to 12 months.
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-muted">
                  <CheckCircle2 size={14} className="text-brand-sage shrink-0" />
                  <span>Partners: <strong className="text-text font-medium">Bajaj Finserv • TVS Credit • HDB</strong></span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <CheckCircle2 size={14} className="text-brand-sage shrink-0" />
                  <span>Documentation: <strong className="text-text font-medium">Aadhaar + PAN Card Only</strong></span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <CreditCard size={14} className="text-brand-sage shrink-0" />
                  <span>Eligibility: <strong className="text-text font-medium">Any purchase from ₹5,000 to ₹1,50,000</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border bg-bg text-text hover:bg-surface-subtle text-xs font-semibold transition-colors"
              >
                <MessageCircle size={15} className="text-brand-sage" /> Check EMI Eligibility on WhatsApp
              </a>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
}
