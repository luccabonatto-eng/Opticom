import { Badge } from '../../../components/Badge.jsx';
import React from 'react';
import { fmt, fmtDate } from '../../../utils/format.js';
import { txDue } from '../calculations.js';

const DreCustomerTable = ({
  customerScopedTxs,
  displayedCustList,
  dreExpandedCust,
  fv,
  overallNetMargin,
  scopeLabel,
  setDreCustomerFilter,
  setDreExpandedCust,
  setDreViewMode,
  totalCsp,
  totalDeductions,
  totalGrossProfit,
  totalGrossRevenue,
  totalNetProfitAll,
  totalNetRevenue,
  totalOpExpenses,
  txCatName,
  unassignedItem,
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-100 border-b-2 border-gray-300">
          <tr>
            <th className="px-4 py-3 text-left font-bold text-gray-700 uppercase tracking-wide">Cliente / Obra</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              Lançamentos
            </th>
            <th className="px-3 py-3 text-right font-semibold text-blue-700 uppercase tracking-wide whitespace-nowrap">
              Receita Bruta
            </th>
            <th className="px-3 py-3 text-right font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              (-) Deduções
            </th>
            <th className="px-3 py-3 text-right font-bold text-blue-900 uppercase tracking-wide whitespace-nowrap">
              (=) Rec. Líquida
            </th>
            <th className="px-3 py-3 text-right font-semibold text-amber-700 uppercase tracking-wide whitespace-nowrap">
              (-) Custos (CSP)
            </th>
            <th className="px-3 py-3 text-right font-bold text-green-800 uppercase tracking-wide whitespace-nowrap">
              (=) Lucro Bruto
            </th>
            <th className="px-3 py-3 text-right font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              (-) Despesas Op.
            </th>
            <th className="px-4 py-3 text-right font-extrabold text-gray-900 uppercase tracking-wide whitespace-nowrap">
              (=) Lucro Líquido
            </th>
            <th className="px-3 py-3 text-center font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">
              Margem Líq.
            </th>
            <th className="px-3 py-3 text-center font-semibold text-gray-400 uppercase tracking-wide">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {displayedCustList.length === 0 ? (
            <tr>
              <td colSpan="11" className="px-4 py-10 text-center text-gray-400">
                <p className="text-2xl mb-1">🔍</p>
                <p className="text-sm font-medium">Nenhum cliente encontrado com os filtros aplicados</p>
              </td>
            </tr>
          ) : (
            displayedCustList.map((c) => {
              const isExp = dreExpandedCust === c.id;
              const isLoss = c.netProfit < 0;
              const noData = !c.hasActivity;

              return (
                <React.Fragment key={c.id}>
                  <tr
                    onClick={() => setDreExpandedCust(isExp ? null : c.id)}
                    className={`hover:bg-purple-50/40 cursor-pointer transition-colors ${isExp ? 'bg-purple-50/60' : isLoss ? 'bg-rose-50/30' : noData ? 'opacity-60 bg-gray-50/30' : ''}`}
                  >
                    {/* Cliente */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${noData ? 'bg-gray-300' : isLoss ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate max-w-xs">{c.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded font-mono">
                              {c.type || 'PJ'}
                            </span>
                            {c.city && <span className="text-[10px] text-gray-400 truncate">{c.city}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Lançamentos */}
                    <td className="px-3 py-3 text-center">
                      {c.hasActivity ? (
                        <div className="inline-flex items-center gap-1 text-[11px] font-medium">
                          <span className="text-green-700 bg-green-50 px-1 rounded">{c.incomeCount} rec</span>
                          <span className="text-gray-300">/</span>
                          <span className="text-red-600 bg-red-50 px-1 rounded">{c.expenseCount} desp</span>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Receita Bruta */}
                    <td className="px-3 py-3 text-right font-medium text-blue-700 whitespace-nowrap">
                      {c.grossRevenue > 0 ? fmt(c.grossRevenue) : '—'}
                    </td>

                    {/* Deduções */}
                    <td className="px-3 py-3 text-right text-gray-500 whitespace-nowrap">
                      {c.deductions > 0 ? `(${fmt(c.deductions)})` : '—'}
                    </td>

                    {/* Receita Líquida */}
                    <td className="px-3 py-3 text-right font-semibold text-blue-900 whitespace-nowrap">
                      {c.netRevenue > 0 ? fmt(c.netRevenue) : '—'}
                    </td>

                    {/* Custos Diretos (CSP) */}
                    <td className="px-3 py-3 text-right text-amber-800 whitespace-nowrap">
                      {c.csp > 0 ? `(${fmt(c.csp)})` : '—'}
                    </td>

                    {/* Lucro Bruto */}
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {c.hasActivity ? (
                        <div>
                          <span className={`font-bold ${c.grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {fv(c.grossProfit)}
                          </span>
                          {c.netRevenue > 0 && (
                            <p className="text-[10px] text-gray-400">{c.grossMargin.toFixed(0)}% mg</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Despesas Operacionais */}
                    <td className="px-3 py-3 text-right text-gray-500 whitespace-nowrap">
                      {c.opExpenses > 0 ? `(${fmt(c.opExpenses)})` : '—'}
                    </td>

                    {/* Lucro Líquido */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {c.hasActivity ? (
                        <span className={`text-sm font-extrabold ${isLoss ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {fv(c.netProfit)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Margem Líquida % */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      {c.hasActivity && c.netRevenue > 0 ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${isLoss ? 'bg-rose-100 text-rose-700' : c.netMargin >= 20 ? 'bg-emerald-100 text-emerald-800' : c.netMargin >= 10 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}
                        >
                          {c.netMargin >= 0 ? '+' : ''}
                          {c.netMargin.toFixed(1)}%
                        </span>
                      ) : c.hasActivity && isLoss ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] bg-rose-100 text-rose-700">
                          Prejuízo
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setDreExpandedCust(isExp ? null : c.id)}
                          title={isExp ? 'Ocultar detalhes' : 'Ver detalhes de receitas e custos deste cliente'}
                          className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${isExp ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-purple-100 text-gray-700'}`}
                        >
                          {isExp ? 'Ocultar ▴' : 'Detalhes ▾'}
                        </button>
                        <button
                          onClick={() => {
                            setDreCustomerFilter(String(c.id));
                            setDreViewMode('consolidated');
                          }}
                          title="Abrir demonstrativo contábil CPC 26 deste cliente"
                          className="px-2 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          DRE Formal ↗
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Painel Drill-Down Expandido do Cliente */}
                  {isExp && (
                    <tr className="bg-purple-50/50 border-y border-purple-200">
                      <td colSpan="11" className="p-4">
                        <div className="bg-white rounded-xl border border-purple-200 shadow-xs p-4 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                                👤
                              </span>
                              <div>
                                <h4 className="font-bold text-sm text-gray-900">
                                  {c.name} — Extrato Gerencial de Obra/Cliente
                                </h4>
                                <p className="text-xs text-gray-400">
                                  Detalhamento dos lançamentos que formam o resultado no período:{' '}
                                  <span className="font-semibold text-purple-700">{scopeLabel}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setDreCustomerFilter(String(c.id));
                                  setDreViewMode('consolidated');
                                }}
                                className="text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                              >
                                <span>📊</span> Ver DRE Formal CPC 26 deste Cliente
                              </button>
                              <button
                                onClick={() => setDreExpandedCust(null)}
                                className="text-xs text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg"
                              >
                                ✕ Fechar
                              </button>
                            </div>
                          </div>

                          {/* Mini Cards de Síntese Contábil */}
                          <div className="grid grid-cols-5 gap-2.5">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-center">
                              <p className="text-[11px] text-blue-600 font-semibold uppercase">Receita Bruta</p>
                              <p className="text-sm font-bold text-blue-900 mt-0.5">{fmt(c.grossRevenue)}</p>
                              <p className="text-[10px] text-blue-400">{c.incomeCount} fatura(s)</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-center">
                              <p className="text-[11px] text-amber-700 font-semibold uppercase">Custos Diretos (CSP)</p>
                              <p className="text-sm font-bold text-amber-900 mt-0.5">{fmt(c.csp)}</p>
                              <p className="text-[10px] text-amber-500">Material e campo</p>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 text-center">
                              <p className="text-[11px] text-indigo-700 font-semibold uppercase">Lucro Bruto</p>
                              <p className="text-sm font-bold text-indigo-900 mt-0.5">{fv(c.grossProfit)}</p>
                              <p className="text-[10px] text-indigo-500">{c.grossMargin.toFixed(1)}% margem</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center">
                              <p className="text-[11px] text-gray-600 font-semibold uppercase">
                                Despesas Op. e Impostos
                              </p>
                              <p className="text-sm font-bold text-gray-800 mt-0.5">
                                {fmt(c.opExpenses + c.deductions)}
                              </p>
                              <p className="text-[10px] text-gray-400">Outras despesas</p>
                            </div>
                            <div
                              className={`${isLoss ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'} border rounded-lg p-2.5 text-center`}
                            >
                              <p
                                className={`text-[11px] font-bold uppercase ${isLoss ? 'text-rose-700' : 'text-emerald-700'}`}
                              >
                                Lucro Líquido
                              </p>
                              <p
                                className={`text-base font-extrabold mt-0.5 ${isLoss ? 'text-rose-700' : 'text-emerald-800'}`}
                              >
                                {fv(c.netProfit)}
                              </p>
                              <p
                                className={`text-[10px] font-semibold ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}
                              >
                                {c.netMargin.toFixed(1)}% margem líquida
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
                            {/* Coluna 1: Composição por Categoria */}
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
                              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                Gastos e Receitas por Categoria
                              </p>
                              {c.catBreakdown.length === 0 ? (
                                <p className="text-xs text-gray-400 py-4 text-center">Nenhuma categoria movimentada</p>
                              ) : (
                                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                  {c.catBreakdown.map((cat, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white border border-gray-100"
                                    >
                                      <div className="min-w-0 pr-2">
                                        <p className="font-semibold text-gray-800 truncate">{cat.name}</p>
                                        <span className="text-[10px] text-gray-400">
                                          {cat.cls} · {cat.count}x
                                        </span>
                                      </div>
                                      <span
                                        className={`font-bold shrink-0 ${cat.type === 'INCOME' ? 'text-emerald-700' : 'text-red-600'}`}
                                      >
                                        {cat.type === 'INCOME' ? '+' : '-'}
                                        {fmt(cat.total)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Coluna 2 e 3: Extrato de Lançamentos daquele cliente */}
                            <div className="lg:col-span-2 bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                  Extrato Individual de Lançamentos ({c.transactions.length})
                                </p>
                                <span className="text-xs text-gray-400">Ordenado por data</span>
                              </div>
                              {c.transactions.length === 0 ? (
                                <p className="text-xs text-gray-400 py-6 text-center">
                                  Nenhum lançamento vinculado neste período
                                </p>
                              ) : (
                                <div className="overflow-x-auto max-h-56 overflow-y-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-200 text-gray-400 text-[10px] uppercase">
                                        <th className="text-left pb-1.5 font-semibold">Vencimento</th>
                                        <th className="text-left pb-1.5 font-semibold">Descrição</th>
                                        <th className="text-left pb-1.5 font-semibold">Categoria</th>
                                        <th className="text-center pb-1.5 font-semibold">Status</th>
                                        <th className="text-right pb-1.5 font-semibold">Valor</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {c.transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-white/80">
                                          <td className="py-1.5 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                                            {fmtDate(txDue(tx))}
                                          </td>
                                          <td
                                            className="py-1.5 font-medium text-gray-800 max-w-xs truncate"
                                            title={tx.description || tx.desc}
                                          >
                                            {tx.description || tx.desc}
                                          </td>
                                          <td className="py-1.5 text-gray-500 text-[11px] truncate">{txCatName(tx)}</td>
                                          <td className="py-1.5 text-center">
                                            <Badge status={tx.status} />
                                          </td>
                                          <td
                                            className={`py-1.5 text-right font-bold whitespace-nowrap ${tx.type === 'INCOME' ? 'text-emerald-700' : 'text-red-600'}`}
                                          >
                                            {tx.type === 'INCOME' ? '+' : '-'}
                                            {fmt(tx.amount)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}

          {/* Linha Especial: Custos Estruturais da Sede / Geral (Sem Cliente Vinculado) */}
          {unassignedItem.hasActivity && (
            <tr className="bg-slate-100/70 border-t-2 border-gray-300">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">Sem cliente — gerais e não classificados</p>
                    <p className="text-[10px] text-slate-500">
                      Confira a separação e classifique pendências no DRE Geral da Empresa
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 text-center text-slate-600 font-medium">
                {unassignedItem.incomeCount} rec / {unassignedItem.expenseCount} desp
              </td>
              <td className="px-3 py-3 text-right text-slate-600 font-medium">
                {unassignedItem.grossRevenue > 0 ? fmt(unassignedItem.grossRevenue) : '—'}
              </td>
              <td className="px-3 py-3 text-right text-slate-600">
                {unassignedItem.deductions > 0 ? `(${fmt(unassignedItem.deductions)})` : '—'}
              </td>
              <td className="px-3 py-3 text-right font-semibold text-slate-700">
                {unassignedItem.netRevenue > 0 ? fmt(unassignedItem.netRevenue) : '—'}
              </td>
              <td className="px-3 py-3 text-right text-slate-600">
                {unassignedItem.csp > 0 ? `(${fmt(unassignedItem.csp)})` : '—'}
              </td>
              <td className="px-3 py-3 text-right text-slate-700">
                {unassignedItem.grossProfit !== 0 ? fv(unassignedItem.grossProfit) : '—'}
              </td>
              <td className="px-3 py-3 text-right text-slate-700 font-medium">
                {unassignedItem.opExpenses > 0 ? `(${fmt(unassignedItem.opExpenses)})` : '—'}
              </td>
              <td className="px-4 py-3 text-right font-bold text-rose-700">{fv(unassignedItem.netProfit)}</td>
              <td className="px-3 py-3 text-center text-slate-400 text-[10px]">Sem cliente</td>
              <td className="px-3 py-3 text-center">
                <button
                  onClick={() => {
                    setDreCustomerFilter('__sem_cliente__');
                    setDreViewMode('consolidated');
                  }}
                  className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 underline"
                >
                  Ver Gastos ↗
                </button>
              </td>
            </tr>
          )}
        </tbody>

        {/* Linha de Totais da Carteira */}
        <tfoot>
          <tr className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white font-bold text-xs border-t-2 border-purple-950">
            <td className="px-4 py-3.5">TOTAL DA EMPRESA (CLIENTES + GERAL)</td>
            <td className="px-3 py-3.5 text-center text-purple-200">{customerScopedTxs.length} lançamento(s)</td>
            <td className="px-3 py-3.5 text-right text-purple-100 font-extrabold">{fmt(totalGrossRevenue)}</td>
            <td className="px-3 py-3.5 text-right text-purple-300">
              {totalDeductions > 0 ? `(${fmt(totalDeductions)})` : '—'}
            </td>
            <td className="px-3 py-3.5 text-right text-white font-extrabold">{fmt(totalNetRevenue)}</td>
            <td className="px-3 py-3.5 text-right text-purple-300">{totalCsp > 0 ? `(${fmt(totalCsp)})` : '—'}</td>
            <td className="px-3 py-3.5 text-right text-emerald-300 font-extrabold">{fmt(totalGrossProfit)}</td>
            <td className="px-3 py-3.5 text-right text-purple-300">
              {totalOpExpenses > 0 ? `(${fmt(totalOpExpenses)})` : '—'}
            </td>
            <td className="px-4 py-3.5 text-right text-sm font-black text-emerald-300">{fv(totalNetProfitAll)}</td>
            <td className="px-3 py-3.5 text-center text-emerald-300 font-extrabold text-sm">
              {overallNetMargin.toFixed(1)}%
            </td>
            <td className="px-3 py-3.5 text-center"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
);

export { DreCustomerTable };
