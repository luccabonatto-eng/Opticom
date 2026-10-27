// Regras de A Receber / A Pagar: vencido deixou de ser um status gravado e
// virou consequência do saldo em aberto, e o lançamento passou a poder nascer
// parcelado ou já quitado.
import test from 'node:test';
import assert from 'node:assert/strict';
import { addMeses } from '../src/utils/dates.js';
import {
  casaBusca,
  porVencimento,
  txAberto,
  txPago,
  txStatus,
  txVencido,
} from '../src/pages/financial/calculations.js';

const HOJE = '2026-10-26';

test('vencido: pendente com data passada, mesmo gravado como PENDING', () => {
  const t = { amount: 50000, amount_paid: 0, status: 'PENDING', due_date: '2026-10-01' };
  assert.equal(txVencido(t, HOJE), true);
  assert.equal(txStatus(t, HOJE), 'OVERDUE');
});

test('vencido: data futura e vencimento de hoje não contam', () => {
  assert.equal(txStatus({ amount: 50000, amount_paid: 0, status: 'PENDING', due_date: '2026-11-10' }, HOJE), 'PENDING');
  assert.equal(txVencido({ amount: 50000, amount_paid: 0, status: 'PENDING', due_date: HOJE }, HOJE), false);
});

test('vencido: quitado nunca vence, por mais antigo que seja', () => {
  const t = { amount: 50000, amount_paid: 50000, status: 'PAID', due_date: '2026-01-05' };
  assert.equal(txVencido(t, HOJE), false);
  assert.equal(txStatus(t, HOJE), 'PAID');
});

test('vencido: baixa parcial atrasada conta pelo saldo restante', () => {
  const t = { amount: 100000, amount_paid: 30000, status: 'PARTIAL', due_date: '2026-09-15' };
  assert.equal(txVencido(t, HOJE), true);
  assert.equal(txAberto(t), 70000);
});

test('vencido: OVERDUE gravado à mão que já não procede é corrigido', () => {
  assert.equal(txStatus({ amount: 1000, amount_paid: 0, status: 'OVERDUE', due_date: '2026-12-01' }, HOJE), 'PENDING');
  assert.equal(txStatus({ amount: 1000, amount_paid: 400, status: 'OVERDUE', due_date: '2026-12-01' }, HOJE), 'PARTIAL');
});

test('vencido: os cards Vencidos e Pendentes não se sobrepõem', () => {
  const lista = [
    { amount: 10000, amount_paid: 0, status: 'PENDING', due_date: '2026-09-01' },
    { amount: 20000, amount_paid: 0, status: 'PENDING', due_date: '2026-11-01' },
    { amount: 30000, amount_paid: 30000, status: 'PAID', due_date: '2026-09-01' },
  ];
  const venc = lista.filter((t) => txVencido(t, HOJE)).reduce((s, t) => s + txAberto(t), 0);
  const pend = lista.filter((t) => !txVencido(t, HOJE)).reduce((s, t) => s + txAberto(t), 0);
  assert.equal(venc, 10000);
  assert.equal(pend, 20000);
  assert.equal(venc + pend, lista.reduce((s, t) => s + txAberto(t), 0));
});

// txVencido recebe `hoje` em vez de assumir um default justamente por causa
// deste caso: em filter(fn) o segundo argumento é o índice.
test('vencido: não pode ser usado direto em filter sem fixar a data', () => {
  const t = { amount: 10000, amount_paid: 0, status: 'PENDING', due_date: '2026-09-01' };
  assert.equal([t].filter(txVencido).length, 0, 'sem a data, o índice entraria no lugar dela');
  assert.equal([t].filter((x) => txVencido(x, HOJE)).length, 1);
});

test('lista ordena do mais atrasado para o mais recente', () => {
  const l = [{ due_date: '2026-10-20' }, { due_date: '2026-09-01' }, { due_date: '2026-10-05' }];
  assert.deepEqual(l.slice().sort(porVencimento).map((t) => t.due_date), [
    '2026-09-01',
    '2026-10-05',
    '2026-10-20',
  ]);
});

test('busca ignora acento e caixa, e vazia não filtra nada', () => {
  const t = { description: 'PAGAMENTOS PREFEITURA MUNICIPAL DE PINHAIS' };
  assert.equal(casaBusca(t, 'prefeitura'), true);
  assert.equal(casaBusca(t, 'MUNICÍPAL'.toLowerCase().replace('í', 'i')), true);
  assert.equal(casaBusca(t, 'claro'), false);
  assert.equal(casaBusca(t, ''), true);
  assert.equal(casaBusca({ description: null }, 'x'), false);
});

test('addMeses: dia 31 em mês curto cai no último dia, não transborda', () => {
  assert.equal(addMeses('2026-01-31', 1), '2026-02-28');
  assert.equal(addMeses('2026-03-31', 1), '2026-04-30');
  assert.equal(addMeses('2028-01-31', 1), '2028-02-29');
  assert.equal(addMeses('2026-10-05', 0), '2026-10-05');
  assert.equal(addMeses('2026-10-05', 3), '2027-01-05');
});

// Espelha o laço de criação do addTx em FinancialPage.jsx
const gerarParcelas = (base, vezes, jaPago, paidDate) =>
  Array.from({ length: vezes }, (_, i) => ({
    ...base,
    description: vezes > 1 ? `${base.description} (${i + 1}/${vezes})` : base.description,
    due_date: i === 0 ? base.due_date : addMeses(base.due_date, i),
    status: jaPago ? (base.type === 'INCOME' ? 'RECEIVED' : 'PAID') : 'PENDING',
    amount_paid: jaPago ? base.amount : 0,
    paid_date: jaPago ? paidDate : null,
  }));

const aluguel = { type: 'EXPENSE', description: 'Aluguel', amount: 279800, due_date: '2026-10-05' };

test('parcelas: uma vez não numera; doze geram doze vencimentos mensais', () => {
  assert.equal(gerarParcelas(aluguel, 1, false, null)[0].description, 'Aluguel');
  const p = gerarParcelas(aluguel, 12, false, null);
  assert.equal(p.length, 12);
  assert.equal(p[0].description, 'Aluguel (1/12)');
  assert.equal(p[11].description, 'Aluguel (12/12)');
  assert.equal(p[0].due_date, '2026-10-05');
  assert.equal(p[11].due_date, '2027-09-05');
});

test('parcelas: o valor digitado é o de cada parcela, não o total dividido', () => {
  const p = gerarParcelas(aluguel, 6, false, null);
  assert.ok(p.every((x) => x.amount === 279800));
  assert.equal(p.reduce((s, x) => s + x.amount, 0), 279800 * 6);
});

test('parcelas nascem pendentes e sem valor efetivo', () => {
  const p = gerarParcelas(aluguel, 3, false, null);
  assert.ok(p.every((x) => x.status === 'PENDING' && x.amount_paid === 0 && x.paid_date === null));
});

test('já pago nasce quitado, com valor efetivo e data', () => {
  const [p] = gerarParcelas(aluguel, 1, true, '2026-10-07');
  assert.equal(p.status, 'PAID');
  assert.equal(p.amount_paid, 279800);
  assert.equal(p.paid_date, '2026-10-07');
  assert.equal(txAberto(p), 0);
  assert.equal(txVencido(p, HOJE), false);
  assert.equal(gerarParcelas({ ...aluguel, type: 'INCOME' }, 1, true, '2026-10-07')[0].status, 'RECEIVED');
});

// O que o botão ↺ grava
const estornado = (t) => ({ ...t, amount_paid: 0, status: 'PENDING', paid_date: null });

test('estorno devolve o valor inteiro e a conta antiga volta a vencer', () => {
  const e = estornado({ amount: 50000, amount_paid: 50000, status: 'PAID', due_date: '2026-10-01' });
  assert.equal(txAberto(e), 50000);
  assert.equal(txPago(e), 0);
  assert.equal(txStatus(e, HOJE), 'OVERDUE');
});

test('estorno de baixa parcial zera o que havia sido pago', () => {
  const e = estornado({ amount: 100000, amount_paid: 30000, status: 'PARTIAL', due_date: '2026-11-01' });
  assert.equal(txPago(e), 0);
  assert.equal(txAberto(e), 100000);
});
