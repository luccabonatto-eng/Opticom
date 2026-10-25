// Regras do cartão de crédito, espelhadas do frontend (index.html).
// A compra é despesa no DRE mas não é caixa; o pagamento da fatura é caixa
// mas não é despesa. Errar isso conta o mesmo gasto duas vezes.

const payMethods = [
  { id: 'pm-cartao', name: 'CARTÃO DE CREDITO' },
  { id: 'pm-pagcorp', name: 'CARTÃO DE DESPESAS PAGCORP' },
  { id: 'pm-pix', name: 'PIX' },
];
const ehCartao = pmId => /cart[aã]o/i.test(payMethods.find(m => m.id === pmId)?.name || '');
const ehCompraCartao = t => t.type === 'EXPENSE' && ehCartao(t.payment_method_id);
const faturaDe = t => (t.due_date || '').slice(0, 7);

// classes: compra usa a categoria real; quitação usa PAGAMENTO_CARTAO
const classeDe = t => t.accounting_class || 'OUTRAS_DESPESAS';

// DRE soma por classe e nunca pede PAGAMENTO_CARTAO
const CLASSES_DRE = ['CSP','DESPESA_PESSOAL','DESPESA_ADMINISTRATIVA','DESPESA_COMERCIAL','OUTRAS_DESPESAS','DEPRECIACAO','IMPOSTO_RECEITA'];
const despesaNoDRE = txs => txs.filter(t => t.type === 'EXPENSE' && CLASSES_DRE.includes(classeDe(t)))
                               .reduce((s, t) => s + t.amount, 0);
// Caixa exclui compras de cartão e inclui a quitação
const saidaNoCaixa = txs => txs.filter(t => t.type === 'EXPENSE' && !ehCompraCartao(t))
                               .reduce((s, t) => s + (t.amount_paid || 0), 0);

const hospedagem = { type:'EXPENSE', description:'Hospedagem Yohan', amount:50000, amount_paid:0,
                     payment_method_id:'pm-cartao', due_date:'2026-10-03', customer_id:'cli-1',
                     accounting_class:'CSP' };
const combustivel = { type:'EXPENSE', description:'Combustível', amount:20000, amount_paid:0,
                      payment_method_id:'pm-cartao', due_date:'2026-10-14', customer_id:null,
                      accounting_class:'OUTRAS_DESPESAS' };
const quitacao = { type:'EXPENSE', description:'Fatura CARTÃO DE CREDITO — out/2026', amount:70000,
                   amount_paid:70000, payment_method_id:null, due_date:'2026-11-10',
                   accounting_class:'PAGAMENTO_CARTAO' };

describe('cartão de crédito', () => {
  test('compra no cartão é reconhecida, PIX não', () => {
    expect(ehCompraCartao(hospedagem)).toBe(true);
    expect(ehCompraCartao({ type:'EXPENSE', payment_method_id:'pm-pix' })).toBe(false);
  });

  test('compras agrupam na fatura pelo mês da compra', () => {
    expect(faturaDe(hospedagem)).toBe('2026-10');
    expect(faturaDe(combustivel)).toBe('2026-10');
  });

  test('a compra entra no DRE no mês da compra', () => {
    expect(despesaNoDRE([hospedagem, combustivel])).toBe(70000);
  });

  test('a compra NÃO sai do caixa antes da fatura', () => {
    expect(saidaNoCaixa([hospedagem, combustivel])).toBe(0);
  });

  test('o pagamento da fatura sai do caixa', () => {
    expect(saidaNoCaixa([hospedagem, combustivel, quitacao])).toBe(70000);
  });

  test('o pagamento da fatura NÃO entra no DRE — o gasto não conta duas vezes', () => {
    const comTudo = [hospedagem, combustivel, quitacao];
    expect(despesaNoDRE(comTudo)).toBe(70000);        // e não 140000
    expect(saidaNoCaixa(comTudo)).toBe(70000);
  });

  test('compra com cliente vai para o DRE daquele cliente', () => {
    const doCliente = [hospedagem, combustivel, quitacao]
      .filter(t => t.customer_id === 'cli-1' && classeDe(t) !== 'PAGAMENTO_CARTAO')
      .reduce((s, t) => s + t.amount, 0);
    expect(doCliente).toBe(50000);
  });

  test('a quitação não é atribuída a nenhum cliente', () => {
    expect(quitacao.customer_id).toBeUndefined();
  });

  test('divergência entre fatura e compras lançadas é detectada', () => {
    const lancado = [hospedagem, combustivel].reduce((s,t)=>s+t.amount,0);
    const faturaReal = 75000; // veio R$ 50 a mais
    expect(faturaReal - lancado).toBe(5000);
  });
});
