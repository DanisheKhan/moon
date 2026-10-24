import { Badge, Button } from '@/shared/ui';
import { Armchair, Smartphone, Store, MapPin, User, Building2, Hash, ArrowRight } from 'lucide-react';

function StoreIcon({ code }) {
  if (code === 'mobiles') return <Smartphone size={22} />;
  if (code === 'furniture-electronics') return <Armchair size={22} />;
  return <Store size={22} />;
}

function MetaCell({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-border bg-bg/60 p-3 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {Icon ? <Icon size={11} className="shrink-0" /> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 text-sm font-medium text-text truncate" title={value}>
        {value || '—'}
      </div>
    </div>
  );
}

export function StorePickerCard({ store, onOpen }) {
  const displayName = store.display_name || store.name;
  const location = [store.address_line1, store.pincode].filter(Boolean).join(', ');

  return (
    <article className="h-full rounded-xl border border-border bg-surface p-6 flex flex-col min-w-0 transition-colors hover:border-text/30">
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl border border-border bg-bg flex items-center justify-center text-text shrink-0">
            <StoreIcon code={store.code} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-text truncate">{displayName}</h2>
            <p className="text-xs text-muted truncate">{store.trade_name || store.name}</p>
          </div>
        </div>
        <Badge variant="default" className="text-[11px] shrink-0">
          Active
        </Badge>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-bg/50 px-3 py-2.5 min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
          <Hash size={11} />
          GSTIN
        </div>
        <p className="mt-0.5 font-mono text-sm text-text tracking-wide truncate">{store.gstin}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 min-w-0">
        <MetaCell label="Manager" value={store.manager_name} icon={User} />
        <MetaCell label="City" value={store.city} icon={Building2} />
        <MetaCell label="Location" value={location} icon={MapPin} />
        <MetaCell label="Phone" value={store.phone} />
      </div>

      <div className="mt-auto pt-5">
        <Button
          variant="solid"
          onClick={onOpen}
          className="w-full rounded-lg text-xs cursor-pointer gap-2"
        >
          Enter store
          <ArrowRight size={14} />
        </Button>
      </div>
    </article>
  );
}
