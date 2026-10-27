import { Gauge } from '../../components/Gauge.jsx';
import { KPI } from '../../components/KPI.jsx';
import { LineChart } from '../../components/LineChart.jsx';
import { MONTH_NAMES, PERIOD_DATA } from './constants.js';
import { Modal } from '../../components/Modal.jsx';
import { TAX_REGIMES } from '../../config/tax-regimes.js';
import { Toast } from '../../components/Toast.jsx';
import { api } from '../../api/client.js';
import { fmt } from '../../utils/format.js';
import { useEffect, useState } from 'react';

const DashboardPage = ({ setPage, taxRegime = 'REAL' }) => {
  const [period, setPeriod] = useState('month');
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
  const d = PERIOD_DATA[period];

  useEffect(() => {
    loadDashboard(dashMonth);
  }, [dashMonth]);

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
      api.getAllTransactions(),
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
      lowStockItems: products.filter((p) => (p.quantity || 0) <= (p.min_stock || 0) && (p.min_stock || 0) > 0).length,
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
      .filter((p) => (p.quantity || 0) <= (p.min_stock || 0) && (p.min_stock || 0) > 0)
      .slice(0, 2)
      .forEach((p) => {
        newAlerts.push({
          id: `inv-${p.id}`,
          severity: 'MEDIUM',
          title: 'Estoque crítico',
          message: `"${p.name}" — ${p.quantity || 0} un. (mín: ${p.min_stock || 0})`,
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
                  <span className="text-xs text-blue-600 font-semibold" style={{ fontSize: '10px' }}>
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
              <span className="text-xs text-gray-400 mt-1">{col.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-400">Total Receita</p>
            <p className="text-sm font-bold text-blue-600">{fmt(data.reduce((s, c) => s + c.a, 0))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Despesa</p>
            <p className="text-sm font-bold text-red-500">{fmt(data.reduce((s, c) => s + c.b, 0))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Lucro</p>
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl shadow-sm px-2 py-1">
            <button
              onClick={prevMonthNav}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
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
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <span className="text-sm font-semibold text-gray-600">{dashMonthLabel}</span>
          {(() => {
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

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <KPI
          title="OS Abertas"
          value={String(stats.openOrders)}
          sub={`${stats.invoicedOrders} faturadas`}
          icon="orders"
          color="orange"
        />
        <KPI
          title="OS Concluídas"
          value={String(stats.completedOrders)}
          sub={`${stats.activeContracts} contratos ativos`}
          icon="orders"
          color="green"
        />
        <KPI
          title="Clientes Ativos"
          value={String(stats.totalCustomers)}
          sub={stats.lowStockItems > 0 ? `${stats.lowStockItems} itens em falta no estoque` : 'estoque OK'}
          icon="customers"
          color={stats.lowStockItems > 0 ? 'red' : 'blue'}
        />
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Pipeline de Faturamento — OS</h3>
            <p className="text-xs text-gray-400 mt-0.5">Clique em qualquer etapa para ver as ordens</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">De:</span>
            <input
              type="date"
              value={pipelineFrom}
              onChange={(e) => setPipelineFrom(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
            />
            <span className="text-xs text-gray-400">Até:</span>
            <input
              type="date"
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
                className="text-xs text-gray-400 hover:text-red-500 font-bold"
              >
                ✕
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
              icon: '📋',
              color: 'text-gray-600',
              bg: 'bg-gray-100',
              bar: 'bg-gray-400',
              sub: 'aguardando atribuição',
            },
            {
              key: 'scheduled',
              label: 'Agendadas',
              count: allOrders.filter((o) => o.status === 'SCHEDULED').length,
              icon: '📅',
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              bar: 'bg-blue-400',
              sub: 'técnico designado',
            },
            {
              key: 'progress',
              label: 'Em Andamento',
              count: allOrders.filter((o) => ['IN_TRANSIT', 'IN_PROGRESS'].includes(o.status)).length,
              icon: '🔧',
              color: 'text-orange-600',
              bg: 'bg-orange-50',
              bar: 'bg-orange-400',
              sub: 'em campo / execução',
            },
            {
              key: 'completed',
              label: 'Concluídas',
              count: allOrders.filter((o) => o.status === 'COMPLETED').length,
              icon: '✅',
              color: 'text-green-600',
              bg: 'bg-green-50',
              bar: 'bg-green-500',
              sub: 'aguardando faturamento',
            },
            {
              key: 'invoiced',
              label: 'Faturadas',
              count: allOrders.filter((o) => o.status === 'INVOICED').length,
              icon: '🧾',
              color: 'text-purple-600',
              bg: 'bg-purple-50',
              bar: 'bg-purple-400',
              sub: 'nota fiscal emitida',
            },
          ];
          const total = allOrders.length || 1;
          return (
            <div className="grid grid-cols-5 divide-x divide-gray-100">
              {stages.map((s, i) => {
                const pct = Math.round((s.count / total) * 100);
                return (
                  <button
                    key={i}
                    onClick={() => openPipeline(s.key)}
                    className="p-5 text-left hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`${s.bg} ${s.color} w-9 h-9 rounded-lg flex items-center justify-center text-base`}
                      >
                        {s.icon}
                      </div>
                      {i < 4 && <span className="text-gray-200 text-xl mt-0.5">›</span>}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{s.count}</p>
                    <p className="text-xs font-semibold text-gray-600 mt-0.5">{s.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${s.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 group-hover:text-blue-500">{pct}% do total →</p>
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
                <p className="text-sm text-gray-400 italic">Nenhuma OS nesta etapa</p>
              )}
            </div>
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
              <button
                onClick={() => {
                  setPipelineModal(null);
                  setPage('financial');
                }}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Ir para Financeiro →
              </button>
            </div>
          </div>
        )}
      </Modal>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Receita vs Despesa</h3>
              <p className="text-xs text-gray-400">{dashMonthLabel} — por semana</p>
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
          <RevExpChart data={chartData.length > 0 ? chartData : d.chart} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col items-center">
          <div className="flex items-start justify-between w-full mb-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Health Score</h3>
              <p className="text-xs text-gray-400">Saúde financeira geral</p>
            </div>
          </div>
          <Gauge score={72} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-1">
            {[
              ['Liquidez', '80'],
              ['Inadimplência', '75'],
              ['Margem', '65'],
              ['Tendência', '70'],
            ].map(([l, s]) => (
              <div key={l}>
                <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                  <span>{l}</span>
                  <span className="font-medium">{s}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full">
                  <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${s}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Evolução do Caixa</h3>
              <p className="text-xs text-gray-400">{d.label}</p>
            </div>
            <div
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${d.cfEnd >= d.cfStart ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
            >
              {d.cfEnd >= d.cfStart ? '▲' : '▼'} {Math.abs(((d.cfEnd - d.cfStart) / d.cfStart) * 100).toFixed(1)}%
            </div>
          </div>
          <LineChart data={d.cashFlow} color="#10b981" height={130} />
          <div className="flex justify-between mt-1 mb-3 text-xs text-gray-400">
            {d.cfLabels.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-1">
            {[
              { l: 'Saldo Inicial', v: d.cfStart, cls: 'text-gray-700' },
              { l: 'Saldo Final', v: d.cfEnd, cls: d.cfEnd >= d.cfStart ? 'text-green-600' : 'text-red-600' },
              {
                l: 'Variação',
                v: d.cfEnd - d.cfStart,
                cls: d.cfEnd >= d.cfStart ? 'text-green-600' : 'text-red-600',
                showSign: true,
              },
              { l: 'Mínimo', v: Math.min(...d.cashFlow.filter((c) => c.v > 0).map((c) => c.v)), cls: 'text-gray-500' },
              { l: 'Máximo', v: Math.max(...d.cashFlow.map((c) => c.v)), cls: 'text-gray-500' },
            ].map(({ l, v, cls, showSign }) => (
              <div key={l} className="flex justify-between text-xs">
                <span className="text-gray-400">{l}</span>
                <span className={`font-semibold ${cls}`}>
                  {showSign && v > 0 ? '+' : ''}
                  {fmt(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Alertas Ativos</h3>
          {alerts.length > 0 ? (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{alerts.length}</span>
          ) : (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">0</span>
          )}
        </div>
        {alerts.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400 text-center">Nenhum alerta pendente</p>
        ) : (
          alerts.map((a) => {
            const sev = {
              HIGH: ['border-l-red-500', 'bg-red-50', '🔴'],
              MEDIUM: ['border-l-amber-400', 'bg-amber-50', '🟡'],
              LOW: ['border-l-blue-400', 'bg-blue-50', '🔵'],
            }[a.severity] || ['border-l-gray-300', 'bg-gray-50', '⚪'];
            const navMap2 = {
              OVERDUE_RECEIVABLE: 'financial',
              OVERDUE_PAYABLE: 'financial',
              LOW_STOCK: 'inventory',
              OVERDUE_ORDER: 'orders',
            };
            return (
              <div
                key={a.id}
                className={`flex items-start gap-3 px-5 py-3 border-l-4 ${sev[0]} ${sev[1]} border-b border-gray-50 last:border-b-0`}
              >
                <span className="text-sm mt-0.5">{sev[2]}</span>
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
      {/* Card Regime Tributário */}
      {(() => {
        const tr = TAX_REGIMES[taxRegime];
        return (
          <div
            className={`rounded-xl border p-4 flex items-center gap-5 flex-wrap ${tr.color.replace('text-', 'border-').replace('100', '200')} bg-white`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${tr.dot}`} />
              <div>
                <p className="text-xs text-gray-400">Regime Tributário Ativo</p>
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
                  <p className="text-gray-400">ISS</p>
                  <p className="font-bold text-gray-700">{(tr.iss * 100).toFixed(0)}%</p>
                </div>
              )}
              {tr.pis && (
                <div className="text-center">
                  <p className="text-gray-400">PIS</p>
                  <p className="font-bold text-gray-700">{(tr.pis * 100).toFixed(2)}%</p>
                </div>
              )}
              {tr.cofins && (
                <div className="text-center">
                  <p className="text-gray-400">COFINS</p>
                  <p className="font-bold text-gray-700">{(tr.cofins * 100).toFixed(2)}%</p>
                </div>
              )}
              {tr.dasRate && (
                <div className="text-center">
                  <p className="text-gray-400">DAS</p>
                  <p className="font-bold text-gray-700">{(tr.dasRate * 100).toFixed(1)}%</p>
                </div>
              )}
              {tr.irpjRate && (
                <div className="text-center">
                  <p className="text-gray-400">IRPJ</p>
                  <p className="font-bold text-gray-700">{(tr.irpjRate * 100).toFixed(0)}%+</p>
                </div>
              )}
              {tr.csllRate && (
                <div className="text-center">
                  <p className="text-gray-400">CSLL</p>
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
