import { Link } from 'react-router-dom';
import { MapPin, Phone, ShieldCheck, Shield, MessageCircle } from 'lucide-react';
import { Container } from '@/shared/ui';
import { SITE } from '@/shared/lib/site';

/**
 * @param {Object} props
 * @param {(categorySlug: string, storeCode: string) => void} [props.onSelectCategory]
 */
export function StoreFooter({ onSelectCategory }) {
  return (
    <footer className="bg-[#0d1a14] text-white min-w-0">
      <Container size="xl" className="py-14 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 min-w-0">

          {/* Column 1: Brand + Address */}
          <div className="space-y-4">
            {/* Logo on dark bg */}
            <div>
              <div className="flex items-center gap-0 font-black tracking-tight text-base leading-none">
                <span className="text-brand-crimson font-black">STAR</span>
                <span className="text-white font-black ml-1">ENTERPRISES</span>
              </div>
              <div className="text-xs text-white/50 font-medium mt-1">
                Flagship Retail Showroom • Bhiwandi
              </div>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Hallmark living furniture, inverter appliances, and certified smartphones with direct showroom pricing and instant 0% EMI financing.
            </p>

            <div className="space-y-2 text-xs text-white/60">
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-brand-sage shrink-0 mt-0.5" />
                <span>{SITE.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-brand-sage shrink-0" />
                <span className="font-mono">{SITE.displayPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={13} className="text-brand-sage shrink-0" />
                <span className="font-mono">GSTIN: {SITE.gstin}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Departments */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/80">
              Departments
            </h4>
            <ul className="space-y-2.5 text-xs text-white/55">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.('living-room-furniture', 'furniture-electronics')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Hall &amp; Living Furniture
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.('refrigerators', 'furniture-electronics')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Refrigerators &amp; Freezers
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.('air-coolers-acs', 'furniture-electronics')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  All Brands AC &amp; Coolers
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.('washing-machines', 'furniture-electronics')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Washing Machines
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.('smartphones', 'mobiles')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Smartphones &amp; Wearables
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Services */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/80">
              Services
            </h4>
            <ul className="space-y-2.5 text-xs text-white/55">
              <li>0% EMI with Bajaj &amp; TVS</li>
              <li>Free Doorstep Assembly</li>
              <li>Official GST Input Invoicing</li>
              <li>Manufacturer Brand Warranty</li>
              <li>Certified Pre-Owned Guarantee</li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/80">
              Showroom Support
            </h4>
            <p className="text-xs text-white/55 leading-relaxed">
              Open 7 days a week: 10:00 AM – 10:00 PM. Directly message our store manager on WhatsApp for immediate assistance.
            </p>
            <div>
              <a
                href={`https://wa.me/${SITE.whatsappPhone}?text=${encodeURIComponent('Hello Star Enterprises, I would like to inquire about current store offers.')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 text-xs font-semibold transition-colors"
              >
                <MessageCircle size={14} /> WhatsApp Store Chat
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-10 mt-10 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-white/40">
          <span>Finance Partners: Bajaj Finserv • TVS Credit • HDB Financial</span>

          <div className="flex items-center gap-5">
            <span>© {new Date().getFullYear()} Star Enterprises. All rights reserved.</span>
            <Link
              to="/login"
              className="text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
              title="Authorized Personnel Console"
            >
              <Shield size={12} />
              <span>Owner Portal</span>
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
