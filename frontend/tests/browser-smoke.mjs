// Run against a local preview. Every API call is fulfilled here; no real data is touched.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const origin = process.env.SMOKE_URL || 'http://127.0.0.1:4179';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname), 'Use only a local preview');
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const assets = [];
const writes = [];
const today = new Date().toISOString().slice(0, 10);
const customers = [{ id: 'customer-1', name: 'Cliente de teste', type: 'PJ', active: true }];
const categories = [
  { id: 'income', name: 'Serviços', type: 'INCOME', accounting_class: 'RECEITA_SERVICO' },
  { id: 'expense', name: 'Material', type: 'EXPENSE', accounting_class: 'CSP' },
];
const transactions = [
  {
    id: 'tx-1',
    type: 'INCOME',
    description: 'Receita de teste',
    amount: 100000,
    amount_paid: 30000,
    status: 'PARTIAL',
    due_date: today,
    customer_id: 'customer-1',
    category_id: 'income',
  },
  {
    id: 'tx-2',
    type: 'EXPENSE',
    description: 'Despesa de teste',
    amount: 20000,
    amount_paid: 20000,
    status: 'PAID',
    due_date: today,
    customer_id: 'customer-1',
    category_id: 'expense',
  },
];
page.on('pageerror', (e) => errors.push(e.message));
page.on('request', (req) => {
  if (req.url().includes('/assets/')) assets.push(req.url());
});
await page.route('**/*', async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  if (url.pathname.startsWith('/api/')) {
    const endpoint = url.pathname.replace('/api/', '');
    let data = [];
    if (endpoint === 'customers') data = customers;
    if (endpoint === 'categories')
      data = {
        income: categories.filter((c) => c.type === 'INCOME'),
        expense: categories.filter((c) => c.type === 'EXPENSE'),
      };
    if (endpoint === 'transactions') data = transactions;
    if (endpoint.startsWith('settings/')) data = { value: null };
    if (request.method() !== 'GET' && request.method() !== 'OPTIONS') {
      writes.push({ endpoint, body: request.postDataJSON() });
      data = { ...request.postDataJSON(), id: 'created-test' };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    return;
  }
  if (url.origin === origin) return route.continue();
  // External logos are unnecessary for this behavioral test.
  return route.abort();
});
const exportCsv = async (label, expectedText, expectedAmount) => {
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: /Exportar CSV/ }).click();
  const download = await downloading;
  const csv = await readFile(await download.path(), 'utf8');
  assert.equal(csv.charCodeAt(0), 0xfeff, `${label}: Excel BOM`);
  assert.ok(csv.includes(expectedText), `${label}: expected exported data`);
  assert.ok(csv.includes(expectedAmount), `${label}: income in reais`);
  console.log(`OK ${label} CSV`);
};
const check = async (label) => {
  await page.waitForTimeout(100);
  assert.deepEqual(errors, [], `${label}: browser errors`);
  assert.ok((await page.locator('main').innerText()).trim().length > 20, `${label}: blank page`);
  console.log(`OK ${label}`);
};
try {
  await page.goto(origin);
  await page.getByRole('button', { name: 'Dashboard', exact: true }).first().waitFor();
  await page.getByText('Carregando módulo…').waitFor({ state: 'hidden' });
  await check('Dashboard');
  assert.ok(!assets.some((a) => a.includes('FinancialPage-')), 'Financeiro must not load before navigation');
  const sidebar = page.locator('aside');
  for (const name of ['Ordens de Serviço', 'Estoque', 'Frota', 'Clientes', 'Técnicos']) {
    await sidebar.getByRole('button', { name, exact: true }).click();
    await page.getByText('Carregando módulo…').waitFor({ state: 'hidden' });
    await check(name);
  }
  await sidebar.getByRole('button', { name: 'Financeiro', exact: true }).click();
  await page.getByRole('button', { name: 'Novo Recebimento', exact: true }).waitFor();
  await check('Financeiro / A Receber');
  await page.getByRole('button', { name: 'Novo Recebimento', exact: true }).click();
  await page.getByRole('heading', { name: 'Novo Recebimento', exact: true }).waitFor();
  await check('Modal de lançamento');
  await page.getByPlaceholder('Ex: Fatura Hospital Regional').fill('Lançamento de verificação');
  await page.getByPlaceholder('0,00', { exact: true }).fill('123.45');
  const modal = page.locator('.fixed.inset-0');
  await modal.locator('input[type="date"]').fill(today);
  await modal.getByRole('button', { name: 'Salvar Lançamento', exact: true }).click();
  await page.getByRole('heading', { name: 'Novo Recebimento', exact: true }).waitFor({ state: 'hidden' });
  const creation = writes.find((w) => w.endpoint === 'transactions');
  assert.equal(creation?.body.amount, 12345, 'Modal must submit integer cents');
  assert.equal(creation?.body.description, 'Lançamento de verificação');
  const search = page.getByRole('textbox', { name: 'Buscar pela descrição...' });
  await search.fill('Receita');
  for (const name of [
    'A Pagar',
    'Fluxo de Caixa',
    'DRE Gerencial',
    'Folha Salarial',
    'Aprovações do Dia',
    'Cartão de Crédito',
    'Cartão de Despesa',
    'Extrato Bancário',
  ]) {
    await page
      .locator('main')
      .getByRole('button', { name: new RegExp(name) })
      .first()
      .click();
    await check(name);
    if (name === 'Fluxo de Caixa') await exportCsv('DFC', 'Fluxos de Caixa', '1123,45');
    if (name === 'DRE Gerencial') {
      await exportCsv('DRE por cliente', 'Cliente de teste', '1000,00');
      await page
        .getByRole('button', { name: /Detalhes/ })
        .first()
        .click();
      await check('DRE detalhe do cliente');
      const consolidated = page.getByRole('button', { name: /Consolidada/ });
      await consolidated.click();
      await check('DRE consolidada');
      await exportCsv('DRE consolidada', 'Resultado do Exercício', '1123,45');
      await page.screenshot({ path: join(tmpdir(), 'opticom-dre.png'), fullPage: true });
    }
  }
  await page
    .locator('main')
    .getByRole('button', { name: /A Receber/ })
    .first()
    .click();
  assert.equal(await search.inputValue(), 'Receita', 'Filters must survive tab changes');
  await sidebar.getByRole('button', { name: 'Configurações', exact: true }).click();
  await page.getByRole('button', { name: 'Empresa', exact: true }).waitFor();
  for (const name of ['Empresa', 'Tributação', 'Financeiro', 'Contas e Saldos', 'Usuários', 'Notificações', 'SLA']) {
    await page.locator('main').getByRole('button', { name, exact: true }).click();
    await check(`Configurações / ${name}`);
  }
  await page.evaluate(() => {
    sessionStorage.setItem('opticom_user', JSON.stringify({ role: 'MANAGER', name: 'Gestor teste' }));
    localStorage.setItem(
      'opticom_permissions',
      JSON.stringify({ MANAGER: ['dashboard', 'financial'], MANAGER_fin: ['receivable'] }),
    );
  });
  await page.reload();
  await sidebar.getByRole('button', { name: 'Financeiro', exact: true }).click();
  await page.getByRole('button', { name: 'Novo Recebimento', exact: true }).waitFor();
  assert.equal(await sidebar.getByRole('button', { name: 'Configurações', exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: /DRE Gerencial/ }).count(), 0);
  await check('Permissões por perfil e aba financeira');
  await page.screenshot({ path: process.env.SMOKE_SCREENSHOT || join(tmpdir(), 'opticom-smoke.png'), fullPage: true });
  console.log(`PASS: navigation, modals, retained filters and lazy loading; ${writes.length} intercepted writes.`);
} finally {
  await browser.close();
}
