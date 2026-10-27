import { DreCompany } from '../dre/DreCompany.jsx';
import { BotaoExportar } from '../../../components/BotaoExportar.jsx';
import { DEFAULT_ACCOUNTING_CLASSES } from '../../../config/financial.js';
import { DreConsolidated } from '../dre/DreConsolidated.jsx';
import { DreCustomers } from '../dre/DreCustomers.jsx';
import { baixarCSV, csvNum, csvPct } from '../../../utils/csv.js';
import { fmt } from '../../../utils/format.js';
import { txPago } from '../calculations.js';

const DreTab = ({
  scopes, openEditTx, financialLoaded,
  InfoBtn,
  customers,
  dreBase,
  dreCustSearch,
  dreCustSort,
  dreCustStatusFilter,
  dreCustomerFilter,
  dreExpandedCust,
  drePeriod,
  dreTimeScope,
  dreViewMode,
  expenseCats,
  incomeCats,
  monthLabel,
  prevMonth,
  setDreBase,
  setDreCustSearch,
  setDreCustSort,
  setDreCustStatusFilter,
  setDreCustomerFilter,
  setDreExpandedCust,
  setDrePeriod,
  setDreTimeScope,
  setDreViewMode,
  transactions,
  txCatName,
}) =>
  (() => {
    const curM = drePeriod;
    const prevM = prevMonth(curM);
    const curLabel = monthLabel(curM);
    const prevLabel = monthLabel(prevM);

    const catMap = {};
    incomeCats.forEach((c) => {
      if (c && c.id) catMap[c.id] = c;
    });
    expenseCats.forEach((c) => {
      if (c && c.id) catMap[c.id] = c;
    });
    const getCls = (t) => {
      const cat = catMap[t.category_id];
      if (cat?.accounting_class) return cat.accounting_class;
      const name = cat?.name || t.cat || t.category;
      if (name && DEFAULT_ACCOUNTING_CLASSES[name]) return DEFAULT_ACCOUNTING_CLASSES[name];
      return t.type === 'INCOME' ? 'OUTRAS_RECEITAS' : 'OUTRAS_DESPESAS';
    };
    const getCatName = (t) => catMap[t.category_id]?.name || t.cat || t.category || 'Sem Categoria';
    const getCustName = (custId) => {
      if (!custId || custId === '__sem_cliente__') return 'Sem cliente — gerais e não classificados';
      const c = customers.find((x) => String(x.id) === String(custId));
      return c?.name || `Cliente #${String(custId).slice(0, 8)}`;
    };

    // Scope filtering for by_customer mode or consolidated mode
    const getScopedTxs = (period, scope) => {
      // Pagamento de fatura é quitação de passivo: a despesa já foi
      // reconhecida em cada compra, contar aqui dobraria o gasto.
      const base = transactions.filter((t) => getCls(t) !== 'PAGAMENTO_CARTAO');
      if (scope === 'all') return base;
      if (scope === 'year') {
        const yr = (period || '').slice(0, 4);
        return base.filter((t) => (dreBase === 'efetivo' ? t.paid_date || '' : t.due_date || t.due || '').startsWith(yr));
      }
      return base.filter((t) => (dreBase === 'efetivo' ? t.paid_date || '' : t.due_date || t.due || '').startsWith(period));
    };

    // Month-based filtering for consolidated CPC 26 DRE
    const txOfMonth = (m) => transactions.filter((t) => (t.due_date || t.due || '').startsWith(m));
    const applyCustomerFilter = (list, custFilter) => {
      if (!custFilter || custFilter === 'all') return list;
      if (custFilter === '__sem_cliente__') return list.filter((t) => !t.customer_id);
      return list.filter((t) => String(t.customer_id) === String(custFilter));
    };

    const rawCurTx = txOfMonth(curM);
    const rawPrevTx = txOfMonth(prevM);
    const curTx = applyCustomerFilter(rawCurTx, dreCustomerFilter);
    const prevTx = applyCustomerFilter(rawPrevTx, dreCustomerFilter);

    // helpers
    // Previsto = valor da conta (regime de competência, o padrão do DRE).
    // Efetivo = só o que foi baixado (regime de caixa).
    const valorDRE = (t) => (dreBase === 'efetivo' ? txPago(t) : t.amount || 0);
    const sumC = (txList, type, ...cls) =>
      txList.filter((t) => t.type === type && cls.includes(getCls(t))).reduce((s, t) => s + valorDRE(t), 0);
    const itemsFor = (type, ...cls) => {
      const cg = {},
        pg = {};
      curTx
        .filter((t) => t.type === type && cls.includes(getCls(t)))
        .forEach((t) => {
          const n = getCatName(t);
          cg[n] = (cg[n] || 0) + valorDRE(t);
        });
      prevTx
        .filter((t) => t.type === type && cls.includes(getCls(t)))
        .forEach((t) => {
          const n = getCatName(t);
          pg[n] = (pg[n] || 0) + valorDRE(t);
        });
      return [...new Set([...Object.keys(cg), ...Object.keys(pg)])]
        .map((n) => ({ n, c: cg[n] || 0, p: pg[n] || 0 }))
        .sort((a, b) => b.c - a.c);
    };

    // ── RECEITA BRUTA
    const recBruta = sumC(curTx, 'INCOME', 'RECEITA_SERVICO', 'RECEITA_CONTRATO', 'OUTRAS_RECEITAS');
    const recBrutaP = sumC(prevTx, 'INCOME', 'RECEITA_SERVICO', 'RECEITA_CONTRATO', 'OUTRAS_RECEITAS');
    // ── DEDUÇÕES
    const ded = sumC(curTx, 'EXPENSE', 'IMPOSTO_RECEITA');
    const dedP = sumC(prevTx, 'EXPENSE', 'IMPOSTO_RECEITA');
    const recLiq = recBruta - ded;
    const recLiqP = recBrutaP - dedP;
    // ── CSP
    const csp = sumC(curTx, 'EXPENSE', 'CSP');
    const cspP = sumC(prevTx, 'EXPENSE', 'CSP');
    const lb = recLiq - csp;
    const lbP = recLiqP - cspP;
    // ── DESPESAS OPERACIONAIS
    const dPes = sumC(curTx, 'EXPENSE', 'DESPESA_PESSOAL');
    const dPesP = sumC(prevTx, 'EXPENSE', 'DESPESA_PESSOAL');
    const dAdm = sumC(curTx, 'EXPENSE', 'DESPESA_ADMINISTRATIVA');
    const dAdmP = sumC(prevTx, 'EXPENSE', 'DESPESA_ADMINISTRATIVA');
    const dCom = sumC(curTx, 'EXPENSE', 'DESPESA_COMERCIAL');
    const dComP = sumC(prevTx, 'EXPENSE', 'DESPESA_COMERCIAL');
    const dOut = sumC(curTx, 'EXPENSE', 'OUTRAS_DESPESAS');
    const dOutP = sumC(prevTx, 'EXPENSE', 'OUTRAS_DESPESAS');
    const totOp = dPes + dAdm + dCom + dOut;
    const totOpP = dPesP + dAdmP + dComP + dOutP;
    const ebit = lb - totOp;
    const ebitP = lbP - totOpP;
    // ── DEPRECIAÇÃO / EBITDA
    const da = sumC(curTx, 'EXPENSE', 'DEPRECIACAO');
    const daP = sumC(prevTx, 'EXPENSE', 'DEPRECIACAO');
    const ebitda = ebit + da;
    const ebitdaP = ebitP + daP;
    // ── RESULTADO FINANCEIRO
    const rFin = sumC(curTx, 'INCOME', 'RECEITA_FINANCEIRA');
    const rFinP = sumC(prevTx, 'INCOME', 'RECEITA_FINANCEIRA');
    const dFin = sumC(curTx, 'EXPENSE', 'DESPESA_FINANCEIRA');
    const dFinP = sumC(prevTx, 'EXPENSE', 'DESPESA_FINANCEIRA');
    const resFinLiq = rFin - dFin;
    const resFinLiqP = rFinP - dFinP;
    // ── LAIR / IR / LL
    const lair = ebit + resFinLiq;
    const lairP = ebitP + resFinLiqP;
    const ir = sumC(curTx, 'EXPENSE', 'IMPOSTO_RENDA');
    const irP = sumC(prevTx, 'EXPENSE', 'IMPOSTO_RENDA');
    const ll = lair - ir;
    const llP = lairP - irP;

    const hasData = curTx.length > 0 || prevTx.length > 0;
    const fv = (v) => (v === 0 ? '—' : v < 0 ? `(${fmt(Math.abs(v))})` : fmt(v));
    const av = (v, base) => (base === 0 ? '—' : ((v / base) * 100).toFixed(1) + '%');
    const vp = (c, p) => {
      if (!p) return { l: '—', u: null };
      const d = ((c - p) / Math.abs(p)) * 100;
      return { l: (d > 0 ? '+' : '') + d.toFixed(1) + '%', u: d > 0 };
    };

    const monthOptions = Array.from({ length: 13 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      return d.toISOString().slice(0, 7);
    });

    // ════════════════════════════════════════════════════════════════════════
    // CÁLCULOS DA DRE POR CLIENTE
    // ════════════════════════════════════════════════════════════════════════
    const originalScopedTxs = getScopedTxs(curM, dreTimeScope);
    const customerScopedTxs = originalScopedTxs.map(t => ({ ...t, amount: dreBase === 'efetivo' ? txPago(t) : t.amount }));
    const scopeLabel =
      dreTimeScope === 'month'
        ? monthLabel(curM)
        : dreTimeScope === 'year'
          ? `Ano ${curM.slice(0, 4)} (Acumulado)`
          : 'Todo o Histórico';

    // Mapa de clientes
    const custMetricsMap = new Map();
    customers.forEach((c) => {
      custMetricsMap.set(String(c.id), {
        id: c.id,
        name: c.name,
        type: c.type || 'PJ',
        doc: c.doc || '',
        city: c.city || '',
      });
    });

    // Clientes em transações não listados em customers
    customerScopedTxs.forEach((t) => {
      if (t.customer_id && !custMetricsMap.has(String(t.customer_id))) {
        custMetricsMap.set(String(t.customer_id), {
          id: t.customer_id,
          name: t.customers?.name || `Cliente #${String(t.customer_id).slice(0, 8)}`,
          type: t.customers?.type || 'PJ',
          doc: '',
          city: '',
        });
      }
    });

    // Calcula DRE para cada cliente
    const customerMetricsList = Array.from(custMetricsMap.values()).map((cust) => {
      const custTxs = customerScopedTxs.filter((t) => String(t.customer_id) === String(cust.id));
      const incList = custTxs.filter((t) => t.type === 'INCOME');
      const expList = custTxs.filter((t) => t.type === 'EXPENSE');

      const grossRev = incList.reduce((s, t) => s + (t.amount || 0), 0);
      const dedTaxes = expList.filter((t) => getCls(t) === 'IMPOSTO_RECEITA').reduce((s, t) => s + (t.amount || 0), 0);
      const netRev = grossRev - dedTaxes;

      const cspCosts = expList.filter((t) => getCls(t) === 'CSP').reduce((s, t) => s + (t.amount || 0), 0);
      const grossPrf = netRev - cspCosts;
      const grossMg = netRev > 0 ? (grossPrf / netRev) * 100 : grossRev > 0 ? (grossPrf / grossRev) * 100 : 0;

      const opExp = expList
        .filter((t) => getCls(t) !== 'CSP' && getCls(t) !== 'IMPOSTO_RECEITA')
        .reduce((s, t) => s + (t.amount || 0), 0);
      const totExp = expList.reduce((s, t) => s + (t.amount || 0), 0);
      const netPrf = grossRev - totExp;
      const netMg =
        netRev > 0 ? (netPrf / netRev) * 100 : grossRev > 0 ? (netPrf / grossRev) * 100 : netPrf < 0 ? -100 : 0;

      // Composição por categoria
      const cats = {};
      custTxs.forEach((t) => {
        const cName = getCatName(t);
        if (!cats[cName]) cats[cName] = { name: cName, type: t.type, cls: getCls(t), total: 0, count: 0 };
        cats[cName].total += t.amount || 0;
        cats[cName].count += 1;
      });

      return {
        ...cust,
        transactions: custTxs,
        incomeCount: incList.length,
        expenseCount: expList.length,
        totalCount: custTxs.length,
        grossRevenue: grossRev,
        deductions: dedTaxes,
        netRevenue: netRev,
        csp: cspCosts,
        grossProfit: grossPrf,
        grossMargin: grossMg,
        opExpenses: opExp,
        totalExpense: totExp,
        netProfit: netPrf,
        netMargin: netMg,
        catBreakdown: Object.values(cats).sort((a, b) => b.total - a.total),
        hasActivity: custTxs.length > 0,
      };
    });

    // Custos Gerais da Sede (Sem cliente vinculado)
    const unassignedTxs = customerScopedTxs.filter((t) => !t.customer_id);
    const unassignedInc = unassignedTxs.filter((t) => t.type === 'INCOME');
    const unassignedExp = unassignedTxs.filter((t) => t.type === 'EXPENSE');
    const unassignedGrossRev = unassignedInc.reduce((s, t) => s + (t.amount || 0), 0);
    const unassignedDed = unassignedExp
      .filter((t) => getCls(t) === 'IMPOSTO_RECEITA')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const unassignedNetRev = unassignedGrossRev - unassignedDed;
    const unassignedCsp = unassignedExp.filter((t) => getCls(t) === 'CSP').reduce((s, t) => s + (t.amount || 0), 0);
    const unassignedGrossPrf = unassignedNetRev - unassignedCsp;
    const unassignedOpExp = unassignedExp
      .filter((t) => getCls(t) !== 'CSP' && getCls(t) !== 'IMPOSTO_RECEITA')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const unassignedTotExp = unassignedExp.reduce((s, t) => s + (t.amount || 0), 0);
    const unassignedNetPrf = unassignedGrossRev - unassignedTotExp;

    const unassignedCats = {};
    unassignedTxs.forEach((t) => {
      const cName = getCatName(t);
      if (!unassignedCats[cName])
        unassignedCats[cName] = { name: cName, type: t.type, cls: getCls(t), total: 0, count: 0 };
      unassignedCats[cName].total += t.amount || 0;
      unassignedCats[cName].count += 1;
    });

    const unassignedItem = {
      id: '__sem_cliente__',
      name: 'Sem cliente — gerais e não classificados',
      type: 'ESTRUTURAL',
      transactions: unassignedTxs,
      incomeCount: unassignedInc.length,
      expenseCount: unassignedExp.length,
      totalCount: unassignedTxs.length,
      grossRevenue: unassignedGrossRev,
      deductions: unassignedDed,
      netRevenue: unassignedNetRev,
      csp: unassignedCsp,
      grossProfit: unassignedGrossPrf,
      grossMargin: unassignedNetRev > 0 ? (unassignedGrossPrf / unassignedNetRev) * 100 : 0,
      opExpenses: unassignedOpExp,
      totalExpense: unassignedTotExp,
      netProfit: unassignedNetPrf,
      netMargin: unassignedNetRev > 0 ? (unassignedNetPrf / unassignedNetRev) * 100 : 0,
      catBreakdown: Object.values(unassignedCats).sort((a, b) => b.total - a.total),
      hasActivity: unassignedTxs.length > 0,
    };

    // Totais Gerais
    const allItemsForTotals = [...customerMetricsList, unassignedItem];
    const totalGrossRevenue = allItemsForTotals.reduce((s, c) => s + c.grossRevenue, 0);
    const totalDeductions = allItemsForTotals.reduce((s, c) => s + c.deductions, 0);
    const totalNetRevenue = totalGrossRevenue - totalDeductions;
    const totalCsp = allItemsForTotals.reduce((s, c) => s + c.csp, 0);
    const totalGrossProfit = totalNetRevenue - totalCsp;
    const totalOpExpenses = allItemsForTotals.reduce((s, c) => s + c.opExpenses, 0);
    const totalExpensesAll = allItemsForTotals.reduce((s, c) => s + c.totalExpense, 0);
    const totalNetProfitAll = totalGrossRevenue - totalExpensesAll;
    const overallNetMargin = totalNetRevenue > 0 ? (totalNetProfitAll / totalNetRevenue) * 100 : 0;

    // Filtragem e ordenação para a tabela
    let displayedCustList = customerMetricsList.filter((c) => {
      if (dreCustSearch && !c.name.toLowerCase().includes(dreCustSearch.toLowerCase())) return false;
      if (dreCustStatusFilter === 'with_movement' && !c.hasActivity) return false;
      if (dreCustStatusFilter === 'profit_only' && c.netProfit <= 0) return false;
      if (dreCustStatusFilter === 'loss_only' && (c.netProfit >= 0 || !c.hasActivity)) return false;
      return true;
    });

    displayedCustList.sort((a, b) => {
      if (dreCustSort === 'profit_desc') return b.netProfit - a.netProfit;
      if (dreCustSort === 'profit_asc') return a.netProfit - b.netProfit;
      if (dreCustSort === 'margin_desc') return b.netMargin - a.netMargin;
      if (dreCustSort === 'revenue_desc') return b.grossRevenue - a.grossRevenue;
      if (dreCustSort === 'name_asc') return a.name.localeCompare(b.name);
      return b.netProfit - a.netProfit;
    });

    // Top performers da carteira
    const activeCustomers = customerMetricsList.filter((c) => c.hasActivity);
    const topProfitCust = activeCustomers.slice().sort((a, b) => b.netProfit - a.netProfit)[0] || null;
    const topRevenueCust = activeCustomers.slice().sort((a, b) => b.grossRevenue - a.grossRevenue)[0] || null;
    const lossCustomers = activeCustomers.filter((c) => c.netProfit < 0);
    const lossTotal = lossCustomers.reduce((s, c) => s + Math.abs(c.netProfit), 0);
    const maxProfitVal = topProfitCust && topProfitCust.netProfit > 0 ? topProfitCust.netProfit : 1;

    // Row components para a DRE consolidada
    const HR = ({ l }) => (
      <tr className="bg-gray-100 border-t-2 border-gray-300">
        <td colSpan="5" className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          {l}
        </td>
      </tr>
    );
    const SubHR = ({ l }) => (
      <tr className="bg-gray-50 border-t border-gray-200">
        <td colSpan="5" className="px-4 py-1.5 text-xs font-semibold text-gray-500 pl-6">
          {l}
        </td>
      </tr>
    );
    const IR2 = ({ l, c, p, neg = false, ind = 1 }) => {
      const { l: vl, u } = vp(c, p);
      const pl = ind === 1 ? 'pl-8' : 'pl-12';
      const cv = neg ? `(${fv(c)})` : fv(c);
      const pv2 = neg ? `(${fv(p)})` : fv(p);
      return (
        <tr className="hover:bg-gray-50 border-t border-gray-100">
          <td className={`px-4 py-2 text-xs text-gray-500 ${pl}`}>{l}</td>
          <td className={`px-4 py-2 text-xs text-right ${neg ? 'text-red-500' : 'text-gray-700'}`}>{cv}</td>
          <td className="px-4 py-2 text-xs text-gray-300 text-right">—</td>
          <td
            className={`px-3 py-2 text-xs text-center font-medium ${vl === '—' ? 'text-gray-300' : u === null ? 'text-gray-400' : neg ? (u ? 'text-red-500' : 'text-green-600') : u ? 'text-green-600' : 'text-red-500'}`}
          >
            {vl}
          </td>
          <td className={`px-4 py-2 text-xs text-right ${neg ? 'text-red-400' : 'text-gray-500'}`}>{pv2}</td>
        </tr>
      );
    };
    const STR = ({ l, c, p, base = recLiq, neg = false }) => {
      const { l: vl, u } = vp(c, p);
      const cv = neg ? `(${fv(c)})` : fv(c);
      const pv2 = neg ? `(${fv(p)})` : fv(p);
      return (
        <tr className="bg-gray-50 border-t border-gray-200">
          <td className="px-4 py-2.5 text-xs font-semibold text-gray-700 pl-6">{l}</td>
          <td className={`px-4 py-2.5 text-xs font-semibold text-right ${neg ? 'text-red-600' : 'text-gray-800'}`}>
            {cv}
          </td>
          <td className="px-4 py-2.5 text-xs text-gray-400 text-right">{base > 0 ? av(c, base) : '—'}</td>
          <td
            className={`px-3 py-2.5 text-xs font-semibold text-center ${vl === '—' ? 'text-gray-300' : u ? 'text-green-600' : 'text-red-500'}`}
          >
            {vl}
          </td>
          <td className={`px-4 py-2.5 text-xs font-medium text-right ${neg ? 'text-red-500' : 'text-gray-600'}`}>
            {pv2}
          </td>
        </tr>
      );
    };
    const RR = ({ l, c, p, base = recLiq, hl = 'green' }) => {
      const { l: vl, u } = vp(c, p);
      const pos = c >= 0;
      const s = {
        green: {
          bg: pos ? 'bg-green-50' : 'bg-red-50',
          tc: pos ? 'text-green-900' : 'text-red-800',
          vc: pos ? 'text-green-800' : 'text-red-700',
          vp2: pos ? 'text-green-700' : 'text-red-600',
        },
        blue: { bg: 'bg-blue-50', tc: 'text-blue-900', vc: 'text-blue-800', vp2: 'text-blue-600' },
        navy: { bg: 'bg-blue-700', tc: 'text-white', vc: 'text-white', vp2: 'text-blue-200' },
      };
      const C = s[hl] || s.green;
      return (
        <tr className={`border-t-2 border-gray-200 ${C.bg}`}>
          <td className={`px-4 py-3 text-sm font-bold ${C.tc}`}>{l}</td>
          <td className={`px-4 py-3 text-sm font-bold text-right ${C.vc}`}>{fv(c)}</td>
          <td className={`px-4 py-3 text-xs text-right font-medium ${C.vc}`}>{base > 0 ? av(c, base) : '—'}</td>
          <td
            className={`px-3 py-3 text-xs font-bold text-center ${vl === '—' ? 'text-gray-300' : u ? 'text-green-500' : 'text-red-400'}`}
          >
            {vl}
          </td>
          <td className={`px-4 py-3 text-sm font-semibold text-right ${C.vp2}`}>{fv(p)}</td>
        </tr>
      );
    };

    // Exporta a visão que está aberta: a consolidada sai no formato do
    // demonstrativo; a por cliente sai como uma linha por cliente.
    const baseLabel =
      dreBase === 'efetivo' ? 'Efetivo (caixa — só o que foi baixado)' : 'Previsto (competência — valor das contas)';
    const exportarDRE = () => {
      const cab = [['Base', baseLabel], ['Gerado em', new Date().toLocaleString('pt-BR')], []];
      if (dreViewMode === 'consolidated') {
        const L = (rot, c, p) => [rot, csvNum(c), recBruta > 0 ? csvPct((c / recBruta) * 100) : '', csvNum(p)];
        baixarCSV(`DRE_consolidada_${curM}.csv`, [
          ['DRE — Demonstração do Resultado do Exercício (CPC 26)'],
          ['Competência', curLabel],
          ['Comparativo', prevLabel],
          dreCustomerFilter !== 'all' ? ['Cliente', getCustName(dreCustomerFilter)] : [],
          ...cab,
          ['Conta', `${curLabel} (R$)`, 'AV % s/ Receita Bruta', `${prevLabel} (R$)`],
          L('RECEITA OPERACIONAL BRUTA', recBruta, recBrutaP),
          L('(-) Deduções da Receita (ISS, PIS, COFINS)', -ded, -dedP),
          L('(=) RECEITA OPERACIONAL LÍQUIDA', recLiq, recLiqP),
          L('(-) Custo dos Serviços Prestados (CSP)', -csp, -cspP),
          L('(=) LUCRO BRUTO', lb, lbP),
          L('(-) Despesas com Pessoal', -dPes, -dPesP),
          L('(-) Despesas Administrativas', -dAdm, -dAdmP),
          L('(-) Despesas Comerciais', -dCom, -dComP),
          L('(-) Outras Despesas Operacionais', -dOut, -dOutP),
          L('(=) Total das Despesas Operacionais', -totOp, -totOpP),
          L('(=) EBIT — Resultado Operacional', ebit, ebitP),
          L('(+) Depreciação e Amortização', da, daP),
          L('(=) EBITDA', ebitda, ebitdaP),
          L('(+) Receitas Financeiras', rFin, rFinP),
          L('(-) Despesas Financeiras', -dFin, -dFinP),
          L('(=) Resultado Financeiro Líquido', resFinLiq, resFinLiqP),
          L('(=) LAIR — Resultado antes do IR/CSLL', lair, lairP),
          L('(-) IR e CSLL', -ir, -irP),
          L('(=) LUCRO/PREJUÍZO LÍQUIDO DO EXERCÍCIO', ll, llP),
        ]);
      } else {
        const linha = (c) => [
          c.name,
          c.type || '',
          csvNum(c.grossRevenue),
          csvNum(c.deductions),
          csvNum(c.netRevenue),
          csvNum(c.csp),
          csvNum(c.grossProfit),
          csvPct(c.grossMargin),
          csvNum(c.opExpenses),
          csvNum(c.totalExpense),
          csvNum(c.netProfit),
          csvPct(c.netMargin),
          c.totalCount,
        ];
        baixarCSV(`DRE_por_cliente_${curM}.csv`, [
          ['DRE Gerencial por Cliente'],
          ['Período', scopeLabel],
          // a visão por cliente soma sempre o valor das contas
          ['Base', 'Previsto (competência — valor das contas)'],
          ['Gerado em', new Date().toLocaleString('pt-BR')],
          [],
          [
            'Cliente',
            'Tipo',
            'Receita Bruta (R$)',
            'Deduções (R$)',
            'Receita Líquida (R$)',
            'CSP (R$)',
            'Lucro Bruto (R$)',
            'Margem Bruta (%)',
            'Despesas Operacionais (R$)',
            'Despesa Total (R$)',
            'Resultado Líquido (R$)',
            'Margem Líquida (%)',
            'Lançamentos',
          ],
          ...displayedCustList.map(linha),
          linha(unassignedItem),
          [],
          [
            'TOTAL GERAL',
            '',
            csvNum(totalGrossRevenue),
            csvNum(totalDeductions),
            csvNum(totalNetRevenue),
            csvNum(totalCsp),
            csvNum(totalGrossProfit),
            '',
            csvNum(totalOpExpenses),
            csvNum(totalExpensesAll),
            csvNum(totalNetProfitAll),
            csvPct(overallNetMargin),
            '',
          ],
        ]);
      }
    };

    return (
      <div className="space-y-4">
        {/* Barra Superior de Navegação do DRE */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-800">DRE — Demonstração do Resultado</h2>
              <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2.5 py-0.5 rounded-full">
                Controladoria & Custos por Obra
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Analise a saúde financeira global da Opticom e a lucratividade gerada por cada cliente e contrato
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Seletor de Modo: Por Cliente vs Consolidada */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setDreViewMode('by_customer')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${dreViewMode === 'by_customer' ? 'bg-white text-purple-700 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <span>👥</span> DRE por Cliente
              </button>
              <button
                onClick={() => setDreViewMode('consolidated')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${dreViewMode === 'consolidated' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <span>📊</span> DRE Consolidada (CPC 26)
              </button>
            </div>

            <button onClick={() => setDreViewMode('company')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${dreViewMode === 'company' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>DRE Geral da Empresa</button>
            {/* Base: valor das contas x valor efetivamente baixado */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {[
                ['previsto', 'Previsto', 'competência — valor das contas'],
                ['efetivo', 'Efetivo', 'caixa — só o que foi baixado'],
              ].map(([v, l, t]) => (
                <button
                  key={v}
                  onClick={() => setDreBase(v)}
                  title={t}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dreBase === v ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Seletor de Mês */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
              <span className="text-xs text-gray-400">Ref:</span>
              <select
                value={drePeriod}
                onChange={(e) => setDrePeriod(e.target.value)}
                className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
            </div>
            {dreViewMode !== 'company' && <BotaoExportar
              onClick={exportarDRE}
              title={
                dreViewMode === 'consolidated'
                  ? 'Baixa a DRE consolidada do mês, com comparativo e AV%, em CSV (abre no Excel)'
                  : 'Baixa uma linha por cliente, com receita, custo e margem, em CSV (abre no Excel)'
              }
            />}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* VISÃO 1: DRE POR CLIENTE                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {dreViewMode === 'company' && <>
          <select aria-label="Período do DRE geral" value={dreTimeScope} onChange={e => setDreTimeScope(e.target.value)} className="border rounded-lg p-2 text-sm"><option value="month">Mês selecionado</option><option value="year">Ano selecionado</option><option value="all">Todo o histórico</option></select>
          <DreCompany financialLoaded={financialLoaded} transactions={originalScopedTxs} categories={[...incomeCats, ...expenseCats]} scopes={scopes} base={dreBase} openEditTx={openEditTx} customers={customers} />
        </>}
        {dreViewMode === 'by_customer' && (
          <DreCustomers
            activeCustomers={activeCustomers}
            curM={curM}
            customerMetricsList={customerMetricsList}
            customerScopedTxs={customerScopedTxs}
            displayedCustList={displayedCustList}
            dreCustSearch={dreCustSearch}
            dreCustSort={dreCustSort}
            dreCustStatusFilter={dreCustStatusFilter}
            dreExpandedCust={dreExpandedCust}
            dreTimeScope={dreTimeScope}
            fv={fv}
            lossCustomers={lossCustomers}
            lossTotal={lossTotal}
            maxProfitVal={maxProfitVal}
            overallNetMargin={overallNetMargin}
            scopeLabel={scopeLabel}
            setDreCustSearch={setDreCustSearch}
            setDreCustSort={setDreCustSort}
            setDreCustStatusFilter={setDreCustStatusFilter}
            setDreCustomerFilter={setDreCustomerFilter}
            setDreExpandedCust={setDreExpandedCust}
            setDreTimeScope={setDreTimeScope}
            setDreViewMode={setDreViewMode}
            topProfitCust={topProfitCust}
            topRevenueCust={topRevenueCust}
            totalCsp={totalCsp}
            totalDeductions={totalDeductions}
            totalGrossProfit={totalGrossProfit}
            totalGrossRevenue={totalGrossRevenue}
            totalNetProfitAll={totalNetProfitAll}
            totalNetRevenue={totalNetRevenue}
            totalOpExpenses={totalOpExpenses}
            txCatName={txCatName}
            unassignedItem={unassignedItem}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* VISÃO 2: DRE CONSOLIDADA (CPC 26)                           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {dreViewMode === 'consolidated' && (
          <DreConsolidated
            HR={HR}
            IR2={IR2}
            InfoBtn={InfoBtn}
            RR={RR}
            STR={STR}
            SubHR={SubHR}
            av={av}
            csp={csp}
            cspP={cspP}
            curLabel={curLabel}
            customerMetricsList={customerMetricsList}
            dAdm={dAdm}
            dAdmP={dAdmP}
            dCom={dCom}
            dComP={dComP}
            dFin={dFin}
            dFinP={dFinP}
            dOut={dOut}
            dOutP={dOutP}
            dPes={dPes}
            dPesP={dPesP}
            da={da}
            daP={daP}
            ded={ded}
            dedP={dedP}
            dreCustomerFilter={dreCustomerFilter}
            ebit={ebit}
            ebitP={ebitP}
            ebitda={ebitda}
            ebitdaP={ebitdaP}
            fv={fv}
            getCustName={getCustName}
            hasData={hasData}
            ir={ir}
            irP={irP}
            itemsFor={itemsFor}
            lair={lair}
            lairP={lairP}
            lb={lb}
            lbP={lbP}
            ll={ll}
            llP={llP}
            prevLabel={prevLabel}
            rFin={rFin}
            rFinP={rFinP}
            recBruta={recBruta}
            recBrutaP={recBrutaP}
            recLiq={recLiq}
            recLiqP={recLiqP}
            resFinLiq={resFinLiq}
            resFinLiqP={resFinLiqP}
            setDreCustomerFilter={setDreCustomerFilter}
            setDreViewMode={setDreViewMode}
            totOp={totOp}
            totOpP={totOpP}
            unassignedItem={unassignedItem}
            vp={vp}
          />
        )}
      </div>
    );
  })();

export { DreTab };
