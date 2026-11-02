import { DreCustomerTable } from './DreCustomerTable.jsx';
import { DreCustomerEntries } from './DreCustomerEntries.jsx';
import { fmt } from '../../../utils/format.js';

const DreCustomers = ({
  activeCustomers,
  customerMetricsList,
  customerScopedTxs,
  displayedCustList,
  dreCustSearch,
  dreCustSort,
  dreCustStatusFilter,
  dreExpandedCust,
  fv,
  lossCustomers,
  lossTotal,
  overallNetMargin,
  scopeLabel,
  setDreCustSearch,
  setDreCustSort,
  setDreCustStatusFilter,
  setDreCustomerFilter,
  setDreExpandedCust,
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
    <DreCustomerEntries customers={customerMetricsList} scopeLabel={scopeLabel} txCatName={txCatName} />
    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3">
      <div className="bg-white border border-gray-200 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente mais lucrativo</p>
        <p className="text-lg font-bold text-gray-800 truncate" title={topProfitCust?.name || '—'}>
          {topProfitCust?.name || '—'}
        </p>
        <p className="text-sm font-bold text-emerald-700">
          {topProfitCust ? fmt(topProfitCust.netProfit) : '—'}
          {topProfitCust && topProfitCust.netRevenue > 0 && (
            <span className="text-xs font-normal text-gray-400"> · {topProfitCust.netMargin.toFixed(1)}% margem</span>
          )}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Maior faturamento</p>
        <p className="text-lg font-bold text-gray-800 truncate" title={topRevenueCust?.name || '—'}>
          {topRevenueCust?.name || '—'}
        </p>
        <p className="text-sm font-bold text-blue-700">
          {topRevenueCust ? fmt(topRevenueCust.grossRevenue) : '—'}
          {topRevenueCust && (
            <span className="text-xs font-normal text-gray-400"> · {topRevenueCust.incomeCount} fatura(s)</span>
          )}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Margem líquida da carteira</p>
        <p className="text-2xl font-bold text-gray-800">{overallNetMargin.toFixed(1)}%</p>
        <p className="text-xs text-gray-400">{fmt(totalNetProfitAll)} de resultado líquido</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {lossCustomers.length > 0 ? 'Clientes no prejuízo' : 'Saúde da carteira'}
        </p>
        <p className={`text-2xl font-bold ${lossCustomers.length > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
          {lossCustomers.length > 0 ? `${lossCustomers.length} no vermelho` : '100% no lucro'}
        </p>
        {/* os nomes ficam aqui: antes havia um alerta separado repetindo este cartão */}
        <p className="text-xs text-gray-400">
          {lossCustomers.length > 0
            ? `${fmt(lossTotal)} de prejuízo acumulado · ${lossCustomers.map((c) => c.name).join(', ')}`
            : `Todos os ${activeCustomers.length} clientes ativos geraram lucro`}
        </p>
      </div>
    </div>

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
