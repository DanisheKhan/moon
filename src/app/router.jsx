import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { AdminConsoleLayout } from './layouts/AdminConsoleLayout';
import { RouteErrorBoundary } from '@/shared/ui';
import { lazyWithRetry } from '@/shared/lib/lazyWithRetry';

const PublicHomePage = lazyWithRetry(() => import('@/features/catalog').then((m) => ({ default: m.PublicHomePage })));
const LoginPage = lazyWithRetry(() => import('@/features/auth').then((m) => ({ default: m.LoginPage })));
const LauncherPage = lazyWithRetry(() => import('@/features/launcher').then((m) => ({ default: m.LauncherPage })));
const StoreDashboardPage = lazyWithRetry(() => import('@/features/launcher').then((m) => ({ default: m.StoreDashboardPage })));
const ReportsConsolePage = lazyWithRetry(() => import('@/features/reports').then((m) => ({ default: m.ReportsConsolePage })));
const StaffManagementPage = lazyWithRetry(() => import('@/features/staff').then((m) => ({ default: m.StaffManagementPage })));
const POSPage = lazyWithRetry(() => import('@/features/billing').then((m) => ({ default: m.POSPage })));
const InvoicesListPage = lazyWithRetry(() => import('@/features/billing').then((m) => ({ default: m.InvoicesListPage })));
const InventoryCardsPage = lazyWithRetry(() => import('@/features/inventory').then((m) => ({ default: m.InventoryCardsPage })));
const SecondHandIntakePage = lazyWithRetry(() => import('@/features/second-hand').then((m) => ({ default: m.SecondHandIntakePage })));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <PublicHomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
    ],
  },
  {
    path: 'admin',
    element: <AdminConsoleLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <LauncherPage />,
      },
      {
        path: 'staff',
        element: <StaffManagementPage />,
      },
      {
        path: 'invoices',
        element: <InvoicesListPage />,
      },
      {
        path: ':storeCode',
        element: <StoreDashboardPage />,
      },
      {
        path: ':storeCode/dashboard',
        element: <Navigate to=".." relative="path" replace />,
      },
      {
        path: ':storeCode/billing',
        element: <POSPage />,
      },
      {
        path: ':storeCode/invoices',
        element: <InvoicesListPage />,
      },
      {
        path: ':storeCode/inventory',
        element: <InventoryCardsPage />,
      },
      {
        path: ':storeCode/second-hand',
        element: <SecondHandIntakePage />,
      },
      {
        path: ':storeCode/reports',
        element: <ReportsConsolePage />,
      },
    ],
  },
  {
    path: '*',
    element: (
      <div className="py-24 text-center space-y-4">
        <h1 className="text-2xl font-semibold">404 - Page Not Found</h1>
        <p className="text-sm text-muted">The requested URL does not exist.</p>
      </div>
    ),
  },
]);
