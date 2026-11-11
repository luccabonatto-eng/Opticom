import { semAcento } from './parsers.js';

const txPago = (t) => {
  if (t.amount_paid != null) return t.amount_paid;
  return t.status === 'PAID' || t.status === 'RECEIVED' ? t.amount || 0 : 0;
};

const txAberto = (t) => Math.max(0, (t.amount || 0) - txPago(t));

const soma = (list, f) => list.reduce((s, t) => s + f(t), 0);

const faturaDe = (t) => (t.due_date || '').slice(0, 7);

const txDue = (t) => t.due_date || t.due || '';

// Vencido é consequência, não um estado que alguém marca: tem saldo em aberto e
// a data já passou. Antes dependia de marcação manual, então o card "Vencidos"
// ficava zerado para sempre e o atraso se escondia dentro de "Pendentes".
// `hoje` é parâmetro para a regra não depender do relógio — e porque um default
// seria preenchido com o índice em `lista.filter(txVencido)`.
const txVencido = (t, hoje) => txAberto(t) > 0 && !!txDue(t) && txDue(t) < hoje;

const txStatus = (t, hoje) =>
  txVencido(t, hoje)
    ? 'OVERDUE'
    : t.status === 'OVERDUE'
      ? txPago(t) > 0
        ? 'PARTIAL'
        : 'PENDING'
      : t.status;

const casaBusca = (t, q) => !q || semAcento(t.description || '').includes(semAcento(q));

// Ela trabalha do mais atrasado para o mais recente; a lista vinha ao contrário.
const porVencimento = (a, b) => (txDue(a) || '').localeCompare(txDue(b) || '');

// Indicadores do DRE gerencial, sempre sobre a receita líquida (centavos).
// Ponto de equilíbrio: receita líquida que paga os custos fixos. Sem margem de
// contribuição positiva não existe — vender mais só aumentaria o prejuízo.
const indicadoresGerenciais = ({ recLiq, mc, fixos, lucro }) => {
  const pct = (v) => (recLiq > 0 ? (v / recLiq) * 100 : null);
  const equilibrio = recLiq > 0 && mc > 0 ? Math.round((fixos * recLiq) / mc) : null;
  return { mcPct: pct(mc), lucroPct: pct(lucro), equilibrio, folga: equilibrio == null ? null : recLiq - equilibrio };
};

export {
  txPago,
  txAberto,
  soma,
  faturaDe,
  txDue,
  txVencido,
  txStatus,
  casaBusca,
  porVencimento,
  indicadoresGerenciais,
};
