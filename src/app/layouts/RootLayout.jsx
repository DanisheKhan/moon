import { Suspense, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart, CartDrawer } from '@/features/catalog';
import { Button } from '@/shared/ui';
import { SITE } from '@/shared/lib/site';
import { ShoppingBag, Phone, Shield, Menu, X } from 'lucide-react';

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalCount, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);

  // Auto-close mobile navigation when navigating to a different route
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setIsMobileMenuOpen(false);
  }

  const isPublicPage = location.pathname === '/';

  const navLinks = [
    { href: '#catalog-grid-section', label: 'Catalog' },
    { href: '#departments-section', label: 'Departments' },
    { href: '#emi-calculator-section', label: '0% EMI' },
    { href: '#showroom-section', label: 'Showroom' },
    { href: '#reviews-section', label: 'Reviews' },
  ];

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans overflow-x-hidden">
      {/* Classic Fixed Header — full-width bar with bottom border */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface border-b border-border h-16">
        <div className="max-w-7xl mx-auto h-full px-3.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">

          {/* Left: Hamburger (mobile public only) + Logotype */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isPublicPage && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-1.5 rounded-lg border border-border text-muted hover:text-text hover:bg-surface-subtle cursor-pointer transition-colors"
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            )}

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
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:text-text transition-colors border-b-2 border-transparent hover:border-brand-crimson pb-0.5"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {/* Right: Actions */}
          {isPublicPage ? (
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
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
                className="text-xs px-2.5 sm:px-3 gap-1.5 cursor-pointer relative font-semibold border-border rounded-lg"
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
                className="text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border border-border text-muted hover:text-text hover:bg-surface-hover transition-colors flex items-center gap-1.5 font-medium"
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

        {/* Mobile Navigation Dropdown Sheet for Public Storefront */}
        {isPublicPage && isMobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-surface shadow-md py-3 px-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-xs font-semibold text-text hover:bg-surface-hover rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="pt-3 mt-2 border-t border-border flex items-center justify-between text-xs">
              <a
                href={`tel:${SITE.supportPhone}`}
                className="flex items-center gap-1.5 text-muted hover:text-text font-medium"
              >
                <Phone size={13} className="text-brand-crimson" />
                <span>Call {SITE.displayPhone}</span>
              </a>

              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-1 text-muted hover:text-text font-medium"
              >
                <Shield size={13} />
                <span>Owner Login</span>
              </Link>
            </div>
          </div>
        )}
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
