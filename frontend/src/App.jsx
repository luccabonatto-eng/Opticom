import { BANK_ACCOUNTS_INIT, EXPENSE_CATS_INIT, INCOME_CATS_INIT, PAYMENT_METHODS_INIT } from './config/financial.js';

import { DEFAULT_PERMISSIONS } from './config/navigation.js';

import { Header } from './layout/Header.jsx';

import { Sidebar } from './layout/Sidebar.jsx';
import { TAX_REGIMES } from './config/tax-regimes.js';

import { api } from './api/client.js';
import { lazy, Suspense, useEffect, useState } from 'react';

const ContractsPage = lazy(() =>
  import('./pages/contracts/ContractsPage.jsx').then((module) => ({ default: module.ContractsPage })),
);
const CustomersPage = lazy(() =>
  import('./pages/customers/CustomersPage.jsx').then((module) => ({ default: module.CustomersPage })),
);
const DashboardPage = lazy(() =>
  import('./pages/dashboard/DashboardPage.jsx').then((module) => ({ default: module.DashboardPage })),
);
const FinancialPage = lazy(() =>
  import('./pages/financial/FinancialPage.jsx').then((module) => ({ default: module.FinancialPage })),
);
const FleetPage = lazy(() => import('./pages/fleet/FleetPage.jsx').then((module) => ({ default: module.FleetPage })));
const InventoryPage = lazy(() =>
  import('./pages/inventory/InventoryPage.jsx').then((module) => ({ default: module.InventoryPage })),
);
const OrdersPage = lazy(() =>
  import('./pages/orders/OrdersPage.jsx').then((module) => ({ default: module.OrdersPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/settings/SettingsPage.jsx').then((module) => ({ default: module.SettingsPage })),
);
const TechniciansPage = lazy(() =>
  import('./pages/technicians/TechniciansPage.jsx').then((module) => ({ default: module.TechniciansPage })),
);

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard');
  // TEMPORÁRIO: sem login ativo, assume perfil ADMIN para visão completa do sistema
  const [user, setUser] = useState(() => api.user || { role: 'ADMIN', name: 'Administrador' });
  const [collapsed, setCollapsed] = useState(false);
  // Regime tributário global — propagado por toda a aplicação
  const [taxRegime, setTaxRegime] = useState(() => localStorage.getItem('opticom_taxRegime') || 'REAL');
  // Permissões por perfil
  const [permissions, setPermissions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('opticom_permissions')) || DEFAULT_PERMISSIONS;
    } catch {
      return DEFAULT_PERMISSIONS;
    }
  });
  const savePermissions = (p) => {
    setPermissions(p);
    localStorage.setItem('opticom_permissions', JSON.stringify(p));
  };
  // Configurações financeiras globais
  const [incomeCats, setIncomeCats] = useState(INCOME_CATS_INIT.map((n) => ({ id: n, name: n })));
  const [expenseCats, setExpenseCats] = useState(EXPENSE_CATS_INIT.map((n) => ({ id: n, name: n })));
  const [bankAccounts, setBankAccounts] = useState(BANK_ACCOUNTS_INIT);
  const [payMethods, setPayMethods] = useState(PAYMENT_METHODS_INIT);

  useEffect(() => {
    if (!api.token) return;
    api.getBankAccounts().then((r) => {
      if (r.success)
        setBankAccounts(
          (r.data || []).map((b) => ({
            ...b,
            bank: b.bank_name || b.name || '',
            account: b.account_number || b.account || '',
            agency: b.agency || '—',
            type: b.type || 'Corrente',
            balance: b.balance || 0,
            active: b.active !== undefined ? b.active : true,
          })),
        );
    });
    api.getPaymentMethods().then((r) => {
      if (r.success)
        setPayMethods(
          (r.data || []).map((m) => ({
            ...m,
            active: m.active !== undefined ? m.active : true,
          })),
        );
    });
    api.getCategories().then((r) => {
      if (r.success) {
        if (r.data?.income) setIncomeCats(r.data.income);
        if (r.data?.expense) setExpenseCats(r.data.expense);
      }
    });
  }, []);

  // Sincronizar loggedIn com token em sessionStorage
  // Verificar continuamente para detectar logout automático via 401
  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('opticom_token');
      // api.user é restaurado do sessionStorage no constructor — basta checar o token
      const isAuthenticated = !!token;
      setLoggedIn(isAuthenticated);
    };

    // Check inicial
    checkAuth();
    setLoading(false);

    // Verificar a cada 500ms - detecta logout automático quando há erro 401
    const interval = setInterval(checkAuth, 500);
    return () => clearInterval(interval);
  }, []);

  // TEMPORÁRIO: tela de login desativada a pedido do usuário — reativar removendo este comentário
  // if (!loggedIn) return <LoginPage onLogin={()=>{ setUser(api.user); setLoggedIn(true); }}/>;

  const renderPage = () => {
    const role = user?.role || 'TECHNICIAN';
    const allowed = new Set((permissions || DEFAULT_PERMISSIONS)[role] || []);
    if (page !== 'dashboard' && !allowed.has(page)) {
      return (
        <div className="p-10 text-center">
          <p className="text-gray-400 text-sm">Você não tem permissão para acessar esta página.</p>
          <button onClick={() => setPage('dashboard')} className="mt-4 text-blue-600 text-sm hover:underline">
            ← Voltar ao Dashboard
          </button>
        </div>
      );
    }
    switch (page) {
      case 'dashboard':
        return <DashboardPage setPage={setPage} taxRegime={taxRegime} />;
      case 'orders':
        return <OrdersPage taxRegime={taxRegime} />;
      case 'customers':
        return <CustomersPage setPage={setPage} />;
      case 'contracts':
        return <ContractsPage taxRegime={taxRegime} />;
      case 'financial':
        return (
          <FinancialPage
            taxRegime={taxRegime}
            finPerms={user?.role === 'ADMIN' ? null : permissions[`${user?.role}_fin`] || null}
          />
        );
      case 'inventory':
        return <InventoryPage />;
      case 'technicians':
        return <TechniciansPage />;
      case 'fleet':
        return <FleetPage />;
      case 'settings':
        return (
          <SettingsPage
            taxRegime={taxRegime}
            setTaxRegime={setTaxRegime}
            incomeCats={incomeCats}
            setIncomeCats={setIncomeCats}
            expenseCats={expenseCats}
            setExpenseCats={setExpenseCats}
            bankAccounts={bankAccounts}
            setBankAccounts={setBankAccounts}
            payMethods={payMethods}
            setPayMethods={setPayMethods}
            permissions={permissions}
            savePermissions={savePermissions}
          />
        );
      default:
        return <div className="p-10 text-center text-gray-400">Módulo não encontrado</div>;
    }
  };

  const regime = TAX_REGIMES[taxRegime];
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        page={page}
        setPage={setPage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        user={user}
        permissions={permissions}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          page={page}
          onLogout={() => {
            api.logout();
            setLoggedIn(false);
          }}
          setPage={setPage}
          regime={regime}
          user={user}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Suspense
            fallback={
              <p className="p-6 text-sm text-gray-500" role="status">
                Carregando módulo…
              </p>
            }
          >
            {renderPage()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export { App };
