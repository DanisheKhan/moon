import { Star, ShieldCheck } from 'lucide-react';
import { Container, Card } from '@/shared/ui';

const REVIEWS = [
  {
    id: 1,
    name: 'Farhan Ansari',
    location: 'Dhamankar Naka, Bhiwandi',
    product: '7-Seater Hall L-Shape Sofa & Haier Double Door Fridge',
    rating: 5,
    date: '2 weeks ago',
    comment:
      'Furnished our new flat completely from Star Enterprises. Saved almost ₹14,000 compared to other stores in Thane, and their team delivered and assembled everything the very same evening. Top notch fabric quality!',
  },
  {
    id: 2,
    name: 'Siddharth Patil',
    location: 'Kalyan Road, Bhiwandi',
    product: 'Apple iPhone 15 & 20W Fast Charger',
    rating: 5,
    date: '1 month ago',
    comment:
      'Got 0% paperless EMI with Bajaj Finserv right at the counter. The staff did the paperwork in under 10 minutes with just my Aadhaar OTP. 100% genuine sealed box with Apple India warranty.',
  },
  {
    id: 3,
    name: 'Aamir Momin',
    location: 'Md. Ali Road, Bhiwandi',
    product: 'Lloyd 1.5 Ton 5-Star Inverter AC',
    rating: 5,
    date: '3 weeks ago',
    comment:
      'Being right next to Reliance Smart makes visiting very convenient. Tested the cooling in person at the showroom. Delivery and installation technician arrived next morning with official GST bill.',
  },
];

export function StoreReviewsSection() {
  return (
    <section id="reviews-section" className="py-20 sm:py-28 border-b border-border bg-surface min-w-0">
      <Container size="xl" className="space-y-10 sm:space-y-12">

        {/* Consistent Section Header with Rating Badge */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-sage">
              VERIFIED REVIEWS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-text">
              Trusted by Bhiwandi Families
            </h2>
            <p className="text-sm text-muted max-w-xl">
              Real experiences from real customers who visited our Md. Ali Road showroom.
            </p>
          </div>

          {/* Aggregate Rating Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-bg border border-border shadow-sm shrink-0">
            <div className="flex items-center gap-0.5 text-brand-gold">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} className="fill-brand-gold" />
              ))}
            </div>
            <span className="text-sm font-bold text-text">4.9 / 5.0</span>
            <span className="text-xs text-muted border-l border-border pl-3">
              500+ Showroom Deliveries
            </span>
          </div>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-0">
          {REVIEWS.map((review) => (
            <Card
              key={review.id}
              className="p-6 h-full flex flex-col justify-between space-y-5 bg-bg border border-border rounded-2xl shadow-sm min-w-0"
            >
              <div className="space-y-4 min-w-0">
                {/* Large quote mark */}
                <div className="text-4xl font-black text-brand-gold/30 leading-none select-none">"</div>

                {/* Stars & Verified */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-brand-gold">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={13} className="fill-brand-gold text-brand-gold" />
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-sage bg-brand-sage-subtle px-2 py-0.5 rounded border border-brand-sage-border">
                    <ShieldCheck size={11} /> Verified Buyer
                  </span>
                </div>

                {/* Review Text */}
                <p className="text-xs text-muted leading-relaxed">
                  {review.comment}
                </p>
              </div>

              {/* Reviewer Details */}
              <div className="pt-4 border-t border-border space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-text">
                  <span>{review.name}</span>
                  <span className="text-[10px] font-normal text-muted">{review.date}</span>
                </div>
                <div className="text-[11px] text-muted">
                  {review.location}
                </div>
                <div className="text-[10px] text-brand-sage font-medium truncate pt-0.5">
                  Purchased: {review.product}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
