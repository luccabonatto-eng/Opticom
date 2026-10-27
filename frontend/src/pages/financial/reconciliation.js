import { txPago } from './calculations.js';
export const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0,10) === value;
export const mergeLines = (existing, incoming) => {
  const result = new Map(existing.map(l => [l.id,l]));
  for (const line of incoming) {
    if (!validDate(line.date) || !Number.isSafeInteger(line.amount) || line.amount <= 0 || !['CREDIT','DEBIT'].includes(line.type)) throw new Error('Extrato contém data ou valor inválido. Confira o arquivo.');
    const prior = result.get(line.id);
    if (prior && (prior.amount !== line.amount || prior.type !== line.type || prior.date !== line.date)) throw new Error('Movimento já importado com dados diferentes. Confira o extrato antes de continuar.');
    result.set(line.id, prior || line);
  }
  return [...result.values()].sort((a,b)=>a.date.localeCompare(b.date));
};
export const reconcile = ({lines, transactions, links, accountId, from, to}) => {
  const within = date => validDate(date) && date >= from && date <= to;
  const selected = lines.filter(l => within(l.date));
  const paid = transactions.filter(t => txPago(t) > 0);
  const incomplete = paid.filter(t => (!t.bank_account_id && (within(t.paid_date) || !validDate(t.paid_date))) || (String(t.bank_account_id) === String(accountId) && !validDate(t.paid_date)));
  const scoped = paid.filter(t => String(t.bank_account_id) === String(accountId) && within(t.paid_date));
  const txMap = new Map(paid.filter(t => String(t.bank_account_id) === String(accountId)).map(t => [String(t.id),t]));
  const linkedTotals = {};
  for (const l of lines) if (links[l.id]) linkedTotals[links[l.id]] = (linkedTotals[links[l.id]] || 0) + l.amount;
  const validLinks = new Set();
  for (const l of selected) {
    const t = txMap.get(String(links[l.id]));
    if (t && within(t.paid_date) && (t.type === 'INCOME') === (l.type === 'CREDIT') && linkedTotals[t.id] === txPago(t)) {
      const allSameDirection = lines.filter(x => links[x.id] === links[l.id]).every(x => (x.type === 'CREDIT') === (t.type === 'INCOME') && within(x.date));
      if (allSameDirection) validLinks.add(l.id);
    }
  }
  const confirmed = selected.filter(l=>validLinks.has(l.id));
  const matched = new Set(confirmed.map(l=>String(links[l.id])));
  const pending = selected.filter(l=>!validLinks.has(l.id));
  const unmatched = scoped.filter(t=>!matched.has(String(t.id)));
  const sum = (list, type, get) => list.filter(t=>t.type===type).reduce((s,t)=>s+get(t),0);
  const bankIn = sum(selected,'CREDIT',t=>t.amount), bankOut = sum(selected,'DEBIT',t=>t.amount);
  const systemIn = sum(scoped,'INCOME',txPago), systemOut = sum(scoped,'EXPENSE',txPago);
  const difference = bankIn-bankOut-systemIn+systemOut;
  return { selected, scoped, incomplete, pending, unmatched, confirmed, linkedTotals, bankIn, bankOut, systemIn, systemOut, difference,
    complete: !!accountId && selected.length > 0 && !pending.length && !unmatched.length && !incomplete.length && difference===0 };
};
