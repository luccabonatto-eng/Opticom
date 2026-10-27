const MENU = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', group: null },
  { id: 'orders', label: 'Ordens de Serviço', icon: 'orders', group: null },
  { id: 'financial', label: 'Financeiro', icon: 'financial', group: null },
  { id: 'inventory', label: 'Estoque', icon: 'inventory', group: null },
  { id: 'fleet', label: 'Frota', icon: 'fleet', group: null },
  { id: 'customers', label: 'Clientes', icon: 'customers', group: 'Cadastro' },
  { id: 'technicians', label: 'Técnicos', icon: 'technicians', group: 'Cadastro' },
  { id: 'settings', label: 'Configurações', icon: 'settings', group: 'Sistema' },
];

const ALL_PAGE_IDS = MENU.map((m) => m.id);

const FINANCIAL_SUBMENU_IDS = [
  'receivable',
  'payable',
  'cashflow',
  'dre',
  'payroll',
  'approval',
  'statement',
  'reconciliation',
  'card',
  'expcard',
];

const DEFAULT_PERMISSIONS = {
  ADMIN: [...ALL_PAGE_IDS],
  MANAGER: ['dashboard', 'orders', 'financial', 'inventory', 'fleet', 'customers', 'technicians'],
  TECHNICIAN: ['dashboard', 'orders'],
  MANAGER_fin: [...FINANCIAL_SUBMENU_IDS],
  TECHNICIAN_fin: ['receivable', 'payable'],
};

const TITLES = {
  dashboard: 'Dashboard',
  orders: 'Ordens de Serviço',
  customers: 'Clientes',
  contracts: 'Contratos',
  financial: 'Financeiro',
  inventory: 'Estoque',
  technicians: 'Técnicos',
  fleet: 'Frota',
  settings: 'Configurações',
};

export { MENU, ALL_PAGE_IDS, FINANCIAL_SUBMENU_IDS, DEFAULT_PERMISSIONS, TITLES };
