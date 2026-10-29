import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useStores, useStore } from '@/features/stores';
import { cn } from '@/shared/lib/cn';
import {
  LayoutGrid,
  CreditCard,
  Receipt,
  Package,
  BarChart3,
  Menu,
  X,
  Store,
  ChevronDown,
  LogOut,
  ExternalLink,
  Users,
  Check,
  Smartphone,
  Armchair,
} from 'lucide-react';

export function AdminConsoleLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { storeCode: paramStoreCode } = useParams();
  const { user, signOut } = useAuth();
  const { data: stores = [] } = useStores();

  // Mobile drawer open state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Profile dropdown menu state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Store switcher dropdown menu state
  const [isStoreSwitcherOpen, setIsStoreSwitcherOpen] = useState(false);
  const storeSwitcherRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (storeSwitcherRef.current && !storeSwitcherRef.current.contains(event.target)) {
        setIsStoreSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Live real-time digital clock
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
    setIsProfileMenuOpen(false);
    setIsStoreSwitcherOpen(false);
  }

  // Global vs Store context
  const isStoreRoute = Boolean(paramStoreCode);
  const isLauncherActive = path === '/admin' || path === '/admin/';
  const isStaffActive = path.startsWith('/admin/staff');

  const currentStoreCode = paramStoreCode || stores[0]?.code || 'furniture-electronics';
  const { data: currentStore } = useStore(currentStoreCode);

  const basePath = `/admin/${currentStoreCode}`;
  const isDashboardActive = isStoreRoute && (path === basePath || path === `${basePath}/` || path === `${basePath}/dashboard`);
  const isBillingActive = isStoreRoute && path === `${basePath}/billing`;
  const isInvoicesActive = (isStoreRoute && path.startsWith(`${basePath}/invoices`)) || path === '/admin/invoices';
  const isInventoryActive = isStoreRoute && path.startsWith(`${basePath}/inventory`);
  const isReportsActive = isStoreRoute && path.startsWith(`${basePath}/reports`);

  const activeStoreName = isStoreRoute
    ? (currentStore?.name || stores.find((s) => s.code === currentStoreCode)?.name || 'Store Workspace')
    : 'All Stores';

  const userName = user?.user_metadata?.full_name || 'Store Owner';
  const userInitials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SE';

  return (
    <div className="h-screen bg-console-bg text-text flex font-sans overflow-hidden w-full max-w-full">
      {/* Mobile Backdrop Overlay */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* SIDE DRAWER - Crisp Enterprise Navigation Shell */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-bg text-sidebar-text flex flex-col justify-between transition-transform duration-200 ease-in-out border-r border-sidebar-border select-none h-screen',
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col">
          <div className="h-16 px-5 flex items-center justify-between border-b border-sidebar-border shrink-0">
            <Link to="/admin" className="flex items-center gap-3 min-w-0" title="Return to Stores Launcher">
              <div className="w-8 h-8 rounded-lg bg-accent text-accent-fg font-semibold flex items-center justify-center text-xs shadow-2xs shrink-0">
                SE
              </div>
              <div className="min-w-0">
                <div className="text-text font-semibold text-sm tracking-tight leading-tight truncate">
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
              className="lg:hidden p-1.5 text-muted hover:text-text rounded-md cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav onClick={handleNavClick} className="p-3 space-y-1 overflow-y-auto">
            {/* Global Enterprise Navigation */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Enterprise
              </div>

              <Link
                to="/admin"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors',
                  isLauncherActive
                    ? 'bg-sidebar-active text-sidebar-active-fg font-semibold border border-border shadow-2xs'
                    : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface font-medium'
                )}
              >
                <Store size={15} className="shrink-0" />
                <span>Store Launcher</span>
              </Link>

              <Link
                to="/admin/staff"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors',
                  isStaffActive
                    ? 'bg-sidebar-active text-sidebar-active-fg font-semibold border border-border shadow-2xs'
                    : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface font-medium'
                )}
              >
                <Users size={15} className="shrink-0" />
                <span>Staff Management (HRMS)</span>
              </Link>

              <Link
                to="/admin/invoices"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors',
                  path === '/admin/invoices'
                    ? 'bg-sidebar-active text-sidebar-active-fg font-semibold border border-border shadow-2xs'
                    : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface font-medium'
                )}
              >
                <Receipt size={15} className="shrink-0" />
                <span>All Bills (Editable)</span>
              </Link>
            </div>

            {/* Store-Specific Workspace Navigation */}
            {isStoreRoute ? (
              <div className="pt-3 mt-3 border-t border-sidebar-border space-y-1">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted truncate">
                  {activeStoreName}
                </div>

                {/* 1. Dashboard */}
                <Link
                  to={basePath}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors',
                    isDashboardActive
                      ? 'bg-sidebar-active text-sidebar-active-fg font-semibold border border-border shadow-2xs'
                      : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface font-medium'
                  )}
                >
                  <LayoutGrid size={15} className="shrink-0" />
                  <span>Dashboard</span>
                </Link>

                {/* 2. Billing (POS) */}
                <Link
                  to={`${basePath}/billing`}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors',
                    isBillingActive
                      ? 'bg-sidebar-active text-sidebar-active-fg font-semibold border border-border shadow-2xs'
                      : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface font-medium'
                  )}
                >
                  <CreditCard size={15} className="shrink-0" />
                  <span>Billing (POS)</span>
                </Link>

                {/* 3. Bills & Invoices (Editable) */}
                <Link
                  to={`${basePath}/invoices`}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors',
                    isInvoicesActive && isStoreRoute
                      ? 'bg-sidebar-active text-sidebar-active-fg font-semibold border border-border shadow-2xs'
                      : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface font-medium'
                  )}
                >
                  <Receipt size={15} className="shrink-0" />
                  <span>Bills & Invoices</span>
                </Link>

                {/* 4. Inventory */}
                <Link
                  to={`${basePath}/inventory`}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors',
                    isInventoryActive
                      ? 'bg-sidebar-active text-sidebar-active-fg font-semibold border border-border shadow-2xs'
                      : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface font-medium'
                  )}
                >
                  <Package size={15} className="shrink-0" />
                  <span>Inventory & Stock</span>
                </Link>

                {/* 4. Reports */}
                <Link
                  to={`${basePath}/reports`}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors',
                    isReportsActive
                      ? 'bg-sidebar-active text-sidebar-active-fg font-semibold border border-border shadow-2xs'
                      : 'text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface font-medium'
                  )}
                >
                  <BarChart3 size={15} className="shrink-0" />
                  <span>Reports & Tax</span>
                </Link>
              </div>
            ) : (
              /* Global mode: List all active store workspaces for quick access */
              <div className="pt-3 mt-3 border-t border-sidebar-border space-y-1">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Store Workspaces
                </div>
                {stores.map((s) => (
                  <Link
                    key={s.id || s.code}
                    to={`/admin/${s.code}`}
                    onClick={handleNavClick}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-sidebar-text hover:text-sidebar-text-hover hover:bg-sidebar-surface transition-colors font-medium"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-brand-sage shrink-0" />
                      <span className="truncate">{s.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Status Indicator */}
        <div className="p-3 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-muted">
            <span className="w-2 h-2 rounded-full bg-brand-sage shrink-0" />
            <span className="truncate text-[11px] font-medium">Console v2.0 • Active</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:pl-64 flex flex-col h-screen min-w-0 overflow-hidden w-full max-w-full">
        {/* TOP HEADER BAR - Clean Solid Bar without Banned Glassmorphism */}
        <header className="h-16 shrink-0 bg-surface border-b border-border z-30 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
          {/* Left: Mobile Toggle & In-Header Store Switcher Dropdown */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button for mobile */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-border bg-surface text-text hover:bg-surface-subtle cursor-pointer"
              aria-label="Open side drawer"
            >
              <Menu size={18} />
            </button>

            {/* Interactive In-Header Store Context Switcher */}
            <div className="relative" ref={storeSwitcherRef}>
              <button
                type="button"
                onClick={() => setIsStoreSwitcherOpen((prev) => !prev)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs select-none',
                  isStoreSwitcherOpen
                    ? 'border-border-strong bg-surface-subtle'
                    : 'border-border bg-surface hover:bg-surface-subtle text-text'
                )}
                title="Switch Store Workspace"
                aria-expanded={isStoreSwitcherOpen}
              >
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-brand-sage shrink-0">
                  {currentStoreCode === 'mobiles' ? <Smartphone size={14} /> : <Armchair size={14} />}
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-muted leading-tight">
                    {isStoreRoute ? 'STORE WORKSPACE' : 'ENTERPRISE SCOPE'}
                  </div>
                  <div className="text-xs font-semibold text-text truncate max-w-44 sm:max-w-64 leading-tight">
                    {activeStoreName}
                  </div>
                </div>
                <ChevronDown
                  size={13}
                  className={cn(
                    'text-muted transition-transform duration-150',
                    isStoreSwitcherOpen && 'rotate-180 text-text'
                  )}
                />
              </button>

              {/* Store Switcher Dropdown Menu */}
              {isStoreSwitcherOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl border border-border bg-surface shadow-lg py-1.5 z-50 animate-in fade-in duration-100">
                  <div className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted border-b border-border">
                    Select Workspace
                  </div>

                  <div className="py-1">
                    {stores.map((s) => {
                      const isSelected = isStoreRoute && currentStoreCode === s.code;
                      return (
                        <Link
                          key={s.id || s.code}
                          to={`/admin/${s.code}`}
                          onClick={() => setIsStoreSwitcherOpen(false)}
                          className={cn(
                            'flex items-center justify-between px-3.5 py-2 text-xs transition-colors',
                            isSelected
                              ? 'bg-surface-subtle font-semibold text-text'
                              : 'text-muted hover:text-text hover:bg-surface-subtle'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {s.code === 'mobiles' ? (
                              <Smartphone size={14} className="text-muted shrink-0" />
                            ) : (
                              <Armchair size={14} className="text-muted shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate leading-tight">{s.name}</p>
                              <p className="text-[10px] text-muted leading-tight mt-0.5">{s.city} • Branch</p>
                            </div>
                          </div>
                          {isSelected && <Check size={14} className="text-brand-sage shrink-0" />}
                        </Link>
                      );
                    })}

                    <div className="pt-1 mt-1 border-t border-border">
                      <Link
                        to="/admin"
                        onClick={() => setIsStoreSwitcherOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-3.5 py-2 text-xs transition-colors',
                          isLauncherActive
                            ? 'bg-surface-subtle font-semibold text-text'
                            : 'text-muted hover:text-text hover:bg-surface-subtle'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Store size={14} className="text-muted shrink-0" />
                          <span>All Stores Overview</span>
                        </div>
                        {isLauncherActive && <Check size={14} className="text-brand-sage shrink-0" />}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Header Items / Nav Menu */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Clock */}
            <div className="text-xs font-mono font-medium text-muted px-2 py-1 select-none">
              {currentTime}
            </div>

            {/* User Profile Dropdown Trigger */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs select-none',
                  isProfileMenuOpen
                    ? 'border-border-strong bg-surface-subtle'
                    : 'border-border bg-surface hover:bg-surface-subtle text-text'
                )}
                title="Account Menu"
                aria-expanded={isProfileMenuOpen}
              >
                <div className="w-6 h-6 rounded-md bg-accent text-accent-fg font-semibold text-[11px] flex items-center justify-center shrink-0">
                  {userInitials}
                </div>
                <span className="hidden sm:inline-block text-xs font-medium">Owner / Admin</span>
                <ChevronDown
                  size={13}
                  className={cn(
                    'text-muted transition-transform duration-150',
                    isProfileMenuOpen && 'rotate-180 text-text'
                  )}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface shadow-lg py-1.5 z-50 animate-in fade-in duration-100">
                  <div className="px-3.5 py-2.5 border-b border-border">
                    <p className="text-xs font-semibold text-text truncate">{userName}</p>
                    <p className="text-[10px] text-muted truncate mt-0.5">Owner • {activeStoreName}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/admin"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-text hover:bg-surface-subtle transition-colors"
                    >
                      <Store size={14} className="text-muted" />
                      <span>Store Launcher</span>
                    </Link>

                    <Link
                      to="/"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-text hover:bg-surface-subtle transition-colors"
                    >
                      <ExternalLink size={14} className="text-muted" />
                      <span>Public Storefront</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-border">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        await signOut();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-danger hover:bg-danger/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body - Smooth independent vertical scrolling */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 min-w-0 w-full max-w-full">
          <div className="w-full max-w-7xl mx-auto space-y-6 min-w-0">
            <Outlet context={{ store: currentStore, storeCode: currentStoreCode }} />
          </div>
        </main>
      </div>
    </div>
  );
}
