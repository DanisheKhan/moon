import { useState, useRef, useEffect, Suspense } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useStores } from '@/features/stores';
import { useCart, CartDrawer } from '@/features/catalog';
import { Container, Button } from '@/shared/ui';
import { SITE } from '@/shared/lib/site';
import { cn } from '@/shared/lib/cn';
import { LogOut, LayoutGrid, ShoppingBag, LogIn, Phone, Shield, Store, Users, ChevronDown, Check } from 'lucide-react';

function StoreSwitcher({ stores, currentStoreCode, isOwner, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Determine current active item label
  let activeLabel = 'Switch Workspace...';
  if (location.pathname === '/admin/all') {
    activeLabel = '★ All Stores Combined';
  } else if (location.pathname === '/admin/overview') {
    activeLabel = 'Network Overview';
  } else if (location.pathname.startsWith('/admin/staff')) {
    activeLabel = 'Staff Management';
  } else if (currentStoreCode) {
    const store = stores.find((s) => s.code === currentStoreCode);
    if (store) activeLabel = store.name;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-2 text-xs font-medium bg-bg border border-border rounded-lg px-3 py-1.5 text-text cursor-pointer',
          'hover:border-text/40 transition-all select-none',
          isOpen && 'border-accent ring-1 ring-accent shadow-2xs'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Store size={13} className="text-muted shrink-0" />
        <span className="truncate max-w-36 sm:max-w-52">{activeLabel}</span>
        <ChevronDown
          size={13}
          className={cn('text-muted transition-transform duration-200 shrink-0', isOpen && 'rotate-180 text-text')}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-64 bg-surface border border-border rounded-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 shadow-2xs">
          <div className="px-3 py-1.5 text-[10px] font-medium text-muted uppercase tracking-wider">
            Switch Store Workspace
          </div>
          <div className="space-y-0.5">
            {stores.map((s) => {
              const isSelected = currentStoreCode === s.code;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSelect(s.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs text-left cursor-pointer transition-colors select-none',
                    isSelected ? 'bg-bg font-medium text-text' : 'text-text hover:bg-bg/80'
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Store size={14} className={isSelected ? 'text-accent shrink-0' : 'text-muted shrink-0'} />
                    <span className="truncate">{s.name}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-text shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="my-1.5 border-t border-border" />

          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onSelect('staff');
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs text-left cursor-pointer transition-colors select-none',
                location.pathname.startsWith('/admin/staff') ? 'bg-bg font-medium text-text' : 'text-text hover:bg-bg/80'
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <Users size={14} className="text-muted shrink-0" />
                <span>Staff Management (HRMS)</span>
              </div>
              {location.pathname.startsWith('/admin/staff') && <Check size={14} className="text-text shrink-0" />}
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  onSelect('all');
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs text-left cursor-pointer transition-colors select-none',
                  location.pathname === '/admin/all' ? 'bg-bg font-medium text-text' : 'text-text hover:bg-bg/80'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-accent text-xs">★</span>
                  <span>All Stores Combined</span>
                </div>
                {location.pathname === '/admin/all' && <Check size={14} className="text-text shrink-0" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onSelect('launcher');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left cursor-pointer text-muted hover:text-text hover:bg-bg/80 transition-colors select-none"
            >
              <LayoutGrid size={14} className="shrink-0" />
              <span>Workspace Launcher</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isOwner, signOut } = useAuth();
  const { data: stores = [] } = useStores();
  const { totalCount, setIsCartOpen } = useCart();

  const isPublicPage = location.pathname === '/';

  // Find if currently in a store workspace
  const currentStoreMatch = location.pathname.match(/\/admin\/([^/]+)/);
  const currentStoreCode = currentStoreMatch ? currentStoreMatch[1] : null;

  function handleStoreChange(code) {
    if (code === 'launcher') {
      navigate('/admin');
    } else if (code === 'all') {
      navigate('/admin/all');
    } else if (code === 'staff') {
      navigate('/admin/staff');
    } else {
      navigate(`/admin/${code}`);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans overflow-x-hidden">
      {/* Top Application Bar */}
      <header className="border-b border-border bg-surface sticky top-0 z-40">
        <Container size="xl" className="h-14 flex items-center justify-between gap-4">
          {/* Left Brand */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link
              to={isPublicPage ? '/' : '/admin'}
              className="font-medium text-text tracking-tight flex items-center gap-2 shrink-0 text-xs sm:text-base"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block shrink-0" />
              <span className="truncate">STAR ENTERPRISES</span>
            </Link>

            {/* Admin Workspace Dropdown (Only on Admin Routes) */}
            {!isPublicPage && stores.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border">
                <span className="text-xs text-muted">Store:</span>
                <StoreSwitcher
                  stores={stores}
                  currentStoreCode={currentStoreCode}
                  isOwner={isOwner}
                  onSelect={handleStoreChange}
                />
              </div>
            )}
          </div>

          {/* Right Actions */}
          {isPublicPage ? (
            /* Public Storefront Actions */
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <a
                href={`https://wa.me/${SITE.whatsappPhone}`}
                target="_blank"
                rel="noreferrer"
                className="hidden md:flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors mr-1"
              >
                <Phone size={13} />
                <span>+91 98200 12345</span>
              </a>

              {/* Cart Drawer Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCartOpen(true)}
                className="text-xs gap-1.5 cursor-pointer relative"
                aria-label="View shopping cart"
              >
                <ShoppingBag size={14} />
                <span>Cart</span>
                {totalCount > 0 && (
                  <span className="bg-accent text-accent-fg text-[10px] font-medium px-1.5 py-0.2 rounded-md ml-0.5">
                    {totalCount}
                  </span>
                )}
              </Button>

              {/* Discreet Owner Portal Link */}
              <Link
                to="/login"
                className="text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border border-border text-muted hover:text-text hover:bg-bg transition-colors flex items-center gap-1.5 font-medium"
              >
                <Shield size={13} />
                <span className="hidden sm:inline">Owner Portal</span>
              </Link>
            </div>
          ) : (
            /* Admin & Workspace Actions */
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="text-xs px-2.5 sm:px-3"
                title="View Public Storefront"
              >
                <span className="hidden sm:inline">Storefront</span>
                <span className="sm:hidden">Store</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-xs px-2.5 sm:px-3"
                title="Return to Launcher"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Launcher</span>
              </Button>

              {user ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  className="text-xs px-2.5 sm:px-3"
                  title="Sign Out"
                >
                  <LogOut size={13} />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="text-xs px-2.5 sm:px-3"
                  title="Sign In"
                >
                  <LogIn size={13} />
                </Button>
              )}
            </div>
          )}
        </Container>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <Suspense fallback={<div className="py-20 text-center text-muted">Loading page...</div>}>
          <Outlet />
        </Suspense>
      </main>

      {/* Cart Drawer for Public Browsing */}
      {isPublicPage && <CartDrawer />}
    </div>
  );
}
