import { Suspense } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart, CartDrawer } from '@/features/catalog';
import { Button } from '@/shared/ui';
import { SITE } from '@/shared/lib/site';
import { ShoppingBag, Phone, Shield } from 'lucide-react';

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalCount, setIsCartOpen } = useCart();

  const isPublicPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans overflow-x-hidden">
      {/* Classic Fixed Header — full-width bar with bottom border */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface border-b border-border h-16">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">

          {/* Left: Logotype */}
          <div className="flex items-center shrink-0">
            <Link
              to={isPublicPage ? '/' : '/admin'}
              className="flex items-center gap-0 font-black tracking-tight text-sm sm:text-base leading-none"
            >
              <span className="text-brand-crimson font-black tracking-tight">STAR</span>
              <span className="text-text font-black tracking-tight ml-1">ENTERPRISES</span>
            </Link>
          </div>

          {/* Center: Classic text nav links (public only) */}
          {isPublicPage && (
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted">
              <a
                href="#catalog-grid-section"
                className="hover:text-text transition-colors border-b-2 border-transparent hover:border-brand-crimson pb-0.5"
              >
                Catalog
              </a>
              <a
                href="#departments-section"
                className="hover:text-text transition-colors border-b-2 border-transparent hover:border-brand-crimson pb-0.5"
              >
                Departments
              </a>
              <a
                href="#emi-calculator-section"
                className="hover:text-text transition-colors border-b-2 border-transparent hover:border-brand-crimson pb-0.5"
              >
                0% EMI
              </a>
              <a
                href="#showroom-section"
                className="hover:text-text transition-colors border-b-2 border-transparent hover:border-brand-crimson pb-0.5"
              >
                Showroom
              </a>
              <a
                href="#reviews-section"
                className="hover:text-text transition-colors border-b-2 border-transparent hover:border-brand-crimson pb-0.5"
              >
                Reviews
              </a>
            </nav>
          )}

          {/* Right: Actions */}
          {isPublicPage ? (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <a
                href={`tel:${SITE.supportPhone}`}
                className="hidden lg:flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors"
              >
                <Phone size={13} className="text-brand-crimson" />
                <span className="font-mono font-semibold">{SITE.displayPhone}</span>
              </a>

              {/* Cart Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCartOpen(true)}
                className="text-xs gap-1.5 cursor-pointer relative font-semibold border-border rounded-lg"
                aria-label="View shopping cart"
              >
                <ShoppingBag size={14} />
                <span>Cart</span>
                {totalCount > 0 && (
                  <span className="bg-brand-crimson text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                    {totalCount}
                  </span>
                )}
              </Button>

              {/* Owner Portal */}
              <Link
                to="/login"
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:text-text hover:bg-surface-hover transition-colors flex items-center gap-1.5 font-medium"
              >
                <Shield size={13} />
                <span className="hidden sm:inline">Owner Portal</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="text-xs px-3 rounded-lg"
                title="View Public Storefront"
              >
                <span className="hidden sm:inline">Storefront</span>
                <span className="sm:hidden">Store</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content — push below fixed 64px header */}
      <main className="flex-1 min-w-0 pt-16">
        <Suspense fallback={<div className="py-20 text-center text-muted">Loading page...</div>}>
          <Outlet />
        </Suspense>
      </main>

      {/* Cart Slider Drawer */}
      <CartDrawer />
    </div>
  );
}
