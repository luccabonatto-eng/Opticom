import { DreCustomerTable } from './DreCustomerTable.jsx';
import { fmt } from '../../../utils/format.js';
import { monthLabel } from '../periods.js';

const DreCustomers = ({
  activeCustomers,
  curM,
  customerMetricsList,
  customerScopedTxs,
  displayedCustList,
  dreCustSearch,
  dreCustSort,
  dreCustStatusFilter,
  dreExpandedCust,
  dreTimeScope,
  fv,
  lossCustomers,
  lossTotal,
  maxProfitVal,
  overallNetMargin,
  scopeLabel,
  setDreCustSearch,
  setDreCustSort,
  setDreCustStatusFilter,
  setDreCustomerFilter,
  setDreExpandedCust,
  setDreTimeScope,
  setDreViewMode,
  topProfitCust,
  topRevenueCust,
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
  <div className="space-y-4">
    {/* Controles de Escopo de Tempo e Resumo */}
    <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-xl p-3.5">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          👥
        </span>
        <div>
          <p className="text-xs font-bold text-purple-900 uppercase tracking-wide">
            Rentabilidade da Carteira de Clientes
          </p>
          <p className="text-xs text-gray-600">
            Período de Análise: <span className="font-bold text-purple-800">{scopeLabel}</span> ·{' '}
            {customerScopedTxs.length} lançamento(s) vinculados
          </p>
        </div>
      </div>
      {/* Seletor de Escopo de Período */}
      <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-purple-200 text-xs">
        {[
          ['month', `Mês (${monthLabel(curM)})`],
          ['year', `Ano ${curM.slice(0, 4)} (Acumulado)`],
          ['all', 'Todo o Histórico'],
        ].map(([scope, lbl]) => (
          <button
            key={scope}
            onClick={() => setDreTimeScope(scope)}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${dreTimeScope === scope ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:text-purple-700'}`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>

    {/* Top KPIs da Carteira */}
    <div className="grid grid-cols-4 gap-3">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">🏆 Cliente Mais Lucrativo</p>
          <span className="text-xs bg-emerald-200/60 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Top Lucro</span>
        </div>
        <p className="text-lg font-bold text-emerald-900 truncate" title={topProfitCust?.name || '—'}>
          {topProfitCust?.name || '—'}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-base font-extrabold text-emerald-700">
            {topProfitCust ? fmt(topProfitCust.netProfit) : '—'}
          </span>
          {topProfitCust && topProfitCust.netRevenue > 0 && (
            <span className="text-xs font-semibold text-emerald-600">
              ({topProfitCust.netMargin.toFixed(1)}% margem)
            </span>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">📈 Maior Faturamento</p>
          <span className="text-xs bg-blue-200/60 text-blue-800 font-bold px-1.5 py-0.5 rounded">Top Receita</span>
        </div>
        <p className="text-lg font-bold text-blue-900 truncate" title={topRevenueCust?.name || '—'}>
          {topRevenueCust?.name || '—'}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-base font-extrabold text-blue-700">
            {topRevenueCust ? fmt(topRevenueCust.grossRevenue) : '—'}
          </span>
          {topRevenueCust && <span className="text-xs text-blue-500">{topRevenueCust.incomeCount} fatura(s)</span>}
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">💎 Margem Líquida da Carteira</p>
          <span className="text-xs bg-purple-200/60 text-purple-800 font-bold px-1.5 py-0.5 rounded">
            Média Ponderada
          </span>
        </div>
        <p className="text-2xl font-extrabold text-purple-900">{overallNetMargin.toFixed(1)}%</p>
        <p className="text-xs text-purple-600 mt-0.5 font-medium">
          {fmt(totalNetProfitAll)} de resultado líquido consolidado
        </p>
      </div>

      <div
        className={`${lossCustomers.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-teal-50 border-teal-200'} border rounded-xl p-3.5`}
      >
        <div className="flex items-center justify-between mb-1">
          <p
            className={`text-xs font-semibold ${lossCustomers.length > 0 ? 'text-amber-700' : 'text-teal-700'} uppercase tracking-wide`}
          >
            {lossCustomers.length > 0 ? '⚠️ Atenção de Prejuízo' : '✅ Saúde da Carteira'}
          </p>
          <span
            className={`text-xs ${lossCustomers.length > 0 ? 'bg-amber-200 text-amber-800' : 'bg-teal-200 text-teal-800'} font-bold px-1.5 py-0.5 rounded`}
          >
            {activeCustomers.length} Ativos
          </span>
        </div>
        <p className={`text-2xl font-extrabold ${lossCustomers.length > 0 ? 'text-amber-900' : 'text-teal-900'}`}>
          {lossCustomers.length > 0 ? `${lossCustomers.length} no vermelho` : '100% no Lucro'}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {lossCustomers.length > 0
            ? `Prejuízo acumulado de ${fmt(lossTotal)}`
            : `Todos os ${activeCustomers.length} clientes ativos geraram lucro`}
        </p>
      </div>
    </div>

    {/* Alerta de Prejuízo em Destaque */}
    {lossCustomers.length > 0 && (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-rose-800 font-medium">
          <span className="text-base">🚨</span>
          <span>
            <strong className="font-bold">Atenção Gerencial:</strong> Os seguintes clientes tiveram custos superiores à
            receita no período: <strong>{lossCustomers.map((c) => `${c.name} (${fv(c.netProfit)})`).join(', ')}</strong>
            . Expanda os detalhes na tabela para auditar os lançamentos.
          </span>
        </div>
        <button
          onClick={() => setDreCustStatusFilter('loss_only')}
          className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-md font-semibold text-xs"
        >
          Filtrar só no prejuízo
        </button>
      </div>
    )}

    {/* Ranking Visual dos Principais Clientes em Lucro */}
    {activeCustomers.length > 0 && (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Ranking Visual de Lucro Líquido por Cliente
            </h3>
            <span className="text-xs text-gray-400">· Contribuição no período</span>
          </div>
          <span className="text-xs text-gray-400">{activeCustomers.length} cliente(s) com movimentação</span>
        </div>
        <div className="space-y-2">
          {activeCustomers.slice(0, 5).map((c, i) => {
            const isLoss = c.netProfit < 0;
            const barWidth = isLoss
              ? Math.min(100, Math.round((Math.abs(c.netProfit) / maxProfitVal) * 100))
              : Math.min(100, Math.round((c.netProfit / maxProfitVal) * 100));
            return (
              <div key={c.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 text-center font-bold text-gray-400 text-xs">#{i + 1}</span>
                    <span className="font-semibold text-gray-800 truncate">{c.name}</span>
                    <span className="text-xs text-gray-400">
                      ({c.incomeCount} rec / {c.expenseCount} desp)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-gray-400">
                      Receita: <span className="text-gray-700 font-medium">{fmt(c.grossRevenue)}</span>
                    </span>
                    <span className="text-gray-400">
                      Custos: <span className="text-gray-700 font-medium">{fmt(c.totalExpense)}</span>
                    </span>
                    <span className={`font-bold ${isLoss ? 'text-rose-600' : 'text-emerald-700'}`}>
                      Lucro: {fv(c.netProfit)}
                    </span>
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded ${isLoss ? 'bg-rose-100 text-rose-700' : c.netMargin >= 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}
                    >
                      {c.netMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isLoss ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-500 to-emerald-500'}`}
                    style={{ width: `${Math.max(barWidth, 3)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* Barra de Filtros e Busca da Tabela */}
    <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <input
            type="text"
            value={dreCustSearch}
            onChange={(e) => setDreCustSearch(e.target.value)}
            placeholder="Buscar cliente por nome..."
            className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">🔍</span>
        </div>

        <select
          value={dreCustStatusFilter}
          onChange={(e) => setDreCustStatusFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none"
        >
          <option value="all">Todos os clientes ({customerMetricsList.length})</option>
          <option value="with_movement">Com movimentação ({activeCustomers.length})</option>
          <option value="profit_only">
            Apenas no lucro ({customerMetricsList.filter((c) => c.netProfit > 0 && c.hasActivity).length})
          </option>
          <option value="loss_only">No prejuízo ({lossCustomers.length})</option>
        </select>

        {(dreCustSearch || dreCustStatusFilter !== 'all') && (
          <button
            onClick={() => {
              setDreCustSearch('');
              setDreCustStatusFilter('all');
            }}
            className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 border border-gray-200 rounded-lg"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span>Ordenar por:</span>
        <select
          value={dreCustSort}
          onChange={(e) => setDreCustSort(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 font-semibold focus:outline-none"
        >
          <option value="profit_desc">Maior Lucro Líquido (R$)</option>
          <option value="profit_asc">Menor Lucro / Prejuízo (R$)</option>
          <option value="margin_desc">Maior Margem Líquida (%)</option>
          <option value="revenue_desc">Maior Faturamento (R$)</option>
          <option value="name_asc">Nome do Cliente (A-Z)</option>
        </select>
      </div>
    </div>

    {/* Tabela Comparativa de DRE por Cliente */}
    <DreCustomerTable
      customerScopedTxs={customerScopedTxs}
      displayedCustList={displayedCustList}
      dreExpandedCust={dreExpandedCust}
      fv={fv}
      overallNetMargin={overallNetMargin}
      scopeLabel={scopeLabel}
      setDreCustomerFilter={setDreCustomerFilter}
      setDreExpandedCust={setDreExpandedCust}
      setDreViewMode={setDreViewMode}
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
  </div>
);

export { DreCustomers };
