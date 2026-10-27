// Limites reais da aba de Conciliação, verificados contra os dados de produção.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeLines, reconcile } from '../src/pages/financial/reconciliation.js';
import { parseStatement } from '../src/pages/financial/parsers.js';

const CONTA = '165a3d28-500e-4fd4-b113-d5023f047171'; // Itaú Ag.0615 CC 35792-8
const run = (lines, transactions, links = {}) =>
  reconcile({ lines, transactions, links, accountId: CONTA, from: '2026-10-01', to: '2026-10-31' });
const pago = (id, amount, extra = {}) => ({
  id, amount, amount_paid: amount, type: 'EXPENSE',
  bank_account_id: CONTA, paid_date: '2026-10-10', ...extra,
});
const debito = (id, amount, extra = {}) => ({ id, amount, type: 'DEBIT', date: '2026-10-10', ...extra });

// Os 195 lançamentos baixados em produção estão todos com bank_account_id nulo.
// Enquanto não receberem a conta, não entram na conferência: ficam em
// `incomplete`, fora de `scoped`, e a diferença acusa o extrato inteiro.
test('baixa sem conta bancária fica fora da conferência e trava o fechamento', () => {
  const r = run([debito('l', 50000)], [pago('t', 50000, { bank_account_id: null })], { l: 't' });
  assert.equal(r.incomplete.length, 1);
  assert.equal(r.scoped.length, 0);
  assert.equal(r.systemOut, 0);
  assert.equal(r.difference, -50000);
  assert.equal(r.complete, false);
});

// shortcut: o vínculo é linha → um lançamento. Um débito único que paga duas
// contas (pagamento em lote) não tem como ser conciliado, mesmo com os valores
// fechando. Abrir para vínculo múltiplo quando aparecer no extrato real.
test('um débito que paga duas contas não fecha, mesmo com diferença zero', () => {
  const r = run([debito('L', 50000)], [pago('a', 30000), pago('b', 20000)], { L: 'a' });
  assert.equal(r.difference, 0);
  assert.equal(r.pending.length, 1);
  assert.equal(r.unmatched.length, 2);
  assert.equal(r.complete, false);
});

test('baixa parcial usa o valor efetivo, não o previsto', () => {
  const parcial = pago('p', 100000, { type: 'INCOME', amount_paid: 40000 });
  const r = run([debito('lp', 40000, { type: 'CREDIT' })], [parcial], { lp: 'p' });
  assert.equal(r.systemIn, 40000);
  assert.equal(r.complete, true);
});

// O id vinha do índice da linha, então rebaixar o extrato com dias anteriores
// deslocava tudo e mergeLines recusava a importação inteira.
test('reimportar o extrato ampliado encaixa em vez de recusar', () => {
  const cab = 'Data;Descrição;Valor;Tipo';
  const curto = `${cab}\n05/10/2026;PIX recebido;1.000,00;Crédito\n06/10/2026;Tarifa;50,00;Débito`;
  const longo = `${cab}\n02/10/2026;Aluguel;2.000,00;Débito\n${curto.slice(cab.length + 1)}`;
  const primeira = parseStatement(curto, 'out.csv', { strict: true });
  const juntos = mergeLines(primeira, parseStatement(longo, 'out.csv', { strict: true }));
  assert.equal(juntos.length, 3);
  assert.deepEqual(juntos.map((l) => l.amount), [200000, 100000, 5000]);
  // e reimportar o mesmo arquivo continua não duplicando
  assert.equal(mergeLines(primeira, parseStatement(curto, 'out.csv', { strict: true })).length, 2);
});

test('dois movimentos idênticos no mesmo dia continuam sendo dois', () => {
  const csv = 'Data;Descrição;Valor;Tipo\n02/10/2026;Tarifa;10,00;Débito\n02/10/2026;Tarifa;10,00;Débito';
  const linhas = parseStatement(csv, 'out.csv', { strict: true });
  assert.equal(linhas.length, 2);
  assert.notEqual(linhas[0].id, linhas[1].id);
  assert.equal(mergeLines([], linhas).reduce((s, l) => s + l.amount, 0), 2000);
});
