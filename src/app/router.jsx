import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { AdminConsoleLayout } from './layouts/AdminConsoleLayout';

const PublicHomePage = lazy(() => import('@/features/catalog').then((m) => ({ default: m.PublicHomePage })));
const LoginPage = lazy(() => import('@/features/auth').then((m) => ({ default: m.LoginPage })));
const LauncherPage = lazy(() => import('@/features/launcher').then((m) => ({ default: m.LauncherPage })));
const OwnerOverviewPage = lazy(() => import('@/features/launcher').then((m) => ({ default: m.OwnerOverviewPage })));
const OperationsDashboardPage = lazy(() => import('@/features/launcher').then((m) => ({ default: m.OperationsDashboardPage })));
const StoreDashboardPage = lazy(() => import('@/features/launcher').then((m) => ({ default: m.StoreDashboardPage })));
const ConsoleSettingsPage = lazy(() => import('@/features/launcher').then((m) => ({ default: m.ConsoleSettingsPage })));
const OwnerDashboardPage = lazy(() => import('@/features/reports').then((m) => ({ default: m.OwnerDashboardPage })));
const ReportsConsolePage = lazy(() => import('@/features/reports').then((m) => ({ default: m.ReportsConsolePage })));
const StaffManagementPage = lazy(() => import('@/features/staff').then((m) => ({ default: m.StaffManagementPage })));
const POSPage = lazy(() => import('@/features/billing').then((m) => ({ default: m.POSPage })));
const InvoicesListPage = lazy(() => import('@/features/billing').then((m) => ({ default: m.InvoicesListPage })));
const InventoryCardsPage = lazy(() => import('@/features/inventory').then((m) => ({ default: m.InventoryCardsPage })));
const SecondHandIntakePage = lazy(() => import('@/features/second-hand').then((m) => ({ default: m.SecondHandIntakePage })));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <PublicHomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'admin',
        element: <LauncherPage />,
      },
      {
        path: 'admin/overview',
        element: <OwnerOverviewPage />,
      },
      {
        path: 'admin/all',
        element: <OwnerDashboardPage />,
      },
      {
        path: 'admin/staff',
        element: <StaffManagementPage />,
      },
      {
        path: 'admin/operations',
        element: <OperationsDashboardPage />,
      },
      {
        path: 'admin/my-portal',
        element: <Navigate to="/admin/staff" replace />,
      },
    ],
  },
  {
    path: 'admin/:storeCode',
    element: <AdminConsoleLayout />,
    children: [
      {
        index: true,
        element: <StoreDashboardPage />,
      },
      {
        path: 'dashboard',
        element: <StoreDashboardPage />,
      },
      {
        path: 'billing',
        element: <POSPage />,
      },
      {
        path: 'invoices',
        element: <InvoicesListPage />,
      },
      {
        path: 'inventory',
        element: <InventoryCardsPage />,
      },
      {
        path: 'second-hand',
        element: <SecondHandIntakePage />,
      },
      {
        path: 'staff',
        element: <StaffManagementPage />,
      },
      {
        path: 'reports',
        element: <ReportsConsolePage />,
      },
      {
        path: 'settings',
        element: <ConsoleSettingsPage />,
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
