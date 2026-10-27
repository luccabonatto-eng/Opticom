// Geração dos relatórios de DFC e DRE. O arquivo é aberto no Excel pt-BR:
// separador ';', vírgula decimal e BOM — sem isso "135.667,77" vira duas
// colunas e "Deduções" vira "DeduÃ§Ãµes".
import test from 'node:test';
import assert from 'node:assert/strict';
import { csvNum, csvPct } from '../src/utils/csv.js';

test('centavos viram reais com vírgula decimal', () => {
  assert.equal(csvNum(35231), '352,31');
  assert.equal(csvNum(13566777), '135667,77');
  assert.equal(csvNum(1), '0,01');
});

test('zero, nulo e indefinido não quebram o relatório', () => {
  assert.equal(csvNum(0), '0,00');
  assert.equal(csvNum(null), '0,00');
  assert.equal(csvNum(undefined), '0,00');
});

test('negativo mantém o sinal — saída de caixa não vira entrada', () => {
  assert.equal(csvNum(-200000), '-2000,00');
});

test('não usa separador de milhar, que o Excel leria como outra coluna', () => {
  assert.ok(!csvNum(13566777).includes('.'));
});

test('percentual com uma casa e vírgula', () => {
  assert.equal(csvPct(12.345), '12,3');
  assert.equal(csvPct(-8), '-8,0');
  assert.equal(csvPct(0), '0,0');
  assert.equal(csvPct(null), '0,0');
});

// Mesmo escape do baixarCSV. Testado aqui porque baixarCSV depende do DOM.
const esc = (v) => {
  const s = v == null ? '' : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const montarCSV = (linhas) => linhas.map((l) => (l || []).map(esc).join(';')).join('\r\n');

test('razão social com ponto-e-vírgula não desloca as colunas', () => {
  assert.equal(esc('EMPRESA A; FILIAL B'), '"EMPRESA A; FILIAL B"');
  assert.equal(esc('Fatura "A"'), '"Fatura ""A"""');
  assert.equal(esc('linha1\nlinha2'), '"linha1\nlinha2"');
  assert.equal(esc('CABEL IND COM DE CONDUTORES'), 'CABEL IND COM DE CONDUTORES');
  assert.equal(esc(null), '');
});

test('linha vazia vira separador em branco e usa CRLF', () => {
  assert.equal(montarCSV([['a'], [], ['b']]), 'a\r\n\r\nb');
});

test('linhas com contagens diferentes de colunas convivem', () => {
  const csv = montarCSV([
    ['Demonstração dos Fluxos de Caixa — Método Direto (CPC 03)'],
    ['Período', '01/10/2026 a 26/10/2026'],
    [],
    ['Conta', 'Previsto (R$)', 'Efetivo (R$)'],
    ['(+) Recebimentos de Clientes', csvNum(23583800), csvNum(23583800)],
  ]);
  assert.deepEqual(csv.split('\r\n'), [
    'Demonstração dos Fluxos de Caixa — Método Direto (CPC 03)',
    'Período;01/10/2026 a 26/10/2026',
    '',
    'Conta;Previsto (R$);Efetivo (R$)',
    '(+) Recebimentos de Clientes;235838,00;235838,00',
  ]);
});

test('DFC: recebimento sai positivo e pagamento negativo nas duas colunas', () => {
  const PV = { recClientes: 23583800, pagCSP: 5000000, caixaOper: 18583800 };
  const EF = { recClientes: 23583800, pagCSP: 4000000, caixaOper: 19583800 };
  const L = (rot, k, neg = false) => [rot, csvNum(neg ? -PV[k] : PV[k]), csvNum(neg ? -EF[k] : EF[k])];
  assert.deepEqual(L('(+) Recebimentos', 'recClientes'), ['(+) Recebimentos', '235838,00', '235838,00']);
  assert.deepEqual(L('(-) CSP', 'pagCSP', true), ['(-) CSP', '-50000,00', '-40000,00']);
  // previsto e efetivo são colunas distintas e podem divergir
  assert.notEqual(L('(-) CSP', 'pagCSP', true)[1], L('(-) CSP', 'pagCSP', true)[2]);
  // a soma das linhas fecha com o subtotal exportado
  assert.equal(csvNum(PV.recClientes - PV.pagCSP), csvNum(PV.caixaOper));
});

test('DRE: AV% é calculada sobre a receita bruta, sem divisão por zero', () => {
  const recBruta = 23583800;
  const L = (rot, c) => [rot, csvNum(c), recBruta > 0 ? csvPct((c / recBruta) * 100) : ''];
  assert.deepEqual(L('(-) CSP', -5000000), ['(-) CSP', '-50000,00', '-21,2']);
  assert.equal(L('RECEITA BRUTA', recBruta)[2], '100,0');
  const semRec = 0;
  const L2 = (rot, c) => [rot, csvNum(c), semRec > 0 ? csvPct((c / semRec) * 100) : ''];
  assert.equal(L2('(-) CSP', -5000)[2], '');
});

test('DRE por cliente: a linha tem exatamente as colunas do cabeçalho', () => {
  const cab = ['Cliente', 'Tipo', 'Receita Bruta (R$)', 'Deduções (R$)', 'Receita Líquida (R$)',
    'CSP (R$)', 'Lucro Bruto (R$)', 'Margem Bruta (%)', 'Despesas Operacionais (R$)',
    'Despesa Total (R$)', 'Resultado Líquido (R$)', 'Margem Líquida (%)', 'Lançamentos'];
  const c = { name: 'COPEL DISTRIBUICAO S.A.', type: 'PJ', grossRevenue: 4000000, deductions: 200000,
    netRevenue: 3800000, csp: 1500000, grossProfit: 2300000, grossMargin: 60.5,
    opExpenses: 300000, totalExpense: 2000000, netProfit: 2000000, netMargin: 52.6, totalCount: 15 };
  const linha = [c.name, c.type, csvNum(c.grossRevenue), csvNum(c.deductions), csvNum(c.netRevenue),
    csvNum(c.csp), csvNum(c.grossProfit), csvPct(c.grossMargin), csvNum(c.opExpenses),
    csvNum(c.totalExpense), csvNum(c.netProfit), csvPct(c.netMargin), c.totalCount];
  assert.equal(linha.length, cab.length);
  assert.equal(linha[7], '60,5');
});

test('DRE geral: as três origens fecham com o total da empresa', async () => {
  const { companyResult } = await import('../src/pages/financial/company-result.js');
  const tx = (id, amount, extra = {}) => ({ id, amount, amount_paid: amount, type: 'INCOME', ...extra });
  const r = companyResult(
    [
      tx('a', 8967548, { customer_id: 'claro' }),
      tx('b', 2000000, { type: 'EXPENSE', customer_id: 'claro' }),
      tx('c', 500000, { type: 'EXPENSE' }),
      tx('d', 7000000),
    ],
    { c: 'general' },
    [],
    'previsto',
  );
  const L = (rot, k) => [rot, csvNum(r[k].income), csvNum(r[k].expense), csvNum(r[k].result)];
  assert.deepEqual(L('Clientes', 'clients'), ['Clientes', '89675,48', '20000,00', '69675,48']);
  assert.deepEqual(L('Geral da empresa', 'general'), ['Geral da empresa', '0,00', '5000,00', '-5000,00']);
  assert.deepEqual(L('Não classificados', 'unassigned'), ['Não classificados', '70000,00', '0,00', '70000,00']);
  // o total exportado é a soma das três origens, não um cálculo paralelo
  assert.equal(r.total.result, r.clients.result + r.general.result + r.unassigned.result);
  assert.equal(L('Total da empresa', 'total')[3], '134675,48');
});
