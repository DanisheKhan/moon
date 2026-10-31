import { 
  Armchair, 
  Wind, 
  Refrigerator, 
  Smartphone, 
  ArrowRight
} from 'lucide-react';
import { Container, Card } from '@/shared/ui';
import { motion } from '@/shared/motion';

/**
 * @param {Object} props
 * @param {(categorySlug: string, storeCode?: string) => void} props.onSelectDepartment
 */
export function StoreDepartmentsSection({ onSelectDepartment }) {
  const departments = [
    {
      id: 'furniture',
      title: 'Hall & Living Furniture',
      subtitle: 'L-shape sofas, 6-seater dining sets, fabric recliners & wooden wardrobes.',
      icon: Armchair,
      storeCode: 'furniture-electronics',
      categorySlug: 'living-room-furniture',
      tag: 'Best Quality & Comfort',
      accentColor: 'text-brand-crimson',
      iconBg: 'bg-brand-crimson-subtle border-brand-crimson-border',
      itemsCount: 'Sofa, Dining & Recliners',
    },
    {
      id: 'cooling',
      title: 'Inverter ACs & Coolers',
      subtitle: 'Lloyd 5-Star split ACs, Symphony 70L heavy-duty desert coolers & fans.',
      icon: Wind,
      storeCode: 'furniture-electronics',
      categorySlug: '',
      tag: 'Free Standard Delivery',
      accentColor: 'text-brand-sage',
      iconBg: 'bg-brand-sage-subtle border-brand-sage-border',
      itemsCount: 'All Top Brands in Stock',
    },
    {
      id: 'appliances',
      title: 'Refrigerators & Washers',
      subtitle: 'Haier floral double-door refrigerators, top-load automatic washing machines.',
      icon: Refrigerator,
      storeCode: 'furniture-electronics',
      categorySlug: 'refrigerators',
      tag: '10-Yr Compressor Warranty',
      accentColor: 'text-brand-sage',
      iconBg: 'bg-brand-sage-subtle border-brand-sage-border',
      itemsCount: 'Kitchen & Home Essentials',
    },
    {
      id: 'mobiles',
      title: 'Smartphones & Mobiles',
      subtitle: 'Apple certified iPhones, OnePlus 5G, Samsung Galaxy, AirPods & chargers.',
      icon: Smartphone,
      storeCode: 'mobiles',
      categorySlug: '',
      tag: 'Instant 0% Paperless EMI',
      accentColor: 'text-brand-gold',
      iconBg: 'bg-brand-gold-subtle border-brand-gold-border',
      itemsCount: 'Brand New & Certified',
    },
  ];

  return (
    <section id="departments-section" className="py-20 sm:py-28 border-b border-border bg-bg min-w-0">
      <Container size="xl" className="space-y-10 sm:space-y-12">

        {/* Consistent Section Header */}
        <div className="space-y-2 mb-10 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-crimson">
            SHOWROOM DEPARTMENTS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-text">
            Shop by Category
          </h2>
          <p className="text-sm text-muted max-w-xl">
            Everything for your home under one roof. Inspect real floor models at our Bhiwandi showroom with direct warranty.
          </p>
        </div>

        {/* 4 Department Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 min-w-0">
          {departments.map((dept) => {
            const Icon = dept.icon;
            return (
              <motion.div
                key={dept.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <Card
                  onClick={() => onSelectDepartment(dept.categorySlug, dept.storeCode)}
                  className="p-5 flex flex-col justify-between h-full bg-surface border border-border rounded-2xl hover:border-border-strong cursor-pointer transition-all shadow-sm group min-w-0"
                >
                  <div className="space-y-4 min-w-0">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${dept.iconBg} ${dept.accentColor}`}>
                      <Icon size={22} />
                    </div>

                    {/* Title & Subtitle */}
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-base font-bold text-text">
                        {dept.title}
                      </h3>
                      <p className="text-xs text-muted leading-relaxed line-clamp-2">
                        {dept.subtitle}
                      </p>
                    </div>

                    {/* Simple tag label */}
                    <span className="text-[11px] font-medium text-muted">
                      {dept.tag}
                    </span>
                  </div>

                  {/* Action bar */}
                  <div className="pt-4 mt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-muted">
                      {dept.itemsCount}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-brand-sage group-hover:underline">
                      <span>Explore</span>
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
