// API Client para Opticom ERP
// Gerencia autenticação e requisições HTTP

const API_BASE_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:3001/api'
  : 'https://opticom-backend.vercel.app/api';

// Tela de login está desativada — sem token real, usa o token de demonstração
// do backend para evitar 401 em loop (que causava refresh contínuo da página).
const DEMO_TOKEN = 'demo-preview-opticom-2026';

class OpticomAPI {
  constructor() {
    this.token = sessionStorage.getItem('opticom_token') || DEMO_TOKEN;
    try {
      this.user = JSON.parse(sessionStorage.getItem('opticom_user') || 'null');
    } catch {
      this.user = null;
    }
  }

  // === Autenticação ===
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao fazer login');

      // Salvar token em sessionStorage
      this.token = data.token;
      this.user = data.user;
      sessionStorage.setItem('opticom_token', data.token);
      sessionStorage.setItem('opticom_user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async register(name, email, password, role = 'TECHNICIAN') {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao registrar');

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  logout() {
    this.user = null;
    this.token = null;
    sessionStorage.removeItem('opticom_token');
    sessionStorage.removeItem('opticom_user');
  }

  isAuthenticated() {
    return !!this.token;
  }

  // === Requisições Autenticadas ===
  async _fetch(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Adicionar token no Authorization header
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401) {
        this.logout();
        window.location.href = '/';
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro na requisição');

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Percorre todas as páginas de uma listagem. Telas que somam ou contam
  // (dashboard, DRE, Fluxo de Caixa, A Receber/A Pagar) precisam do conjunto
  // completo — lendo só a primeira página os totais ficam errados em silêncio
  // assim que o cadastro passa do limite por página.
  async _fetchAllPages(path, filters = {}) {
    const PAGE = 1000;
    const all = [];
    let offset = 0;
    let total = Infinity;

    while (all.length < total) {
      const params = new URLSearchParams({ ...filters, limit: PAGE, offset });
      const res = await this._fetch(`${path}?${params}`);
      if (!res.success) return all.length ? { success: true, data: { data: all } } : res;

      const page = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      all.push(...page);
      total = res.data?.pagination?.total ?? all.length;

      if (page.length === 0) break; // proteção contra laço infinito
      offset += PAGE;
    }

    return { success: true, data: { data: all, pagination: { total: all.length } } };
  }

  // === Clientes ===
  async getCustomers() {
    return this._fetch('/customers');
  }

  async getCustomer(id) {
    return this._fetch(`/customers/${id}`);
  }

  async createCustomer(customer) {
    return this._fetch('/customers', { method: 'POST', body: JSON.stringify(customer) });
  }

  async updateCustomer(id, customer) {
    return this._fetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(customer) });
  }

  async deleteCustomer(id) {
    return this._fetch(`/customers/${id}`, { method: 'DELETE' });
  }

  // === Contratos ===
  async getContracts() {
    return this._fetch('/contracts');
  }

  async getContract(id) {
    return this._fetch(`/contracts/${id}`);
  }

  async createContract(contract) {
    return this._fetch('/contracts', { method: 'POST', body: JSON.stringify(contract) });
  }

  async updateContract(id, contract) {
    return this._fetch(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(contract) });
  }

  async deleteContract(id) {
    return this._fetch(`/contracts/${id}`, { method: 'DELETE' });
  }

  // === Ordens de Serviço ===
  async getOrders(filters = {}) {
    const params = new URLSearchParams(filters);
    return this._fetch(`/orders?${params}`);
  }

  async getOrder(id) {
    return this._fetch(`/orders/${id}`);
  }

  async createOrder(order) {
    return this._fetch('/orders', { method: 'POST', body: JSON.stringify(order) });
  }

  async updateOrder(id, order) {
    return this._fetch(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(order) });
  }

  async deleteOrder(id) {
    return this._fetch(`/orders/${id}`, { method: 'DELETE' });
  }

  // === Técnicos ===
  async getTechnicians() {
    return this._fetch('/technicians');
  }

  async getTechnician(id) {
    return this._fetch(`/technicians/${id}`);
  }

  async createTechnician(technician) {
    return this._fetch('/technicians', { method: 'POST', body: JSON.stringify(technician) });
  }

  async updateTechnician(id, technician) {
    return this._fetch(`/technicians/${id}`, { method: 'PUT', body: JSON.stringify(technician) });
  }

  async deleteTechnician(id) {
    return this._fetch(`/technicians/${id}`, { method: 'DELETE' });
  }

  // === Veículos ===
  async getVehicles() {
    return this._fetch('/vehicles');
  }

  async getVehicle(id) {
    return this._fetch(`/vehicles/${id}`);
  }

  async createVehicle(vehicle) {
    return this._fetch('/vehicles', { method: 'POST', body: JSON.stringify(vehicle) });
  }

  async updateVehicle(id, vehicle) {
    return this._fetch(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(vehicle) });
  }

  async deleteVehicle(id) {
    return this._fetch(`/vehicles/${id}`, { method: 'DELETE' });
  }

  // === Produtos ===
  async getProducts() {
    return this._fetch('/products');
  }

  async getProduct(id) {
    return this._fetch(`/products/${id}`);
  }

  async createProduct(product) {
    return this._fetch('/products', { method: 'POST', body: JSON.stringify(product) });
  }

  async updateProduct(id, product) {
    return this._fetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) });
  }

  async deleteProduct(id) {
    return this._fetch(`/products/${id}`, { method: 'DELETE' });
  }

  // === Transações ===
  async getTransactions(filters = {}) {
    const params = new URLSearchParams(filters);
    return this._fetch(`/transactions?${params}`);
  }

  async getAllTransactions(filters = {}) {
    return this._fetchAllPages('/transactions', filters);
  }

  async getDreGerencial(filters = {}) {
    const params = new URLSearchParams(filters);
    return this._fetch(`/transactions/dre-gerencial?${params}`);
  }

  async getAllOrders(filters = {})      { return this._fetchAllPages('/orders', filters); }
  async getAllCustomers(filters = {})   { return this._fetchAllPages('/customers', filters); }
  async getAllContracts(filters = {})   { return this._fetchAllPages('/contracts', filters); }
  async getAllProducts(filters = {})    { return this._fetchAllPages('/products', filters); }
  async getAllTechnicians(filters = {}) { return this._fetchAllPages('/technicians', filters); }
  async getAllVehicles(filters = {})    { return this._fetchAllPages('/vehicles', filters); }

  async getTransaction(id) {
    return this._fetch(`/transactions/${id}`);
  }

  async createTransaction(transaction) {
    return this._fetch('/transactions', { method: 'POST', body: JSON.stringify(transaction) });
  }

  async updateTransaction(id, transaction) {
    return this._fetch(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(transaction) });
  }

  async deleteTransaction(id) {
    return this._fetch(`/transactions/${id}`, { method: 'DELETE' });
  }

  // === Manutenção de Veículos ===
  async getVehicleMaintenance(vehicleId) {
    return this._fetch(`/vehicles/${vehicleId}/maintenance`);
  }

  async createVehicleMaintenance(vehicleId, data) {
    return this._fetch(`/vehicles/${vehicleId}/maintenance`, { method: 'POST', body: JSON.stringify(data) });
  }

  // === Usuários ===
  async getUsers() {
    return this._fetch('/users');
  }

  async updateUser(id, data) {
    return this._fetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deactivateUser(id) {
    return this._fetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'INACTIVE' }) });
  }

  async deleteUser(id) {
    return this._fetch(`/users/${id}`, { method: 'DELETE' });
  }

  // === Configurações do Sistema ===
  async getSetting(key) {
    return this._fetch(`/settings/${key}`);
  }

  async setSetting(key, value) {
    return this._fetch(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) });
  }

  // === Auditoria ===
  async getAuditLogs(filters = {}) {
    const params = new URLSearchParams(filters);
    return this._fetch(`/audit?${params}`);
  }

  // === Categorias ===
  async getCategories() {
    return this._fetch('/categories');
  }

  async createCategory(type, data) {
    return this._fetch(`/categories/${type}`, { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCategory(type, id, data) {
    return this._fetch(`/categories/${type}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteCategory(type, id) {
    return this._fetch(`/categories/${type}/${id}`, { method: 'DELETE' });
  }

  // === Contas Bancárias ===
  async getBankAccounts() {
    return this._fetch('/bank-accounts');
  }

  async createBankAccount(data) {
    return this._fetch('/bank-accounts', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateBankAccount(id, data) {
    return this._fetch(`/bank-accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteBankAccount(id) {
    return this._fetch(`/bank-accounts/${id}`, { method: 'DELETE' });
  }

  // === Métodos de Pagamento ===
  async getPaymentMethods() {
    return this._fetch('/payment-methods');
  }

  async createPaymentMethod(data) {
    return this._fetch('/payment-methods', { method: 'POST', body: JSON.stringify(data) });
  }

  async deletePaymentMethod(id) {
    return this._fetch(`/payment-methods/${id}`, { method: 'DELETE' });
  }
}

// Instância global
const api = new OpticomAPI();
