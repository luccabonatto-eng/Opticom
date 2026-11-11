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
let permissionsSetting = null;
const technicians = [
  { id: 'tech-1', name: 'Ana Responsável' },
  { id: 'tech-2', name: 'Bruno Apoio' },
  { id: 'tech-3', name: 'Carla Apoio' },
];
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
    if (endpoint === 'technicians') data = technicians;
    if (endpoint.startsWith('settings/')) data = { value: endpoint === 'settings/permissions' ? permissionsSetting : null };
    if (request.method() !== 'GET' && request.method() !== 'OPTIONS') {
      writes.push({ endpoint, body: request.postDataJSON() });
      data = { ...request.postDataJSON(), id: 'created-test', number: 'OS-TESTE' };
    }
    if (endpoint === 'auth/login') data = { token: 'token-teste', user: { id: 'u1', role: 'ADMIN', name: 'Admin teste' } };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    return;
  }
  if (url.origin === origin) return route.continue();
  // External logos are unnecessary for this behavioral test.
  return route.abort();
});
const exportCsv = async (label, expectedText, expectedAmount, button = /Exportar CSV/) => {
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: button }).click();
  const download = await downloading;
  const csv = await readFile(await download.path(), 'utf8');
  assert.equal(csv.charCodeAt(0), 0xfeff, `${label}: Excel BOM`);
  assert.ok(csv.includes(expectedText), `${label}: expected exported data`);
  assert.ok(csv.includes(expectedAmount), `${label}: income in reais`);
  console.log(`OK ${label} CSV`);
  return csv;
};
const check = async (label) => {
  await page.waitForTimeout(100);
  assert.deepEqual(errors, [], `${label}: browser errors`);
  assert.ok((await page.locator('main').innerText()).trim().length > 20, `${label}: blank page`);
  console.log(`OK ${label}`);
};
try {
  await page.goto(origin);
  // Sem sessão o sistema abre na tela de login
  assert.equal(await page.locator('aside').count(), 0, 'Sem login não pode mostrar o sistema');
  await page.locator('input[type=email]').fill('admin@teste.com');
  await page.locator('input[type=password]').fill('senha');
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await page.getByRole('button', { name: 'Dashboard', exact: true }).first().waitFor();
  assert.equal(await page.evaluate(() => sessionStorage.getItem('opticom_token')), 'token-teste');
  console.log('OK Login');
  await page.getByText('Carregando módulo…').waitFor({ state: 'hidden' });
  await check('Dashboard');
  assert.ok(!assets.some((a) => a.includes('FinancialPage-')), 'Financeiro must not load before navigation');
  const sidebar = page.locator('aside');
  for (const name of ['Ordens de Serviço', 'Estoque', 'Frota', 'Clientes', 'Técnicos']) {
    await sidebar.getByRole('button', { name, exact: true }).click();
    await page.getByText('Carregando módulo…').waitFor({ state: 'hidden' });
    await check(name);
  }
  // OS com responsável e técnicos de apoio
  await sidebar.getByRole('button', { name: 'Ordens de Serviço', exact: true }).click();
  await page.getByRole('button', { name: 'Nova OS' }).click();
  const osModal = page.locator('.fixed.inset-0');
  await osModal.locator('select').first().selectOption('customer-1');
  await osModal.locator('input[type="date"]').fill(today);
  await osModal.locator('select').nth(1).selectOption('tech-1');
  assert.equal(await osModal.getByLabel('Ana Responsável').count(), 0, 'Responsável não aparece como apoio');
  await osModal.getByLabel('Bruno Apoio').check();
  await osModal.getByLabel('Carla Apoio').check();
  await osModal.getByRole('button', { name: 'Criar OS', exact: true }).click();
  const osWrite = writes.find((w) => w.endpoint === 'orders');
  assert.equal(osWrite?.body.assigned_technician_id, 'tech-1');
  assert.deepEqual(osWrite?.body.additional_technicians, ['tech-2', 'tech-3']);
  await page.getByRole('button', { name: 'Lista', exact: true }).click();
  await page.getByText('Ana Responsável, Bruno Apoio, Carla Apoio', { exact: true }).waitFor();
  await check('OS com vários técnicos');
  await sidebar.getByRole('button', { name: 'Financeiro', exact: true }).click();
  await page.getByRole('button', { name: 'Novo Recebimento', exact: true }).waitFor();
  await check('Financeiro / A Receber');
  await exportCsv('A Receber', 'Receita de teste', '1000,00', /Exportar planilha/);
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
  const firstRow = () => page.locator('tbody tr').first().innerText();
  const byAmount = page.locator('thead').getByRole('button', { name: 'Valor', exact: true });
  await byAmount.click();
  assert.match(await firstRow(), /Lançamento de verificação/, 'Valor crescente');
  await search.fill('e'); // a página re-renderiza a tabela; a ordem tem que continuar
  assert.match(await firstRow(), /Lançamento de verificação/, 'Ordenação mantida ao filtrar');
  await byAmount.click();
  assert.match(await firstRow(), /Receita de teste/, 'Valor decrescente');
  const sortedCsv = await exportCsv('A Receber ordenado', 'Receita de teste', '1000,00', /Exportar planilha/);
  assert.ok(sortedCsv.indexOf('Receita de teste') < sortedCsv.indexOf('Lançamento de verificação'), 'Planilha na ordem da tela');
  await byAmount.click(); // volta à ordem original
  await check('Ordenação por coluna');
  await search.fill('Receita');
  for (const name of [
    'A Pagar',
    'Fluxo de Caixa',
    'DRE Gerencial',
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
    if (name === 'A Pagar') await exportCsv('A Pagar', 'Despesa de teste', '200,00', /Exportar planilha/);
    if (name === 'Fluxo de Caixa') await exportCsv('DFC', 'Fluxos de Caixa', '1123,45');
    if (name === 'DRE Gerencial') {
      // o DRE abre na visão Gerencial; o painel por cliente fica em "Por Cliente"
      await page.locator('main').getByRole('button', { name: 'Por Cliente', exact: true }).click();
      const customerEntries = page.locator('details').filter({ has: page.getByLabel('Cliente para consultar lançamentos') });
      // o painel nasce fechado para não poluir o topo do DRE
      await customerEntries.locator('summary').click();
      await page.getByLabel('Cliente para consultar lançamentos').selectOption('customer-1');
      await customerEntries.getByRole('heading', { name: 'Receitas (1)', exact: true }).waitFor();
      await customerEntries.getByRole('heading', { name: 'Contas a pagar (1)', exact: true }).waitFor();
      await customerEntries.getByText('Receita de teste', { exact: true }).waitFor();
      await customerEntries.getByText('Despesa de teste', { exact: true }).waitFor();
      await page.getByLabel('Cliente para consultar lançamentos').selectOption('');
      assert.equal(await customerEntries.getByRole('table').count(), 0);
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
  // Permissões vêm do banco (settings/permissions), não do navegador
  permissionsSetting = JSON.stringify({ MANAGER: ['dashboard', 'financial'], MANAGER_fin: ['receivable'] });
  await page.evaluate(() => {
    sessionStorage.setItem('opticom_user', JSON.stringify({ role: 'MANAGER', name: 'Gestor teste' }));
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
