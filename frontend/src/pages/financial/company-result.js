import { txPago } from './calculations.js';
export const transactionScope = (tx, scopes) => tx.customer_id ? 'clients' : scopes[tx.id] === 'general' ? 'general' : 'unassigned';
export const companyResult = (transactions, scopes, categories, base) => {
  const empty = () => ({ income: 0, expense: 0, result: 0, transactions: [] });
  const result = { clients: empty(), general: empty(), unassigned: empty(), total: empty() };
  const cats = new Map(categories.map(c => [c.id, c.accounting_class]));
  for (const tx of transactions) {
    if ((cats.get(tx.category_id) || tx.accounting_class) === 'PAGAMENTO_CARTAO') continue;
    const value = base === 'efetivo' ? txPago(tx) : tx.amount || 0;
    for (const bucket of [result[transactionScope(tx, scopes)], result.total]) {
      bucket[tx.type === 'INCOME' ? 'income' : 'expense'] += value;
      bucket.result = bucket.income - bucket.expense;
      bucket.transactions.push(tx);
    }
  }
  return result;
};
