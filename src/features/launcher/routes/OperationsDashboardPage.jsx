import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useStores } from '@/features/stores';
import { Modal, Button, Input } from '@/shared/ui';
import {
  Home,
  Building,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react';

const INITIAL_STORES = [
  {
    id: 'store-1',
    code: 'SM',
    name: 'Star Mobiles & Electronics',
    subtext: 'Flagship Branch',
    station: 'Station Road',
    platform: 'Mobiles & Gadgets',
    hours: '10:00 – 22:00',
    gstin: 'GSTIN27AABCS1429B1Z1',
    status: 'active',
    avatarBg: 'bg-pastel-amber text-pastel-amber-text border-pastel-amber-border',
  },
  {
    id: 'store-2',
    code: 'SF',
    name: 'Star Furniture & Living',
    subtext: 'Plaza Terminal Branch',
    station: 'Central Avenue',
    platform: 'Modern Furniture',
    hours: '10:30 – 21:30',
    gstin: 'GSTIN27AABCS1429B2Z2',
    status: 'active',
    avatarBg: 'bg-pastel-purple text-pastel-purple-text border-pastel-purple-border',
  },
  {
    id: 'store-3',
    code: 'WD',
    name: 'West End Distribution Depot',
    subtext: 'Logistics Hub',
    station: 'Industrial Ring',
    platform: 'Warehouse Spares',
    hours: '08:00 – 20:00',
    gstin: 'GSTIN27AABCS1429B3Z3',
    status: 'inactive',
    avatarBg: 'bg-pastel-mint text-pastel-mint-text border-pastel-mint-border',
  },
];

export function OperationsDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stores = [] } = useStores();

  const [storeList, setStoreList] = useState(INITIAL_STORES);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [station, setStation] = useState('');
  const [platform, setPlatform] = useState('');
  const [hours, setHours] = useState('10:00 – 22:00');
  const [gstin, setGstin] = useState('');
  const [status, setStatus] = useState('active');

  const activeCount = storeList.filter((r) => r.status === 'active').length;
  const inactiveCount = storeList.filter((r) => r.status === 'inactive').length;
  const totalCount = storeList.length;
  const activePct = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

  function handleAddOrEdit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingItem) {
      setStoreList((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                name: name.trim(),
                station: station.trim() || 'Central',
                platform: platform.trim() || 'Retail Floor',
                hours: hours.trim() || '10:00 – 22:00',
                gstin: gstin.trim() || 'GSTIN27AABCS0000',
                status,
              }
            : item
        )
      );
      setEditingItem(null);
    } else {
      const initials = name
        .trim()
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const newItem = {
        id: `store-${Date.now()}`,
        code: initials || 'SE',
        name: name.trim(),
        subtext: station.trim().toLowerCase() || 'branch',
        station: station.trim() || 'Station Road',
        platform: platform.trim() || 'Retail Store',
        hours: hours.trim() || '10:00 – 22:00',
        gstin: gstin.trim() || 'GSTIN27AABCS' + Math.floor(1000 + Math.random() * 9000),
        status,
        avatarBg:
          status === 'active'
            ? 'bg-pastel-amber text-pastel-amber-text border-pastel-amber-border'
            : 'bg-pastel-purple text-pastel-purple-text border-pastel-purple-border',
      };
      setStoreList((prev) => [...prev, newItem]);
      setIsAddOpen(false);
    }

    // Reset
    setName('');
    setStation('');
    setPlatform('');
    setHours('10:00 – 22:00');
    setGstin('');
    setStatus('active');
  }

  function startEdit(item) {
    setEditingItem(item);
    setName(item.name);
    setStation(item.station);
    setPlatform(item.platform);
    setHours(item.hours);
    setGstin(item.gstin);
    setStatus(item.status);
  }

  function confirmDelete() {
    if (!deletingItem) return;
    setStoreList((prev) => prev.filter((r) => r.id !== deletingItem.id));
    setDeletingItem(null);
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome Header - Star Enterprises */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted block mb-1">
            STORE OPERATIONS REGISTER
          </span>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-text">
            Welcome, {user?.user_metadata?.full_name || 'Sami'}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Here's what is happening across your Star Enterprises store branches.
          </p>
        </div>

        {/* Clean button */}
        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setName('');
            setStation('');
            setPlatform('Retail Floor');
            setHours('10:00 – 22:00');
            setGstin('');
            setStatus('active');
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-text text-bg hover:opacity-90 font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-all cursor-pointer shrink-0 shadow-xs"
        >
          <Plus size={16} />
          <span>+ Add new Store</span>
        </button>
      </div>

      {/* Three Stat Cards - Total Stores, Active, Inactive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Total Stores */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-medium text-muted tracking-wider block">
              TOTAL STORES
            </span>
            <div className="text-3xl sm:text-4xl font-medium tracking-tight text-text">{totalCount}</div>
            <span className="text-xs text-muted block">{totalCount} registered branches</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-muted shrink-0">
            <Home size={18} />
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-medium text-muted tracking-wider block">
              ACTIVE
            </span>
            <div className="text-3xl sm:text-4xl font-medium tracking-tight text-text">{activeCount}</div>
            <span className="text-xs text-muted block">{activePct}% operational</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-muted shrink-0">
            <Building size={18} />
          </div>
        </div>

        {/* Card 3: Inactive */}
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs flex items-start justify-between min-w-0">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-medium text-muted tracking-wider block">
              INACTIVE
            </span>
            <div className="text-3xl sm:text-4xl font-medium tracking-tight text-text">{inactiveCount}</div>
            <span className="text-xs text-muted block">Awaiting administrator</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-muted shrink-0">
            <MapPin size={18} />
          </div>
        </div>
      </div>

      {/* Stores Register Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg/40 border-b border-border text-muted font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-medium">STORE</th>
                <th className="py-3.5 px-4 font-medium">LOCATION</th>
                <th className="py-3.5 px-4 font-medium">CATEGORY</th>
                <th className="py-3.5 px-4 font-medium">OPERATING HOURS</th>
                <th className="py-3.5 px-4 font-medium">GST</th>
                <th className="py-3.5 px-4 font-medium">STATUS</th>
                <th className="py-3.5 px-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {storeList.map((item) => (
                <tr key={item.id} className="hover:bg-bg/40 transition-colors">
                  {/* Store Name & Code */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center font-medium text-xs uppercase shrink-0 ${item.avatarBg}`}
                      >
                        {item.code}
                      </div>
                      <div>
                        <div className="font-medium text-text text-sm leading-tight">{item.name}</div>
                        <div className="text-[11px] text-muted">{item.subtext}</div>
                      </div>
                    </div>
                  </td>

                  {/* LOCATION */}
                  <td className="py-4 px-4">
                    <span className="font-medium text-text text-xs">{item.station}</span>
                  </td>

                  {/* CATEGORY */}
                  <td className="py-4 px-4">
                    <span className="font-medium text-text text-xs">{item.platform}</span>
                  </td>

                  {/* OPERATING HOURS */}
                  <td className="py-4 px-4 font-mono text-xs text-text">
                    {item.hours}
                  </td>

                  {/* GST */}
                  <td className="py-4 px-4 font-mono text-xs font-medium text-text">
                    {item.gstin}
                  </td>

                  {/* STATUS */}
                  <td className="py-4 px-4">
                    {item.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium bg-pastel-mint text-pastel-mint-text border border-pastel-mint-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium bg-pastel-amber text-pastel-amber-text border border-pastel-amber-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        INACTIVE
                      </span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="py-4 px-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="w-8 h-8 rounded-lg border border-border bg-bg/80 hover:bg-surface text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer"
                        title="Edit Store Information"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        className="w-8 h-8 rounded-lg border border-border bg-bg/80 hover:bg-danger/10 text-muted hover:text-danger flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete Store"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer row */}
        <div className="p-3.5 border-t border-border bg-bg/30 flex items-center justify-between text-xs text-muted">
          <span className="font-medium text-text">
            Showing {storeList.length} of {storeList.length} registered Stores
          </span>
          <span className="font-medium text-text">All stores synchronized</span>
        </div>
      </div>

      {/* Real Branches & Stores Quick Launchers */}
      {stores.length > 0 && (
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-text uppercase tracking-wider text-[11px]">
              Direct Store Workspaces
            </span>
            <span className="text-muted">Launch POS Terminals</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stores.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/admin/${s.code}/billing`)}
                className="p-3.5 rounded-lg border border-border bg-bg/60 hover:bg-surface hover:border-text/30 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-medium text-text text-xs">{s.name}</div>
                  <div className="text-[11px] text-muted font-mono">{s.gstin}</div>
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-medium text-text">
                  <span>Open POS</span>
                  <ExternalLink size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Store Modal */}
      {(isAddOpen || editingItem) && (
        <Modal
          isOpen={isAddOpen || Boolean(editingItem)}
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
          title={editingItem ? `Edit Store: ${editingItem.name}` : 'Add New Store Branch'}
          size="md"
        >
          <form onSubmit={handleAddOrEdit} className="space-y-4 text-text min-w-0">
            <Input
              id="store-name"
              label="Store Branch Name"
              placeholder="e.g. Star Mobiles & Electronics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="store-station"
                label="City / Location"
                placeholder="e.g. Station Road"
                value={station}
                onChange={(e) => setStation(e.target.value)}
                required
              />
              <Input
                id="store-platform"
                label="Department / Category"
                placeholder="e.g. Electronics & Mobiles"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="store-hours"
                label="Operating Hours"
                placeholder="e.g. 10:00 – 22:00"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
              <Input
                id="store-gstin"
                label="GSTIN Identifier"
                placeholder="e.g. GSTIN27AABCS1429B1Z1"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted block">Operational Status</label>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="store-status"
                    checked={status === 'active'}
                    onChange={() => setStatus('active')}
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="store-status"
                    checked={status === 'inactive'}
                    onChange={() => setStatus('inactive')}
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingItem(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="solid">
                {editingItem ? 'Save Changes' : 'Create Store'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <Modal
          isOpen={Boolean(deletingItem)}
          onClose={() => setDeletingItem(null)}
          title="Delete Store Branch"
          size="sm"
        >
          <div className="space-y-4 text-text min-w-0">
            <p className="text-xs text-muted">
              Are you sure you want to remove <span className="font-medium text-text">"{deletingItem.name}"</span> from the store register?
            </p>
            <div className="pt-2 border-t border-border flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeletingItem(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="solid"
                onClick={confirmDelete}
                className="bg-danger hover:bg-danger/90 text-white"
              >
                Delete Store
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
