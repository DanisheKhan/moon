import { Suspense } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart, CartDrawer } from '@/features/catalog';
import { Container, Button } from '@/shared/ui';
import { SITE } from '@/shared/lib/site';
import { ShoppingBag, Phone, Shield } from 'lucide-react';

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalCount, setIsCartOpen } = useCart();

  const isPublicPage = location.pathname === '/';

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
