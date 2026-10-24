import { useNavigate } from 'react-router-dom';
import { Badge, Button } from '@/shared/ui';
import { useStores } from '@/features/stores';
import { StorePickerCard } from '../components/StorePickerCard';
import { Users, Layers, BarChart3 } from 'lucide-react';

function sortOwnerStores(stores) {
  const rank = (store) => {
    if (store.code === 'furniture-electronics') return 0;
    if (store.code === 'mobiles') return 1;
    return 2;
  };
  return [...stores].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

export function LauncherPage() {
  const navigate = useNavigate();
  const { data: stores = [], isLoading } = useStores();

  const ownerStores = sortOwnerStores(stores.filter((s) => s.is_active !== false));

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 min-w-0">
        <div className="space-y-2 min-w-0">
          <Badge variant="accent" className="text-xs">
            Owner portal
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text">
            Your stores
          </h1>
          <p className="text-sm text-muted max-w-xl">
            Choose a store to continue. Each card shows GSTIN, manager, city, and location for the branches you own.
          </p>
        </div>
        <p className="text-xs text-muted shrink-0">{ownerStores.length} active {ownerStores.length === 1 ? 'store' : 'stores'}</p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted">Loading your stores...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0">
          {ownerStores.map((store) => (
            <StorePickerCard
              key={store.id}
              store={store}
              onOpen={() => navigate(`/admin/${store.code}`)}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/overview')}
          className="justify-start rounded-lg gap-2 text-xs"
        >
          <BarChart3 size={14} />
          Network overview
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/staff')}
          className="justify-start rounded-lg gap-2 text-xs"
        >
          <Users size={14} />
          Staff management
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/all')}
          className="justify-start rounded-lg gap-2 text-xs"
        >
          <Layers size={14} />
          Master ledger
        </Button>
      </div>
    </div>
  );
}
