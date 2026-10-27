import { BotaoExportar } from '../../../components/BotaoExportar.jsx';
import { baixarCSV, csvNum } from '../../../utils/csv.js';
import { fmt, fmtDate } from '../../../utils/format.js';
import { txPago } from '../calculations.js';

const CashFlowTab = ({
  DateFilter,
  InfoBtn,
  bankAccounts,
  dateFromCF,
  dateToCF,
  ehCompraCartao,
  expenseCats,
  incomeCats,
  monthLabel,
  projectedFlow,
  setDateFromCF,
  setDateToCF,
  transactions,
}) =>
  (() => {
    const catMap = {};
    incomeCats.forEach((c) => (catMap[c.id] = c));
    expenseCats.forEach((c) => (catMap[c.id] = c));
    const getCls = (t) =>
      catMap[t.category_id]?.accounting_class || (t.type === 'INCOME' ? 'OUTRAS_RECEITAS' : 'OUTRAS_DESPESAS');

    const now = new Date();
    const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const from = dateFromCF || defaultFrom;
    const to = dateToCF || defaultTo;
    // compras no cartão não movimentam caixa; o pagamento da fatura sim
    const txP = transactions.filter((t) => {
      const d = t.due_date || '';
      return d >= from && d <= to && !ehCompraCartao(t);
    });

    // Mesmo cálculo rodado duas vezes: previsto usa o valor da conta,
    // efetivo usa só o que foi baixado de fato.
    const calcDFC = (valor) => {
      const sumCls = (type, ...cls) =>
        txP.filter((t) => t.type === type && cls.includes(getCls(t))).reduce((s, t) => s + valor(t), 0);
      const recClientes = sumCls('INCOME', 'RECEITA_SERVICO', 'RECEITA_CONTRATO', 'OUTRAS_RECEITAS');
      const pagCSP = sumCls('EXPENSE', 'CSP');
      const pagPessoal = sumCls('EXPENSE', 'DESPESA_PESSOAL');
      const pagAdmin = sumCls('EXPENSE', 'DESPESA_ADMINISTRATIVA', 'DESPESA_COMERCIAL');
      const pagImpostos = sumCls('EXPENSE', 'IMPOSTO_RECEITA', 'IMPOSTO_RENDA');
      const pagOutOp = sumCls('EXPENSE', 'OUTRAS_DESPESAS', 'DEPRECIACAO');
      const pagCartao = sumCls('EXPENSE', 'PAGAMENTO_CARTAO');
      const caixaOper = recClientes - pagCSP - pagPessoal - pagAdmin - pagImpostos - pagOutOp - pagCartao;
      const recAtivos = sumCls('INCOME', 'RECEITA_INVESTIMENTO');
      const pagAtivos = sumCls('EXPENSE', 'INVESTIMENTO');
      const caixaInv = recAtivos - pagAtivos;
      const recFin = sumCls('INCOME', 'FINANCIAMENTO_ENTRADA');
      const pagFin = sumCls('EXPENSE', 'FINANCIAMENTO_SAIDA', 'DESPESA_FINANCEIRA');
      const caixaFin = recFin - pagFin;
      const varLiq = caixaOper + caixaInv + caixaFin;
      const saldoInicial = bankAccounts.reduce((s, b) => s + (b.initial_balance || 0), 0);
      return {
        recClientes,
        pagCSP,
        pagPessoal,
        pagAdmin,
        pagImpostos,
        pagOutOp,
        pagCartao,
        caixaOper,
        recAtivos,
        pagAtivos,
        caixaInv,
        recFin,
        pagFin,
        caixaFin,
        varLiq,
        saldoInicial,
        saldoFinal: saldoInicial + varLiq,
      };
    };
    const PV = calcDFC((t) => t.amount); // previsto
    const EF = calcDFC(txPago); // efetivo
    const {
      recClientes,
      pagCSP,
      pagPessoal,
      pagAdmin,
      pagImpostos,
      pagOutOp,
      caixaOper,
      recAtivos,
      pagAtivos,
      caixaInv,
      recFin,
      pagFin,
      caixaFin,
      varLiq,
      saldoInicial,
      saldoFinal,
    } = PV;

    const dailyRows = projectedFlow();
    const fv = (v) => (v === 0 ? '—' : v < 0 ? `(${fmt(Math.abs(v))})` : fmt(v));
    const sfv = (v) => (v === 0 ? '—' : (v > 0 ? '+' : '') + fmt(v));
    const cfLabel =
      from.slice(0, 7) === to.slice(0, 7)
        ? monthLabel(from.slice(0, 7))
        : `${from.slice(8, 10)}/${from.slice(5, 7)} — ${to.slice(8, 10)}/${to.slice(5, 7)}/${to.slice(0, 4)}`;

    // Mesmas linhas da tela, nas mesmas duas colunas (previsto/efetivo).
    const exportarDFC = () => {
      const L = (rot, k, neg = false) => [rot, csvNum(neg ? -PV[k] : PV[k]), csvNum(neg ? -EF[k] : EF[k])];
      baixarCSV(`DFC_${from}_a_${to}.csv`, [
        ['Demonstração dos Fluxos de Caixa — Método Direto (CPC 03)'],
        ['Período', `${fmtDate(from)} a ${fmtDate(to)}`],
        ['Previsto', 'valor das contas'],
        ['Efetivo', 'o que foi baixado'],
        ['Gerado em', new Date().toLocaleString('pt-BR')],
        [],
        ['Conta', 'Previsto (R$)', 'Efetivo (R$)'],
        ['1. ATIVIDADES OPERACIONAIS'],
        L('(+) Recebimentos de Clientes — Serviços e Contratos', 'recClientes'),
        L('(-) Pagamentos de Custo dos Serviços (CSP)', 'pagCSP', true),
        L('(-) Pagamentos de Pessoal', 'pagPessoal', true),
        L('(-) Despesas Administrativas e Comerciais', 'pagAdmin', true),
        L('(-) Impostos Pagos (ISS, PIS, COFINS, IR/CSLL)', 'pagImpostos', true),
        L('(-) Outros Pagamentos Operacionais', 'pagOutOp', true),
        L('(-) Pagamento de Faturas de Cartão', 'pagCartao', true),
        L('(=) Caixa Líquido das Atividades Operacionais', 'caixaOper'),
        ['2. ATIVIDADES DE INVESTIMENTO'],
        L('(+) Recebimentos — Venda de Ativos', 'recAtivos'),
        L('(-) Pagamentos — Compra de Equipamentos / Veículos', 'pagAtivos', true),
        L('(=) Caixa Líquido das Atividades de Investimento', 'caixaInv'),
        ['3. ATIVIDADES DE FINANCIAMENTO'],
        L('(+) Empréstimos Obtidos / Aportes de Capital', 'recFin'),
        L('(-) Amortizações, Juros e Encargos Financeiros', 'pagFin', true),
        L('(=) Caixa Líquido das Atividades de Financiamento', 'caixaFin'),
        L('(=) VARIAÇÃO LÍQUIDA DE CAIXA NO PERÍODO', 'varLiq'),
        L('(+) Saldo Inicial das Contas', 'saldoInicial'),
        L('(=) SALDO FINAL DE CAIXA E EQUIVALENTES', 'saldoFinal'),
        [],
        ['Detalhe Diário'],
        ['Data', 'Entradas (R$)', 'Saídas (R$)', 'Resultado do Dia (R$)', 'Saldo Acumulado (R$)'],
        ...dailyRows.map((r) => [fmtDate(r.dateStr), csvNum(r.ins), csvNum(r.outs), csvNum(r.diff), csvNum(r.balance)]),
      ]);
    };

    const SH = ({ l }) => (
      <tr className="bg-gray-100 border-t-2 border-gray-300">
        <td colSpan="3" className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          {l}
        </td>
      </tr>
    );
    const DR = ({ l, k, neg = false, ind = 0, tot = false }) => {
      const v = neg ? -PV[k] : PV[k];
      const ve = neg ? -EF[k] : EF[k];
      const pl = ['', 'pl-6', 'pl-10'][ind] || 'pl-6';
      const bg = tot ? 'bg-gray-50 border-t border-gray-200' : 'hover:bg-gray-50 border-t border-gray-100';
      const tw = tot ? 'text-gray-800 font-semibold text-sm' : 'text-gray-600 text-sm';
      const cor = (x) =>
        tot
          ? x >= 0
            ? 'text-green-800 font-semibold'
            : 'text-red-700 font-semibold'
          : x >= 0
            ? 'text-green-700'
            : 'text-red-500';
      return (
        <tr className={bg}>
          <td className={`px-4 py-2.5 ${tw} ${pl}`}>{l}</td>
          <td className={`px-4 py-2.5 text-right whitespace-nowrap text-sm text-gray-400`}>{fv(v)}</td>
          <td className={`px-4 py-2.5 text-right whitespace-nowrap text-sm ${cor(ve)}`}>{fv(ve)}</td>
        </tr>
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-800">DFC — Demonstração dos Fluxos de Caixa</h2>
            <p className="text-xs text-gray-400">
              Método Direto · CPC 03 · Previsto = valor das contas · Efetivo = o que foi baixado
            </p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg font-medium">
            {cfLabel}
          </span>
          <DateFilter from={dateFromCF} setFrom={setDateFromCF} to={dateToCF} setTo={setDateToCF} />
          <BotaoExportar
            onClick={exportarDFC}
            title="Baixa o DFC e o detalhe diário do período em CSV (abre no Excel)"
          />
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            {
              l: 'Atividades Operacionais',
              v: EF.caixaOper,
              info: 'dfc-oper',
              sub: `previsto ${sfv(PV.caixaOper)}`,
              pos: 'bg-green-50 border-green-200 text-green-800',
              neg: 'bg-red-50 border-red-200 text-red-800',
            },
            {
              l: 'Atividades de Investimento',
              v: EF.caixaInv,
              info: 'dfc-inv',
              sub: `previsto ${sfv(PV.caixaInv)}`,
              pos: 'bg-blue-50 border-blue-200 text-blue-800',
              neg: 'bg-orange-50 border-orange-200 text-orange-800',
            },
            {
              l: 'Atividades de Financiamento',
              v: EF.caixaFin,
              info: 'dfc-fin',
              sub: `previsto ${sfv(PV.caixaFin)}`,
              pos: 'bg-purple-50 border-purple-200 text-purple-800',
              neg: 'bg-amber-50 border-amber-200 text-amber-800',
            },
            {
              l: 'Variação Líquida de Caixa',
              v: EF.varLiq,
              info: 'dfc-var',
              sub: `previsto ${sfv(PV.varLiq)} · ${cfLabel}`,
              pos: 'bg-teal-50 border-teal-200 text-teal-800',
              neg: 'bg-rose-50 border-rose-200 text-rose-800',
            },
          ].map((k, i) => {
            const cls = k.v >= 0 ? k.pos : k.neg;
            const [bg, bdr, tc] = cls.split(' ');
            return (
              <div key={i} className={`${bg} border ${bdr} rounded-xl p-4`}>
                <div className="flex items-start justify-between gap-1 mb-1">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${tc}`}>{k.l}</p>
                  <InfoBtn id={k.info} />
                </div>
                <p className={`text-xl font-bold ${tc}`}>{sfv(k.v)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Saldo Inicial do Período</p>
                <InfoBtn id="dfc-ini" />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Configurado em Configurações → Contas e Saldos</p>
            </div>
            <p className="text-xl font-bold text-gray-700 ml-4">{fmt(saldoInicial)}</p>
          </div>
          <div
            className={`border rounded-xl p-4 flex items-center justify-between ${saldoFinal >= 0 ? 'bg-teal-50 border-teal-200' : 'bg-rose-50 border-rose-200'}`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${saldoFinal >= 0 ? 'text-teal-600' : 'text-rose-600'}`}
                >
                  Saldo Final Projetado
                </p>
                <InfoBtn id="dfc-fin2" />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Saldo Inicial + Variação Líquida de Caixa</p>
            </div>
            <p className={`text-xl font-bold ml-4 ${saldoFinal >= 0 ? 'text-teal-800' : 'text-rose-800'}`}>
              {fmt(saldoFinal)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Demonstração dos Fluxos de Caixa — {cfLabel}
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  Previsto
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  Efetivo
                </th>
              </tr>
            </thead>
            <tbody>
              <SH l="1. Atividades Operacionais" />
              {recClientes > 0 && (
                <DR l="(+) Recebimentos de Clientes — Serviços e Contratos" k="recClientes" ind={1} />
              )}
              {pagCSP > 0 && <DR l="(-) Pagamentos de Custo dos Serviços (CSP)" k="pagCSP" neg ind={1} />}
              {pagPessoal > 0 && <DR l="(-) Pagamentos de Pessoal" k="pagPessoal" neg ind={1} />}
              {pagAdmin > 0 && <DR l="(-) Despesas Administrativas e Comerciais" k="pagAdmin" neg ind={1} />}
              {pagImpostos > 0 && <DR l="(-) Impostos Pagos (ISS, PIS, COFINS, IR/CSLL)" k="pagImpostos" neg ind={1} />}
              {pagOutOp > 0 && <DR l="(-) Outros Pagamentos Operacionais" k="pagOutOp" neg ind={1} />}
              {PV.pagCartao > 0 && <DR l="(-) Pagamento de Faturas de Cartão" k="pagCartao" neg ind={1} />}
              {recClientes === 0 &&
                pagCSP === 0 &&
                pagPessoal === 0 &&
                pagAdmin === 0 &&
                pagImpostos === 0 &&
                pagOutOp === 0 && (
                  <tr className="border-t border-gray-100">
                    <td colSpan="3" className="px-4 py-3 text-xs text-gray-400 text-center">
                      Nenhum lançamento operacional — adicione receitas e despesas com as categorias corretas
                    </td>
                  </tr>
                )}
              <DR l="(=) Caixa Líquido das Atividades Operacionais" k="caixaOper" tot />

              <SH l="2. Atividades de Investimento" />
              {recAtivos > 0 && <DR l="(+) Recebimentos — Venda de Ativos" k="recAtivos" ind={1} />}
              {pagAtivos > 0 && <DR l="(-) Pagamentos — Compra de Equipamentos / Veículos" k="pagAtivos" neg ind={1} />}
              {recAtivos === 0 && pagAtivos === 0 && (
                <tr className="border-t border-gray-100">
                  <td colSpan="3" className="px-4 py-3 text-xs text-gray-400 text-center">
                    Nenhum lançamento de investimento no período
                  </td>
                </tr>
              )}
              <DR l="(=) Caixa Líquido das Atividades de Investimento" k="caixaInv" tot />

              <SH l="3. Atividades de Financiamento" />
              {recFin > 0 && <DR l="(+) Empréstimos Obtidos / Aportes de Capital" k="recFin" ind={1} />}
              {pagFin > 0 && <DR l="(-) Amortizações, Juros e Encargos Financeiros" k="pagFin" neg ind={1} />}
              {recFin === 0 && pagFin === 0 && (
                <tr className="border-t border-gray-100">
                  <td colSpan="3" className="px-4 py-3 text-xs text-gray-400 text-center">
                    Nenhum lançamento de financiamento no período
                  </td>
                </tr>
              )}
              <DR l="(=) Caixa Líquido das Atividades de Financiamento" k="caixaFin" tot />

              <tr className={`border-t-2 ${varLiq >= 0 ? 'bg-blue-700' : 'bg-red-700'}`}>
                <td className="px-4 py-3.5 text-sm font-bold text-white">(=) VARIAÇÃO LÍQUIDA DE CAIXA NO PERÍODO</td>
                <td className="px-4 py-3.5 text-sm font-bold text-white/60 text-right">{sfv(PV.varLiq)}</td>
                <td className="px-4 py-3.5 text-sm font-bold text-white text-right">{sfv(EF.varLiq)}</td>
              </tr>
              {saldoInicial > 0 && (
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="px-4 py-2.5 text-sm text-gray-500 pl-6">(+) Saldo Inicial das Contas</td>
                  <td className="px-4 py-2.5 text-right text-sm text-gray-400">{fmt(saldoInicial)}</td>
                  <td className="px-4 py-2.5 text-right text-sm text-gray-700 font-medium">{fmt(saldoInicial)}</td>
                </tr>
              )}
              <tr className={`border-t-2 ${saldoFinal >= 0 ? 'bg-teal-600' : 'bg-rose-700'}`}>
                <td className="px-4 py-3.5 text-sm font-bold text-white">(=) SALDO FINAL DE CAIXA E EQUIVALENTES</td>
                <td className="px-4 py-3.5 text-sm font-bold text-white/60 text-right">{fmt(PV.saldoFinal)}</td>
                <td className="px-4 py-3.5 text-sm font-bold text-white text-right">{fmt(EF.saldoFinal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800">Detalhe Diário</h3>
              <p className="text-xs text-gray-400 mt-0.5">Movimentações por dia e saldo acumulado no período</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Data', 'Entradas', 'Saídas', 'Resultado do Dia', 'Saldo Acumulado'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${i === 0 ? 'text-left text-gray-500' : 'text-right ' + (i === 1 ? 'text-green-600' : i === 2 ? 'text-red-500' : i === 3 ? 'text-gray-500' : 'text-blue-600')}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dailyRows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-400">
                    Nenhum lançamento no período selecionado — adicione receitas e despesas no módulo Financeiro
                  </td>
                </tr>
              ) : (
                dailyRows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-700 font-medium">{r.date}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-green-600">
                      {r.ins > 0 ? fmt(r.ins) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-red-500">
                      {r.outs > 0 ? fmt(r.outs) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-semibold ${r.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {r.diff >= 0 ? '+' : ''}
                        {fmt(r.diff)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-bold ${r.balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                        {fmt(r.balance)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  })();

export { CashFlowTab };
