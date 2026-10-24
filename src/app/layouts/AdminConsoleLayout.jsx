import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useStores, useStore } from '@/features/stores';
import { cn } from '@/shared/lib/cn';
import {
  LayoutGrid,
  CreditCard,
  Package,
  Users,
  CalendarCheck,
  ShieldCheck,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Store,
  ArrowLeft,
} from 'lucide-react';

export function AdminConsoleLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { storeCode: paramStoreCode } = useParams();
  const { user, signOut } = useAuth();
  const { data: stores = [] } = useStores();

  // Mobile drawer open state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Determine current active store
  const currentStoreCode = paramStoreCode || stores[0]?.code || 'mobiles';
  const { data: currentStore } = useStore(currentStoreCode);

  // Staff dropdown accordion state
  const isStaffRoute = location.pathname.includes('/staff');
  const [userToggledStaff, setUserToggledStaff] = useState(null);
  const isStaffMenuOpen = userToggledStaff !== null ? userToggledStaff : isStaffRoute || true;

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
  const isStaffDirectoryActive = path === `${basePath}/staff`;
  const isAttendanceActive = path === `${basePath}/staff/attendance`;
  const isRolesActive = path === `${basePath}/staff/roles`;
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

      {/* SIDE DRAWER - Deep Navy with White Active Highlight */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-bg text-sidebar-text flex flex-col justify-between transition-transform duration-200 ease-in-out border-r border-sidebar-border select-none',
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col">
          <div className="p-5 flex items-center justify-between border-b border-sidebar-border">
            <Link to={basePath} className="flex items-center gap-3 min-w-0">
              {/* White rounded badge with dark text (zero yellow) */}
              <div className="w-9 h-9 rounded-lg bg-white text-slate-950 font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                SE
              </div>
              <div className="min-w-0">
                <div className="text-white font-bold text-sm tracking-tight leading-tight truncate">
                  Star Enterprises
                </div>
                <div className="text-sidebar-text text-[9px] font-bold tracking-widest uppercase">
                  OPERATIONS CONSOLE
                </div>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="lg:hidden p-1 text-sidebar-text hover:text-white rounded-lg cursor-pointer"
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
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors',
                isDashboardActive
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-sidebar-text hover:text-white hover:bg-sidebar-surface'
              )}
            >
              <LayoutGrid size={16} className="shrink-0" />
              <span>Dashboard</span>
            </Link>

            {/* 2. Billing Tab */}
            <Link
              to={`${basePath}/billing`}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors',
                isBillingActive
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-sidebar-text hover:text-white hover:bg-sidebar-surface'
              )}
            >
              <CreditCard size={16} className="shrink-0" />
              <span>Billing</span>
            </Link>

            {/* 3. Inventory Tab (Card Format) */}
            <Link
              to={`${basePath}/inventory`}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors',
                isInventoryActive
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-sidebar-text hover:text-white hover:bg-sidebar-surface'
              )}
            >
              <Package size={16} className="shrink-0" />
              <span>Inventory</span>
            </Link>

            {/* 4. Staff Tab (Accordion with Attendance & Roles Permissions) */}
            <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setUserToggledStaff(!isStaffMenuOpen)}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left',
                  isStaffRoute && !isStaffMenuOpen
                    ? 'bg-sidebar-surface text-white'
                    : 'text-sidebar-text hover:text-white hover:bg-sidebar-surface'
                )}
              >
                <div className="flex items-center gap-3">
                  <Users size={16} className="shrink-0" />
                  <span>Staff</span>
                </div>
                <ChevronDown
                  size={14}
                  className={cn(
                    'transition-transform duration-200 text-sidebar-text',
                    isStaffMenuOpen && 'rotate-180 text-white'
                  )}
                />
              </button>

              {/* Sub-menu: Staff Directory, Attendance, Roles & Permissions */}
              {isStaffMenuOpen && (
                <div className="pl-4 pr-1 space-y-1 py-1">
                  {/* Staff Directory */}
                  <Link
                    to={`${basePath}/staff`}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      isStaffDirectoryActive
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-sidebar-text hover:text-white hover:bg-sidebar-surface/70'
                    )}
                  >
                    <Users size={14} className="shrink-0" />
                    <span>Staff Directory</span>
                  </Link>

                  {/* Attendance Sub-tab */}
                  <Link
                    to={`${basePath}/staff/attendance`}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      isAttendanceActive
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-sidebar-text hover:text-white hover:bg-sidebar-surface/70'
                    )}
                  >
                    <CalendarCheck size={14} className="shrink-0" />
                    <span>Attendance</span>
                  </Link>

                  {/* Roles & Permissions Sub-tab */}
                  <Link
                    to={`${basePath}/staff/roles`}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      isRolesActive
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-sidebar-text hover:text-white hover:bg-sidebar-surface/70'
                    )}
                  >
                    <ShieldCheck size={14} className="shrink-0" />
                    <span>Roles & Permissions</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 5. Reports Tab */}
            <Link
              to={`${basePath}/reports`}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors',
                isReportsActive
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-sidebar-text hover:text-white hover:bg-sidebar-surface'
              )}
            >
              <BarChart3 size={16} className="shrink-0" />
              <span>Reports</span>
            </Link>

            {/* 6. Settings Tab */}
            <Link
              to={`${basePath}/settings`}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors',
                isSettingsActive
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-sidebar-text hover:text-white hover:bg-sidebar-surface'
              )}
            >
              <Settings size={16} className="shrink-0" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Profile Section */}
        <div className="p-5 border-t border-sidebar-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-sidebar-text">
                OWNER / ADMIN
              </div>
              <div className="text-sm font-bold text-white truncate">{userName}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
            className="flex items-center gap-2 text-xs font-semibold text-sidebar-text hover:text-white transition-colors cursor-pointer w-full text-left"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-bg hover:bg-surface text-muted hover:text-text text-xs font-semibold transition-colors shrink-0"
              title="Return to 3 Stores Launcher"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Store Launcher</span>
            </Link>

            {/* Current Store Pill (Store-isolated, no switcher dropdown) */}
            <div className="bg-pastel-amber border border-pastel-amber-border rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-2xs select-none">
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-muted shrink-0">
                <Store size={15} />
              </div>
              <div className="min-w-0 pr-1">
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-muted leading-tight">
                  CURRENT STORE
                </div>
                <div className="text-xs font-bold text-text truncate max-w-36 sm:max-w-64 leading-tight">
                  {activeStoreName}
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Items (Zero Yellow) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Clock e.g. 11:52 */}
            <div className="text-xs sm:text-sm font-bold font-mono text-text tracking-wider">
              {currentTime}
            </div>

            {/* Owner / Admin Pill Badge (White with dark text) */}
            <span className="bg-white text-slate-900 border border-border font-bold text-xs px-3 py-1 rounded-md shadow-2xs select-none">
              Owner / Admin
            </span>

            {/* User Initials Avatar Badge */}
            <button
              type="button"
              onClick={() => navigate(`${basePath}/settings`)}
              className="w-8 h-8 rounded-md bg-sidebar-bg text-white font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-sidebar-surface transition-colors shadow-2xs"
              title="Console Settings"
            >
              {userInitials}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-7xl w-full mx-auto">
          <Outlet context={{ store: currentStore, storeCode: currentStoreCode }} />
        </main>
      </div>
    </div>
  );
}
