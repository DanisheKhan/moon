import { useState } from 'react';
import { 
  Calculator, 
  CreditCard, 
  CheckCircle2, 
  MessageCircle, 
  FileCheck, 
  Clock
} from 'lucide-react';
import { Container, Card } from '@/shared/ui';
import { motion } from '@/shared/motion';
import { formatCurrency } from '@/shared/lib/format';
import { SITE } from '@/shared/lib/site';

const PURCHASE_PRESETS = [15000, 30000, 50000, 75000, 100000];
const TENURES = [3, 6, 9, 12];

export function StoreEmiCalculatorSection() {
  const [amount, setAmount] = useState(35000);
  const [tenure, setTenure] = useState(6);

  const monthlyInstallment = Math.round(amount / tenure);
  const totalPayable = amount; // 0% interest

  const inquiryUrl = `https://wa.me/${SITE.whatsappPhone}?text=${encodeURIComponent(
    `Hello Star Enterprises! I used your website EMI calculator. I am interested in purchasing products worth ${formatCurrency(amount)} with a ${tenure}-month 0% EMI plan. Please verify my finance eligibility with Bajaj Finserv / TVS Credit.`
  )}`;

  return (
    <section id="emi-calculator-section" className="py-20 sm:py-28 border-b border-border bg-surface min-w-0">
      <Container size="xl" className="space-y-10 sm:space-y-12">

        {/* Consistent Section Header */}
        <div className="space-y-2 mb-10 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">
            FINANCE PARTNER
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-text">
            0% Paperless EMI
          </h2>
          <p className="text-sm text-muted max-w-xl">
            All finance available in-store with Bajaj Finserv, TVS Credit, and HDB. Walk in with just your Aadhaar and PAN card for instant 10-minute approvals.
          </p>
        </div>

        {/* 2-Column Calculator & Step-by-Step Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-w-0">

          {/* Left: Interactive Calculator */}
          <div className="lg:col-span-7 min-w-0">
            <Card className="p-6 sm:p-8 space-y-6 bg-bg border border-border rounded-2xl shadow-sm min-w-0">

              {/* Amount Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text uppercase tracking-wide">
                    Estimated Purchase Value
                  </span>
                  <span className="font-mono font-bold text-base sm:text-lg text-text">
                    {formatCurrency(amount)}
                  </span>
                </div>

                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="2500"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-2 bg-surface-subtle border border-border rounded-lg appearance-none cursor-pointer accent-brand-sage"
                  aria-label="Purchase Value Range"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-muted text-[11px] font-medium mr-1">Presets:</span>
                  {PURCHASE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`px-2.5 py-1 rounded-md border text-xs font-mono font-medium transition-colors cursor-pointer ${
                        amount === preset
                          ? 'bg-text text-accent-fg border-text'
                          : 'bg-surface text-muted border-border hover:text-text'
                      }`}
                    >
                      {formatCurrency(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tenure Selection */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="text-xs font-semibold text-text uppercase tracking-wide">
                  Select EMI Tenure (Months)
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {TENURES.map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setTenure(months)}
                      className={`py-2 px-3 rounded-lg border text-center font-medium text-xs transition-all cursor-pointer ${
                        tenure === months
                          ? 'bg-brand-gold-subtle border-brand-gold-border text-brand-gold-text font-bold'
                          : 'bg-surface border-border text-muted hover:text-text hover:bg-surface-hover'
                      }`}
                    >
                      <div className="font-bold">{months} Months</div>
                      <div className="text-[10px] opacity-75">0% Interest</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Result Box — elegant gold-tinted */}
              <div className="p-4 sm:p-5 rounded-xl bg-brand-gold-subtle border border-brand-gold-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-brand-gold-text font-medium flex items-center gap-1.5">
                    <Calculator size={14} className="text-brand-gold" />
                    <span>Calculated Zero-Interest Installment</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-text tracking-tight">
                    {formatCurrency(monthlyInstallment)}
                    <span className="text-xs font-normal text-muted font-sans ml-1">/ month</span>
                  </div>
                </div>

                <div className="text-right text-xs space-y-0.5 border-t sm:border-t-0 sm:border-l border-brand-gold-border pt-2 sm:pt-0 sm:pl-4">
                  <div className="text-muted">Total Repayment:</div>
                  <div className="font-mono font-bold text-text">{formatCurrency(totalPayable)}</div>
                  <div className="text-[11px] text-brand-sage font-medium">₹0 Hidden Charges</div>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <div className="pt-2">
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <a
                    href={inquiryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-text text-accent-fg hover:bg-accent text-xs sm:text-sm font-bold transition-colors"
                  >
                    <MessageCircle size={16} /> Pre-Approve This 0% EMI on WhatsApp
                  </a>
                </motion.div>
              </div>
            </Card>
          </div>

          {/* Right: Step-by-Step Process */}
          <div className="lg:col-span-5 space-y-5 min-w-0">
            <Card className="p-6 space-y-5 bg-bg border border-border rounded-2xl shadow-sm min-w-0">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  How 0% In-Store Financing Works
                </span>
                <span className="text-[11px] font-semibold text-brand-sage bg-brand-sage-subtle px-2 py-0.5 rounded border border-brand-sage-border">
                  10-Min Approval
                </span>
              </div>

              {/* 3 Steps */}
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-crimson-subtle border border-brand-crimson-border text-brand-crimson font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-text">Choose Your Products</div>
                    <div className="text-muted leading-relaxed">
                      Pick any sofa, AC, refrigerator, or phone above ₹5,000 at our showroom.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-gold-subtle border border-brand-gold-border text-brand-gold font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-text">Present Aadhaar &amp; PAN</div>
                    <div className="text-muted leading-relaxed">
                      No paper forms or bank statements needed. Instant OTP verification with Bajaj or TVS.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-sage-subtle border border-brand-sage-border text-brand-sage font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-text">Same-Day Delivery &amp; Setup</div>
                    <div className="text-muted leading-relaxed">
                      Sign digitally and get free delivery and technician assembly across Bhiwandi.
                    </div>
                  </div>
                </div>
              </div>

              {/* Required Docs */}
              <div className="p-3 rounded-lg bg-surface-subtle border border-border space-y-1.5 text-xs">
                <div className="font-semibold text-text flex items-center gap-1.5">
                  <FileCheck size={14} className="text-brand-sage" />
                  <span>Required for Instant Approval</span>
                </div>
                <div className="text-muted text-[11px] leading-relaxed">
                  Active Indian PAN Card • Aadhaar linked with mobile number • Net banking / Debit card for auto-debit setup.
                </div>
              </div>

              {/* Partners */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
                <div className="flex items-center gap-1.5 font-medium text-text">
                  <CreditCard size={14} className="text-brand-gold shrink-0" />
                  <span>Bajaj Finserv • TVS Credit • HDB</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted">
                  <Clock size={12} />
                  <span>10:00 AM – 10:00 PM</span>
                </div>
              </div>
            </Card>

            {/* Trust guarantee */}
            <div className="p-4 rounded-2xl border border-border bg-bg flex items-center gap-3 text-xs shadow-sm">
              <CheckCircle2 size={18} className="text-brand-sage shrink-0" />
              <div className="text-muted leading-relaxed">
                <strong className="text-text font-semibold">100% Transparent:</strong> No upfront security deposits. All EMI terms and cashback benefits are printed on your official GST invoice.
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
