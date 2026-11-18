import { KPI } from '../../components/KPI.jsx';
import { MONTH_NAMES } from './constants.js';
import { Modal } from '../../components/Modal.jsx';
import { TAX_REGIMES } from '../../config/tax-regimes.js';
import { Toast } from '../../components/Toast.jsx';
import { api } from '../../api/client.js';
import { fmt } from '../../utils/format.js';
import { useEffect, useState } from 'react';

// Sem acesso ao Financeiro (ex.: técnico), o painel mostra só a operação.
const DashboardPage = ({ setPage, taxRegime = 'REAL', canSeeFinancial = true }) => {
  const [pipelineModal, setPipelineModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [pipelineFrom, setPipelineFrom] = useState('');
  const [pipelineTo, setPipelineTo] = useState('');
  const [dashMonth, setDashMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState({
    openOrders: 0,
    completedOrders: 0,
    invoicedOrders: 0,
    activeContracts: 0,
    totalCustomers: 0,
    lowStockItems: 0,
    receivedRevenue: 0,
    paidExpense: 0,
    pendingRevenue: 0,
    pendingExpense: 0,
  });
  const [allOrders, setAllOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // O perfil chega logo depois do login: recarrega quando a permissão do Financeiro muda.
  useEffect(() => {
    loadDashboard(dashMonth);
  }, [dashMonth, canSeeFinancial]);

  const buildWeeklyChart = (txs, month) => {
    if (!month || !txs.length) return [];
    const [y, m] = month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    const pad = (n) => String(n).padStart(2, '0');
    return [
      { label: 'Sem 1', from: `${month}-01`, to: `${month}-07` },
      { label: 'Sem 2', from: `${month}-08`, to: `${month}-14` },
      { label: 'Sem 3', from: `${month}-15`, to: `${month}-21` },
      { label: 'Sem 4', from: `${month}-22`, to: `${month}-${pad(last)}` },
    ].map((w) => ({
      label: w.label,
      a: txs
        .filter((t) => t.type === 'INCOME' && (t.due_date || '') >= w.from && (t.due_date || '') <= w.to)
        .reduce((s, t) => s + (t.amount || 0), 0),
      b: txs
        .filter((t) => t.type === 'EXPENSE' && (t.due_date || '') >= w.from && (t.due_date || '') <= w.to)
        .reduce((s, t) => s + (t.amount || 0), 0),
    }));
  };

  const loadDashboard = async (month) => {
    const [ordRes, custRes, ctRes, txRes, prodRes] = await Promise.all([
      api.getAllOrders(),
      api.getAllCustomers(),
      api.getAllContracts(),
      canSeeFinancial ? api.getAllTransactions() : Promise.resolve({ success: true, data: [] }),
      api.getAllProducts(),
    ]);
    const orders = ordRes.success ? ordRes.data?.data || ordRes.data || [] : [];
    const customers = custRes.success ? custRes.data?.data || custRes.data || [] : [];
    const contracts = ctRes.success ? ctRes.data?.data || ctRes.data || [] : [];
    const txsAll = txRes.success ? txRes.data?.data || txRes.data || [] : [];
    const products = prodRes.success ? prodRes.data?.data || prodRes.data || [] : [];

    const txs = month ? txsAll.filter((t) => (t.due_date || '').startsWith(month)) : txsAll;
    const ordM = month ? orders.filter((o) => (o.scheduled_date || o.created_at || '').startsWith(month)) : orders;

    const openSt = ['OPEN', 'SCHEDULED', 'IN_TRANSIT', 'IN_PROGRESS'];
    const pago = (t) =>
      t.amount_paid != null ? t.amount_paid : t.status === 'PAID' || t.status === 'RECEIVED' ? t.amount || 0 : 0;
    const aberto = (t) => Math.max(0, (t.amount || 0) - pago(t));
    const receivedRevenue = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + pago(t), 0);
    const paidExpense = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + pago(t), 0);
    const pendingRevenue = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + aberto(t), 0);
    const pendingExpense = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + aberto(t), 0);

    setStats({
      openOrders: ordM.filter((o) => openSt.includes(o.status)).length,
      completedOrders: ordM.filter((o) => o.status === 'COMPLETED').length,
      invoicedOrders: ordM.filter((o) => o.status === 'INVOICED').length,
      activeContracts: contracts.filter((c) => c.status === 'ACTIVE').length,
      totalCustomers: customers.length,
      lowStockItems: products.filter((p) => (p.quantity || 0) <= (p.min_quantity || 0) && (p.min_quantity || 0) > 0).length,
      receivedRevenue,
      paidExpense,
      pendingRevenue,
      pendingExpense,
    });
    setAllOrders(ordM);
    setChartData(buildWeeklyChart(txsAll, month));

    const now = new Date();
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const newAlerts = [];
    orders
      .filter((o) => o.scheduled_date && new Date(o.scheduled_date) < now && openSt.includes(o.status))
      .slice(0, 3)
      .forEach((o) => {
        newAlerts.push({
          id: `os-${o.id}`,
          severity: 'HIGH',
          title: 'OS em atraso',
          message: `${o.number} — agendada ${new Date(o.scheduled_date).toLocaleDateString('pt-BR')}`,
          type: 'OVERDUE_ORDER',
        });
      });
    contracts
      .filter((c) => c.status === 'ACTIVE' && c.end_date && new Date(c.end_date) <= in30)
      .slice(0, 3)
      .forEach((c) => {
        newAlerts.push({
          id: `ct-${c.id}`,
          severity: 'MEDIUM',
          title: 'Contrato expirando',
          message: `${c.number} expira em ${new Date(c.end_date).toLocaleDateString('pt-BR')}`,
          type: 'CONTRACT_EXPIRING',
        });
      });
    products
      .filter((p) => (p.quantity || 0) <= (p.min_quantity || 0) && (p.min_quantity || 0) > 0)
      .slice(0, 2)
      .forEach((p) => {
        newAlerts.push({
          id: `inv-${p.id}`,
          severity: 'MEDIUM',
          title: 'Estoque crítico',
          message: `"${p.name}" — ${p.quantity || 0} un. (mín: ${p.min_quantity || 0})`,
          type: 'LOW_STOCK',
        });
      });
    txs
      .filter((t) => t.due_date && new Date(t.due_date) < now && (t.status === 'PENDING' || t.status === 'PARTIAL'))
      .slice(0, 2)
      .forEach((t) => {
        newAlerts.push({
          id: `tx-${t.id}`,
          severity: t.type === 'INCOME' ? 'HIGH' : 'MEDIUM',
          title: t.type === 'INCOME' ? 'Recebimento em atraso' : 'Pagamento em atraso',
          message: `${t.description || '—'} — venceu ${new Date(t.due_date).toLocaleDateString('pt-BR')}`,
          type: t.type === 'INCOME' ? 'OVERDUE_RECEIVABLE' : 'OVERDUE_PAYABLE',
        });
      });
    setAlerts(newAlerts);
  };

  const openPipeline = (step) => {
    const statusMap = {
      open: 'OPEN',
      scheduled: 'SCHEDULED',
      progress: 'IN_TRANSIT,IN_PROGRESS',
      completed: 'COMPLETED',
      invoiced: 'INVOICED',
    };
    const statuses = (statusMap[step] || '').split(',');
    const data = allOrders
      .filter((o) => statuses.includes(o.status))
      .map((o) => ({
        number: o.number,
        customer: o.customers?.name || '—',
        type: o.type || '—',
        tech: o.technicians?.name || 'Não atribuído',
        date: o.scheduled_date || o.created_at?.split('T')[0] || '—',
      }));
    const titles = {
      open: 'OS Abertas',
      scheduled: 'OS Agendadas',
      progress: 'OS em Andamento',
      completed: 'OS Concluídas',
      invoiced: 'OS Faturadas',
    };
    setPipelineModal({
      title: titles[step] || step,
      data,
      cols: ['Nº OS', 'Cliente', 'Tipo', 'Técnico', 'Data'],
      row: (r) => [r.number, r.customer, r.type, r.tech, r.date],
    });
  };

  const RevExpChart = ({ data }) => {
    const maxVal = Math.max(...data.flatMap((d) => [d.a, d.b]).filter((v) => v > 0)) || 1;
    const barH = 120;
    return (
      <div>
        <div className="flex items-end gap-3" style={{ height: barH + 40 }}>
          {data.map((col, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="flex gap-0.5 w-full justify-center mb-1" style={{ minHeight: 28 }}>
                {col.a > 0 && (
                  <span className="text-xs text-blue-700 font-semibold tabular-nums">
                    {fmt(col.a).replace('R$\u00a0', '').replace(',00', '')}
                  </span>
                )}
              </div>
              <div className="flex items-end gap-0.5 w-full" style={{ height: barH }}>
                <div
                  className="flex-1 rounded-t-sm transition-all relative group"
                  style={{
                    height: col.a > 0 ? `${(col.a / maxVal) * barH}px` : '2px',
                    background: '#3b82f6',
                    opacity: col.a > 0 ? 0.85 : 0.15,
                  }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                    Receita: {fmt(col.a)}
                  </div>
                </div>
                <div
                  className="flex-1 rounded-t-sm transition-all relative group"
                  style={{
                    height: col.b > 0 ? `${(col.b / maxVal) * barH}px` : '2px',
                    background: '#f87171',
                    opacity: col.b > 0 ? 0.85 : 0.15,
                  }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                    Despesa: {fmt(col.b)}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500 mt-1">{col.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500">Total Receita</p>
            <p className="text-sm font-bold text-blue-600">{fmt(data.reduce((s, c) => s + c.a, 0))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Despesa</p>
            <p className="text-sm font-bold text-red-500">{fmt(data.reduce((s, c) => s + c.b, 0))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Lucro</p>
            <p className="text-sm font-bold text-green-600">{fmt(data.reduce((s, c) => s + (c.a - c.b), 0))}</p>
          </div>
        </div>
      </div>
    );
  };

  const prevMonthNav = () => {
    const [y, m] = dashMonth.split('-').map(Number);
    setDashMonth(m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`);
  };
  const nextMonthNav = () => {
    const [y, m] = dashMonth.split('-').map(Number);
    const now = new Date();
    const cur = `${y}-${String(m).padStart(2, '0')}`;
    const nowM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (cur >= nowM) return;
    setDashMonth(m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`);
  };
  const dashMonthLabel = (() => {
    const [y, m] = dashMonth.split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${y}`;
  })();

  return (
    <div className="p-6 space-y-5">
      {/* Header com seletor de mês */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl shadow-sm px-2 py-1">
            <button
              onClick={prevMonthNav}
              className="p-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              type="month"
              value={dashMonth}
              onChange={(e) => setDashMonth(e.target.value)}
              className="text-sm font-semibold text-gray-700 border-none outline-none bg-transparent cursor-pointer px-1"
            />
            <button
              onClick={nextMonthNav}
              className="p-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {canSeeFinancial && (() => {
            const tr = TAX_REGIMES[taxRegime];
            return (
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tr.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${tr.dot}`} />
                {tr.label}
              </div>
            );
          })()}
        </div>
        <button
          onClick={() => setDashMonth(new Date().toISOString().slice(0, 7))}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          Mês atual
        </button>
      </div>

      {canSeeFinancial && (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KPI
          title="Receita Recebida"
          value={fmt(stats.receivedRevenue)}
          sub={`+ ${fmt(stats.pendingRevenue)} pendente`}
          icon="financial"
          color="green"
        />
        <KPI
          title="Despesas Pagas"
          value={fmt(stats.paidExpense)}
          sub={`+ ${fmt(stats.pendingExpense)} pendente`}
          icon="financial"
          color="red"
        />
        <KPI
          title="Resultado"
          value={fmt(stats.receivedRevenue - stats.paidExpense)}
          sub={
            stats.receivedRevenue > 0
              ? `Margem: ${((1 - stats.paidExpense / stats.receivedRevenue) * 100).toFixed(1)}%`
              : '—'
          }
          icon="financial"
          color="blue"
        />
      </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KPI
          title="OS Abertas"
          value={String(stats.openOrders)}
          sub="abertas, agendadas ou em campo"
          icon="orders"
          color="orange"
        />
        <KPI
          title="OS Concluídas"
          value={String(stats.completedOrders)}
          sub={`${stats.invoicedOrders} já faturadas`}
          icon="orders"
          color="green"
        />
        <KPI
          title="Estoque Crítico"
          value={String(stats.lowStockItems)}
          sub={stats.lowStockItems > 0 ? 'itens abaixo do mínimo' : 'nenhum item abaixo do mínimo'}
          icon="inventory"
          color={stats.lowStockItems > 0 ? 'red' : 'blue'}
        />
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Andamento das OS</h2>
            <p className="text-xs text-gray-500 mt-0.5">Clique em uma etapa para ver as ordens</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">De:</span>
            <input
              type="date"
              aria-label="Andamento das OS a partir de"
              value={pipelineFrom}
              onChange={(e) => setPipelineFrom(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
            />
            <span className="text-xs text-gray-500">Até:</span>
            <input
              type="date"
              aria-label="Andamento das OS até"
              value={pipelineTo}
              onChange={(e) => setPipelineTo(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
            />
            {(pipelineFrom || pipelineTo) && (
              <button
                onClick={() => {
                  setPipelineFrom('');
                  setPipelineTo('');
                }}
                className="text-xs text-gray-500 hover:text-red-600 font-medium"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
        {(() => {
          const stages = [
            {
              key: 'open',
              label: 'Abertas',
              count: allOrders.filter((o) => o.status === 'OPEN').length,
              color: 'text-gray-600',
              bg: 'bg-gray-100',
              bar: 'bg-gray-400',
              sub: 'aguardando atribuição',
            },
            {
              key: 'scheduled',
              label: 'Agendadas',
              count: allOrders.filter((o) => o.status === 'SCHEDULED').length,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              bar: 'bg-blue-400',
              sub: 'técnico designado',
            },
            {
              key: 'progress',
              label: 'Em Andamento',
              count: allOrders.filter((o) => ['IN_TRANSIT', 'IN_PROGRESS'].includes(o.status)).length,
              color: 'text-orange-600',
              bg: 'bg-orange-50',
              bar: 'bg-orange-400',
              sub: 'em campo / execução',
            },
            {
              key: 'completed',
              label: 'Concluídas',
              count: allOrders.filter((o) => o.status === 'COMPLETED').length,
              color: 'text-green-600',
              bg: 'bg-green-50',
              bar: 'bg-green-500',
              sub: 'aguardando faturamento',
            },
            {
              key: 'invoiced',
              label: 'Faturadas',
              count: allOrders.filter((o) => o.status === 'INVOICED').length,
              color: 'text-purple-600',
              bg: 'bg-purple-50',
              bar: 'bg-purple-400',
              sub: 'nota fiscal emitida',
            },
          ];
          const total = allOrders.length || 1;
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-gray-100">
              {stages.map((s, i) => {
                const pct = Math.round((s.count / total) * 100);
                return (
                  <button
                    key={i}
                    onClick={() => openPipeline(s.key)}
                    className="bg-white p-5 text-left hover:bg-gray-50 transition-colors group"
                  >
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">{s.count}</p>
                    <p className="text-xs font-semibold text-gray-600 mt-0.5">{s.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${s.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 group-hover:text-blue-700">{pct}% do total →</p>
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>

      <Modal open={!!pipelineModal} onClose={() => setPipelineModal(null)} title={pipelineModal?.title || ''} size="xl">
        {pipelineModal && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{pipelineModal.data.length} ordens de serviço</p>
              {pipelineModal.data.length === 0 && (
                <p className="text-sm text-gray-500 italic">Nenhuma OS nesta etapa</p>
              )}
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {pipelineModal.cols.map((c) => (
                    <th
                      key={c}
                      className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pipelineModal.data.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {pipelineModal.row(r).map((cell, j) => (
                      <td
                        key={j}
                        className={`px-4 py-3 ${j === 0 ? 'font-mono text-xs font-semibold text-gray-700' : j === pipelineModal.cols.length - 1 ? 'font-semibold text-gray-800 text-right' : 'text-gray-600'}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setPipelineModal(null);
                  setPage('orders');
                }}
                className="flex-1 py-2.5 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50"
              >
                Ver todas as OS →
              </button>
              {canSeeFinancial && (
                <button
                  onClick={() => {
                    setPipelineModal(null);
                    setPage('financial');
                  }}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Ir para Financeiro →
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <div className={`grid grid-cols-1 gap-5 ${canSeeFinancial ? 'xl:grid-cols-2' : ''}`}>
      {canSeeFinancial && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Receita vs Despesa</h2>
              <p className="text-xs text-gray-500">{dashMonthLabel} — por semana</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
                Receita
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-400 inline-block" />
                Despesa
              </span>
            </div>
          </div>
          {chartData.some((c) => c.a || c.b) ? (
            <RevExpChart data={chartData} />
          ) : (
            <p className="py-12 text-sm text-gray-500 text-center">Nenhum lançamento com vencimento em {dashMonthLabel}.</p>
          )}
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Alertas Ativos</h2>
          {alerts.length > 0 ? (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{alerts.length}</span>
          ) : (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">0</span>
          )}
        </div>
        {alerts.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500 text-center">Nenhum alerta pendente</p>
        ) : (
          alerts.map((a) => {
            const sev = {
              HIGH: ['bg-red-500', 'Alta'],
              MEDIUM: ['bg-amber-500', 'Média'],
              LOW: ['bg-blue-500', 'Baixa'],
            }[a.severity] || ['bg-gray-400', ''];
            const navMap2 = {
              OVERDUE_RECEIVABLE: 'financial',
              OVERDUE_PAYABLE: 'financial',
              LOW_STOCK: 'inventory',
              OVERDUE_ORDER: 'orders',
            };
            return (
              <div
                key={a.id}
                className="flex items-start gap-3 px-5 py-3 border-b border-gray-100 last:border-b-0"
              >
                <span role="img" aria-label={`Prioridade ${sev[1]}`} title={`Prioridade ${sev[1]}`} className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sev[0]}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.message}</p>
                </div>
                <button
                  onClick={() => setPage(navMap2[a.type] || 'dashboard')}
                  className="text-xs text-blue-600 hover:underline shrink-0 font-medium whitespace-nowrap"
                >
                  Ver →
                </button>
              </div>
            );
          })
        )}
      </div>
      </div>
      {/* Card Regime Tributário */}
      {canSeeFinancial && (() => {
        const tr = TAX_REGIMES[taxRegime];
        return (
          <div
            className={`rounded-xl border p-4 flex items-center gap-5 flex-wrap ${tr.color.replace('text-', 'border-').replace('100', '200')} bg-white`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${tr.dot}`} />
              <div>
                <p className="text-xs text-gray-500">Regime Tributário Ativo</p>
                <p className="text-sm font-bold text-gray-800">{tr.label}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-xs text-gray-500 space-y-0.5">
              <p>{tr.method}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${tr.obColor}`}>
                {tr.obligation}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs">
              {tr.iss && (
                <div className="text-center">
                  <p className="text-gray-500">ISS</p>
                  <p className="font-bold text-gray-700">{(tr.iss * 100).toFixed(0)}%</p>
                </div>
              )}
              {tr.pis && (
                <div className="text-center">
                  <p className="text-gray-500">PIS</p>
                  <p className="font-bold text-gray-700">{(tr.pis * 100).toFixed(2)}%</p>
                </div>
              )}
              {tr.cofins && (
                <div className="text-center">
                  <p className="text-gray-500">COFINS</p>
                  <p className="font-bold text-gray-700">{(tr.cofins * 100).toFixed(2)}%</p>
                </div>
              )}
              {tr.dasRate && (
                <div className="text-center">
                  <p className="text-gray-500">DAS</p>
                  <p className="font-bold text-gray-700">{(tr.dasRate * 100).toFixed(1)}%</p>
                </div>
              )}
              {tr.irpjRate && (
                <div className="text-center">
                  <p className="text-gray-500">IRPJ</p>
                  <p className="font-bold text-gray-700">{(tr.irpjRate * 100).toFixed(0)}%+</p>
                </div>
              )}
              {tr.csllRate && (
                <div className="text-center">
                  <p className="text-gray-500">CSLL</p>
                  <p className="font-bold text-gray-700">{(tr.csllRate * 100).toFixed(0)}%</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export { DashboardPage };
