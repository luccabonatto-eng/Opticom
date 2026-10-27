import test from 'node:test';
import assert from 'node:assert/strict';
import { addMeses } from '../src/utils/dates.js';
import { txPago, txAberto, txDue, faturaDe, soma } from '../src/pages/financial/calculations.js';

test('parcelas preservam o dia e limitam ao último dia do mês', () => {
  assert.equal(addMeses('2026-01-31', 1), '2026-02-28');
  assert.equal(addMeses('2024-01-31', 1), '2024-02-29');
  assert.equal(addMeses('2026-12-15', 1), '2027-01-15');
  assert.equal(addMeses('2026-01-31', 2), '2026-03-31');
});
test('baixas parciais e lançamentos antigos mantêm centavos e saldo', () => {
  assert.equal(txPago({ amount: 100000, amount_paid: 30000, status: 'PARTIAL' }), 30000);
  assert.equal(txAberto({ amount: 100000, amount_paid: 30000 }), 70000);
  assert.equal(txPago({ amount: 1200, status: 'PAID' }), 1200);
  assert.equal(txPago({ amount: 1200, status: 'RECEIVED' }), 1200);
  assert.equal(txPago({ amount: 1200, amount_paid: 0, status: 'PAID' }), 0);
  assert.equal(txAberto({ amount: 100, amount_paid: 150 }), 0);
  assert.equal(txPago({ amount: 100, status: 'PENDING' }), 0);
});
test('datas legadas, competência de cartão e somas mantêm compatibilidade', () => {
  assert.equal(txDue({ due: '2026-02-10' }), '2026-02-10');
  assert.equal(txDue({}), '');
  assert.equal(faturaDe({ due_date: '2026-03-31' }), '2026-03');
  assert.equal(
    soma([{ amount: 123 }, { amount: 877 }], (t) => t.amount),
    1000,
  );
});
