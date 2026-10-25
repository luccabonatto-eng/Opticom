// Regra da baixa parcial, copiada do frontend (index.html: txPago/txAberto e
// confirmSettle). Dinheiro em centavos inteiros, nunca float.
const txPago = t => {
  if (t.amount_paid != null) return t.amount_paid;
  return (t.status === 'PAID' || t.status === 'RECEIVED') ? (t.amount || 0) : 0;
};
const txAberto = t => Math.max(0, (t.amount || 0) - txPago(t));

const baixar = (t, valorCents) => {
  if (valorCents <= 0) return { erro: 'valor inválido' };
  if (valorCents > txAberto(t)) return { erro: 'acima do saldo' };
  const novoPago = txPago(t) + valorCents;
  const quitou = novoPago >= (t.amount || 0);
  return {
    amount_paid: novoPago,
    status: quitou ? (t.type === 'INCOME' ? 'RECEIVED' : 'PAID') : 'PARTIAL',
  };
};

describe('baixa parcial', () => {
  const conta = () => ({ type: 'INCOME', amount: 100000, amount_paid: 0, status: 'PENDING' });

  test('baixa parcial deixa o resto em aberto e marca PARTIAL', () => {
    const r = baixar(conta(), 40000);
    expect(r.amount_paid).toBe(40000);
    expect(r.status).toBe('PARTIAL');
    expect(txAberto({ ...conta(), ...r })).toBe(60000);
  });

  test('somando as parcelas até o total, quita', () => {
    let t = conta();
    t = { ...t, ...baixar(t, 40000) };
    t = { ...t, ...baixar(t, 60000) };
    expect(t.status).toBe('RECEIVED');
    expect(txAberto(t)).toBe(0);
  });

  test('despesa quitada vira PAID, não RECEIVED', () => {
    const r = baixar({ type: 'EXPENSE', amount: 5000, amount_paid: 0 }, 5000);
    expect(r.status).toBe('PAID');
  });

  test('recusa valor acima do saldo em aberto', () => {
    expect(baixar({ ...conta(), amount_paid: 90000 }, 20000).erro).toBeTruthy();
  });

  test('conta quitada antes da migração conta valor cheio como efetivo', () => {
    const antiga = { type: 'INCOME', amount: 70000, status: 'RECEIVED' }; // sem amount_paid
    expect(txPago(antiga)).toBe(70000);
    expect(txAberto(antiga)).toBe(0);
  });

  test('conta pendente antiga não conta como recebida', () => {
    expect(txPago({ type: 'INCOME', amount: 70000, status: 'PENDING' })).toBe(0);
  });

  test('centavos não escorregam: três parcelas de 1/3', () => {
    let t = { type: 'INCOME', amount: 10000, amount_paid: 0 };
    t = { ...t, ...baixar(t, 3333) };
    t = { ...t, ...baixar(t, 3333) };
    t = { ...t, ...baixar(t, 3334) };
    expect(t.amount_paid).toBe(10000);
    expect(t.status).toBe('RECEIVED');
  });
});
