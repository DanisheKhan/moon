import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, Input, Badge } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '@/shared/lib/errors';
import { Shield, Key, ArrowRight, UserCheck, ArrowLeft } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loginAsPersona } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleLoginSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your owner email and password.');
      return;
    }

    setPending(true);
    setError('');

    try {
      const res = await signIn({ email, password });
      if (res?.redirectTo) {
        navigate(res.redirectTo);
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  function handleQuickLogin(role = 'owner') {
    const target = loginAsPersona(role);
    navigate(target);
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] flex flex-col justify-center py-8 sm:py-12 min-w-0">
      <Seo
        title="Store Owner Portal Login | Star Enterprises"
        description="Secure authentication portal for Star Enterprises store owner administration."
        path="/login"
        noindex
      />

      <div className="w-full max-w-md mx-auto px-4 sm:px-6 space-y-6 min-w-0">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={14} /> Back to Public Storefront
        </Link>

        {/* Header */}
        <div className="text-center space-y-2">
          <Badge variant="accent" className="mb-1 text-xs">
            Star Enterprises Owner Access
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Store Owner Portal
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
            Sign in with your store owner credentials to access full business operations, POS terminals, inventory, and management systems.
          </p>
        </div>

        {/* Main Login Card */}
        <Card className="p-6 sm:p-8 space-y-5 shadow-2xs">
          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Input
              id="login-email"
              type="email"
              label="Store Owner Email Address"
              placeholder="e.g. owner@starenterprises.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="login-password"
              type="password"
              label="Password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="solid"
              pending={pending}
              className="w-full justify-center gap-2 text-xs py-2.5 cursor-pointer mt-2"
            >
              <Key size={14} /> Sign In as Store Owner
            </Button>
          </form>

          {/* Quick-Fill & Demo Master Credentials */}
          <div className="pt-5 border-t border-border space-y-3">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-semibold text-text flex items-center gap-1.5">
                <UserCheck size={14} /> Quick Demo Owner Access
              </span>
              <span>1-Click Sign-in</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Owner Quick Button */}
              <div className="p-3 border border-border rounded-xl bg-bg flex items-center justify-between gap-3 min-w-0 transition-colors hover:border-text/30">
                <div className="min-w-0">
                  <div className="font-semibold text-text flex items-center gap-1.5 truncate">
                    <Shield size={14} className="text-text shrink-0" />
                    <span className="truncate">Store Owner (Full Business Access)</span>
                  </div>
                  <div className="text-[11px] text-muted font-mono truncate">
                    owner@starenterprises.com
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('owner')}
                  className="text-xs cursor-pointer shrink-0 gap-1"
                >
                  Enter <ArrowRight size={12} />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Notice */}
        <div className="text-center text-[11px] text-muted flex items-center justify-center gap-1.5 pt-1">
          <Shield size={12} className="shrink-0" />
          <span>Encrypted Session • Star Enterprises Management Console</span>
        </div>
      </div>
    </div>
  );
}
