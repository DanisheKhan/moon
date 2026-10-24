import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useStores, useStore } from '@/features/stores';
import { cn } from '@/shared/lib/cn';
import {
  LayoutGrid,
  CreditCard,
  Package,
  BarChart3,
  Settings,
  Menu,
  X,
  Store,
  ArrowLeft,
} from 'lucide-react';

export function AdminConsoleLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { storeCode: paramStoreCode } = useParams();
  const { user } = useAuth();
  const { data: stores = [] } = useStores();

  // Mobile drawer open state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Determine current active store
  const currentStoreCode = paramStoreCode || stores[0]?.code || 'mobiles';
  const { data: currentStore } = useStore(currentStoreCode);

  // Live real-time digital clock (e.g. 11:52)
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  function handleNavClick() {
    setIsMobileDrawerOpen(false);
  }

  // Active path helpers
  const path = location.pathname;
  const basePath = `/admin/${currentStoreCode}`;
  const isDashboardActive = path === basePath || path === `${basePath}/` || path === `${basePath}/dashboard`;
  const isBillingActive = path.startsWith(`${basePath}/billing`) || path.includes('/invoices');
  const isInventoryActive = path.startsWith(`${basePath}/inventory`);
  const isReportsActive = path.startsWith(`${basePath}/reports`);
  const isSettingsActive = path.startsWith(`${basePath}/settings`);

  const activeStoreName = currentStore?.name || stores.find((s) => s.code === currentStoreCode)?.name || 'Star Mobiles';
  const userName = user?.user_metadata?.full_name || 'Sami';
  const userInitials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SA';

  return (
    <div className="min-h-screen bg-console-bg text-text flex font-sans">
      {/* Mobile Backdrop Overlay */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* SIDE DRAWER - Cohesive Light Theme matching Website Canvas */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-bg text-sidebar-text flex flex-col justify-between transition-transform duration-200 ease-in-out border-r border-border select-none',
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col">
          <div className="h-16 px-5 flex items-center justify-between border-b border-border">
            <Link to={basePath} className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-text text-bg font-medium flex items-center justify-center text-xs shadow-2xs shrink-0">
                SE
              </div>
              <div className="min-w-0">
                <div className="text-text font-medium text-sm tracking-tight leading-tight truncate">
                  Star Enterprises
                </div>
                <div className="text-muted text-[10px] font-medium tracking-wider uppercase">
                  OPERATIONS CONSOLE
                </div>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="lg:hidden p-1 text-sidebar-text hover:text-text rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav onClick={handleNavClick} className="p-3 space-y-1 overflow-y-auto">
            {/* 1. Dashboard Tab */}
            <Link
              to={basePath}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-colors',
                isDashboardActive
                  ? 'bg-sidebar-active text-sidebar-active-fg font-medium border border-sidebar-border shadow-2xs'
                  : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface font-normal'
              )}
            >
              <LayoutGrid size={16} className="shrink-0" />
              <span>Dashboard</span>
            </Link>

            {/* 2. Billing Tab */}
            <Link
              to={`${basePath}/billing`}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-colors',
                isBillingActive
                  ? 'bg-sidebar-active text-sidebar-active-fg font-medium border border-sidebar-border shadow-2xs'
                  : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface font-normal'
              )}
            >
              <CreditCard size={16} className="shrink-0" />
              <span>Billing</span>
            </Link>

            {/* 3. Inventory Tab */}
            <Link
              to={`${basePath}/inventory`}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-colors',
                isInventoryActive
                  ? 'bg-sidebar-active text-sidebar-active-fg font-medium border border-sidebar-border shadow-2xs'
                  : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface font-normal'
              )}
            >
              <Package size={16} className="shrink-0" />
              <span>Inventory</span>
            </Link>



            {/* 5. Reports Tab */}
            <Link
              to={`${basePath}/reports`}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-colors',
                isReportsActive
                  ? 'bg-sidebar-active text-sidebar-active-fg font-medium border border-sidebar-border shadow-2xs'
                  : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface font-normal'
              )}
            >
              <BarChart3 size={16} className="shrink-0" />
              <span>Reports</span>
            </Link>

            {/* 6. Settings Tab */}
            <Link
              to={`${basePath}/settings`}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-colors',
                isSettingsActive
                  ? 'bg-sidebar-active text-sidebar-active-fg font-medium border border-sidebar-border shadow-2xs'
                  : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface font-normal'
              )}
            >
              <Settings size={16} className="shrink-0" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* TOP HEADER BAR */}
        <header className="h-16 bg-surface border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
          {/* Left: Mobile Toggle, Launcher Link & Locked Current Store Pill */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button for mobile */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-border bg-bg text-text hover:bg-surface cursor-pointer"
              aria-label="Open side drawer"
            >
              <Menu size={18} />
            </button>

            {/* Back to 3 Stores Launcher Card Button */}
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-bg text-muted hover:text-text text-xs font-medium transition-colors shrink-0"
              title="Return to 3 Stores Launcher"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Store Launcher</span>
            </Link>

            {/* Current Store Pill (Consistent with website layout) */}
            <div className="bg-bg border border-border rounded-lg px-3 py-1.5 flex items-center gap-2.5 shadow-2xs select-none">
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-muted shrink-0">
                <Store size={14} />
              </div>
              <div className="min-w-0 pr-1">
                <div className="text-[9px] font-medium uppercase tracking-wider text-muted leading-tight">
                  CURRENT STORE
                </div>
                <div className="text-xs font-medium text-text truncate max-w-36 sm:max-w-64 leading-tight">
                  {activeStoreName}
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Items */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Clock */}
            <div className="text-xs font-mono font-medium text-muted px-2 py-1">
              {currentTime}
            </div>

            {/* Owner / Admin Pill Badge */}
            <span className="bg-bg text-text border border-border font-medium text-xs px-2.5 py-1 rounded-lg shadow-2xs select-none">
              Owner / Admin
            </span>

            {/* User Initials Avatar Badge */}
            <button
              type="button"
              onClick={() => navigate(`${basePath}/settings`)}
              className="w-8 h-8 rounded-lg bg-text text-bg font-medium text-xs flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shadow-2xs"
              title="Console Settings"
            >
              {userInitials}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 sm:p-8 min-w-0 max-w-7xl w-full mx-auto space-y-6">
          <Outlet context={{ store: currentStore, storeCode: currentStoreCode }} />
        </main>
      </div>
    </div>
  );
}
