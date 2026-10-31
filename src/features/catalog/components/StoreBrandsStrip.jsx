import { ShieldCheck } from 'lucide-react';
import { Container } from '@/shared/ui';

const BRANDS = [
  { name: 'Haier', note: 'Authorised Dealer' },
  { name: 'Lloyd', note: 'Havells Brand' },
  { name: 'Samsung', note: 'Digital Appliances' },
  { name: 'LG', note: 'Smart Inverter' },
  { name: 'Apple', note: 'Certified Stock' },
  { name: 'OnePlus', note: '5G Smartphones' },
  { name: 'Symphony', note: 'Cooling Expert' },
  { name: 'Bajaj Finserv', note: '0% EMI Partner' },
  { name: 'TVS Credit', note: 'Paperless Finance' },
  { name: 'HDB Financial', note: 'Instant Finance' },
];

export function StoreBrandsStrip() {
  // Triple the array to ensure continuous looping on wide displays
  const marqueeItems = [...BRANDS, ...BRANDS, ...BRANDS];

  return (
    <section className="py-5 sm:py-6 border-b border-border bg-surface-subtle min-w-0 overflow-hidden">
      <Container size="xl">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6 min-w-0">

          {/* Left Static Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-brand-sage shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-text uppercase tracking-widest">
                Authorised Brand Partners
              </div>
              <div className="text-[11px] text-muted">
                100% Genuine Warranty &amp; Official Billing
              </div>
            </div>
          </div>

          {/* Vertical divider (desktop) */}
          <div className="hidden lg:block w-px h-8 bg-border shrink-0" />

          {/* Infinite Marquee */}
          <div className="flex-1 overflow-hidden relative min-w-0">
            <div className="animate-marquee-infinite flex items-center gap-3 cursor-default">
              {marqueeItems.map((brand, idx) => (
                <div
                  key={`${brand.name}-${idx}`}
                  className="shrink-0 px-3.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-bg transition-colors flex items-center gap-2"
                >
                  <span className="text-xs font-bold tracking-tight text-text">
                    {brand.name}
                  </span>
                  <span className="text-[10px] text-muted font-medium border-l border-border pl-2">
                    {brand.note}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
