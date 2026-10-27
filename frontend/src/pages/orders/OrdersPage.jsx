import { Badge, PRIORITY_BORDER, PriorityBadge } from '../../components/Badge.jsx';
import { COLS, STATUS_FLOW } from './constants.js';
import { Icon } from '../../components/Icon.jsx';
import { LabelField } from '../../components/LabelField.jsx';
import { Modal } from '../../components/Modal.jsx';
import { TAX_REGIMES } from '../../config/tax-regimes.js';
import { Toast } from '../../components/Toast.jsx';
import { api } from '../../api/client.js';
import { fmt, fmtDate } from '../../utils/format.js';
import { useEffect, useState } from 'react';

const OrdersPage = ({ taxRegime = 'REAL' }) => {
  const [view, setView] = useState('kanban');
  const [q, setQ] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newModal, setNewModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    loadOrders();
    api.getAllTechnicians().then((r) => {
      if (r.success) setTechnicians(r.data?.data || r.data || []);
    });
    api.getAllCustomers().then((r) => {
      if (r.success) setCustomers(r.data?.data || r.data || []);
    });
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const result = await api.getAllOrders();
    if (result.success) {
      setOrders(result.data?.data || result.data || []);
    } else {
      setOrders([]);
    }
    setLoading(false);
  };
  const [newOS, setNewOS] = useState({
    customer_id: '',
    type: 'Instalação',
    priority: 'MEDIUM',
    description: '',
    scheduled_date: '',
    assigned_technician_id: '',
    substation: '',
    city: '',
  });
  const [nfModal, setNfModal] = useState(false);
  const [nfData, setNfData] = useState({ number: '', series: '1', date: '', value: '' });
  const [pendingInvoice, setPendingInvoice] = useState(null);

  const advance = async (id, nf) => {
    const o = orders.find((o) => o.id === id);
    const flow = STATUS_FLOW[o?.status];
    if (!flow) return;
    const result = await api.updateOrder(id, { status: flow.next, ...(nf ? { nf } : {}) });
    if (result.success) {
      setOrders((prev) => prev.map((x) => (x.id === id ? { ...x, status: flow.next, ...(nf ? { nf } : {}) } : x)));
      setSelected((prev) => (prev ? { ...prev, status: flow.next, ...(nf ? { nf } : {}) } : null));
      setToast(`OS ${o.number}: ${flow.label} concluído!`);
    } else {
      setToast(`Erro ao avançar OS: ${result.error}`);
    }
  };

  const requestInvoice = (id) => {
    const today = new Date().toISOString().split('T')[0];
    setNfData({ number: '', series: '1', date: today, value: '' });
    setPendingInvoice(id);
    setNfModal(true);
  };

  const confirmInvoice = () => {
    if (!nfData.number.trim()) return;
    advance(pendingInvoice, nfData);
    setNfModal(false);
    setPendingInvoice(null);
    setToast(`NF ${nfData.number} vinculada com sucesso!`);
  };

  const cancel = async (id) => {
    const o = orders.find((o) => o.id === id);
    const result = await api.updateOrder(id, { status: 'CANCELLED' });
    if (result.success) {
      setOrders((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'CANCELLED' } : x)));
      setToast(`OS ${o?.number} cancelada.`);
      setSelected(null);
    } else {
      setToast(`Erro ao cancelar OS: ${result.error}`);
    }
  };

  const assignTech = async (id, assigned_technician_id) => {
    const result = await api.updateOrder(id, { assigned_technician_id: assigned_technician_id || null });
    if (result.success) {
      setOrders((prev) => prev.map((x) => (x.id === id ? result.data : x)));
      setSelected((prev) => (prev ? result.data : null));
    }
  };

  const createOS = async () => {
    if (!newOS.customer_id) {
      setToast('Selecione um cliente');
      return;
    }
    if (!newOS.scheduled_date) {
      setToast('Data agendada é obrigatória');
      return;
    }
    const result = await api.createOrder({
      customer_id: newOS.customer_id,
      type: newOS.type,
      priority: newOS.priority,
      status: 'OPEN',
      scheduled_date: newOS.scheduled_date,
      assigned_technician_id: newOS.assigned_technician_id || null,
      description: newOS.description || null,
      substation: newOS.substation || null,
      city: newOS.city || null,
    });
    if (result.success) {
      setOrders((prev) => [result.data, ...prev]);
      setNewModal(false);
      setNewOS({
        customer_id: '',
        type: 'Instalação',
        priority: 'MEDIUM',
        description: '',
        scheduled_date: '',
        assigned_technician_id: '',
        substation: '',
        city: '',
      });
      setToast(`OS ${result.data.number} criada com sucesso!`);
    } else {
      setToast(`Erro ao criar OS: ${result.error}`);
    }
  };

  const filtered = orders.filter(
    (o) =>
      !q ||
      o.number.toLowerCase().includes(q.toLowerCase()) ||
      (o.customers?.name || o.customer || '').toLowerCase().includes(q.toLowerCase()),
  );
  const byStatus = Object.fromEntries(COLS.map((c) => [c.key, filtered.filter((o) => o.status === c.key)]));

  const OSCard = ({ o }) => (
    <div
      onClick={() => setSelected(o)}
      className={`bg-white rounded-lg p-3 shadow-sm border-l-4 ${PRIORITY_BORDER[o.priority]} cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-xs font-mono font-bold text-gray-600">{o.number}</span>
        <PriorityBadge p={o.priority} />
      </div>
      <p className="text-sm font-medium text-gray-800 truncate">{o.customers?.name || o.customer}</p>
      <p className="text-xs text-gray-500">{o.type}</p>
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Icon name="calendar" className="w-3 h-3" />
          {fmtDate(o.scheduled_date || o.date)}
        </span>
        {(o.technicians?.name || o.tech) && (
          <span className="flex items-center gap-1 truncate">
            <Icon name="user" className="w-3 h-3" />
            {(o.technicians?.name || o.tech || '').split(' ')[0]}
          </span>
        )}
      </div>
      {o.nf && (
        <div className="mt-1.5 text-xs font-mono font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
          🧾 NF {o.nf.number}
        </div>
      )}
    </div>
  );

  // Derive current selected from orders state so status stays in sync
  const selOS = selected ? orders.find((o) => o.id === selected.id) || selected : null;
  const flow = selOS ? STATUS_FLOW[selOS.status] : null;
  const btnColors = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    sky: 'bg-sky-600 hover:bg-sky-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 shrink-0">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar OS ou cliente..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-1.5 rounded text-sm font-medium ${view === 'kanban' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded text-sm font-medium ${view === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
          >
            Lista
          </button>
        </div>
        <button
          onClick={() => setNewModal(true)}
          className="ml-auto flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Icon name="plus" className="w-4 h-4" /> Nova OS
        </button>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-4 p-5 overflow-x-auto flex-1 items-start">
          {COLS.map((col) => (
            <div key={col.key} className="shrink-0 w-60">
              <div className={`${col.bg} ${col.text} flex items-center justify-between px-3 py-2 rounded-t-lg`}>
                <span className="text-xs font-semibold">{col.label}</span>
                <span className="bg-white bg-opacity-60 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {byStatus[col.key]?.length || 0}
                </span>
              </div>
              <div className="bg-gray-50 border border-gray-200 border-t-0 rounded-b-lg p-2 space-y-2 min-h-24">
                {byStatus[col.key]?.map((o) => (
                  <OSCard key={o.id} o={o} />
                ))}
                {(byStatus[col.key]?.length || 0) === 0 && (
                  <p className="text-center text-xs text-gray-400 py-4">Nenhuma OS</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5 overflow-y-auto flex-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    'Nº',
                    'Cliente',
                    'Cidade',
                    'Subestação',
                    'Tipo',
                    'Prioridade',
                    'Status',
                    'Nota Fiscal',
                    'Agendado',
                    'Técnico',
                    '',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(o)}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{o.number}</td>
                    <td className="px-4 py-3 text-gray-800">{o.customers?.name || o.customer}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{o.city || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{o.substation || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{o.type}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge p={o.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={o.status} />
                    </td>
                    <td className="px-4 py-3">
                      {o.nf ? (
                        <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          NF {o.nf.number}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(o.scheduled_date || o.date)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {o.technicians?.name || o.tech || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-blue-600 hover:underline font-medium">Abrir →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OS Detail Modal */}
      <Modal open={!!selOS} onClose={() => setSelected(null)} title={selOS?.number || ''} size="lg">
        {selOS && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge status={selOS.status} />
              <PriorityBadge p={selOS.priority} />
              <span className="text-sm text-gray-500">{selOS.type}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <LabelField label="Cliente" value={selOS.customers?.name || selOS.customer || '—'} />
                <LabelField label="Data" value={fmtDate(selOS.scheduled_date || selOS.date)} />
                <LabelField label="Cidade" value={selOS.city || '—'} />
                <LabelField label="Subestação" value={selOS.substation || '—'} />
                <LabelField label="Descrição" value={selOS.description || selOS.desc || '—'} />
                {/* Painel fiscal */}
                {(() => {
                  const tr = TAX_REGIMES[taxRegime];
                  return (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Tributação Aplicável
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tr.color}`}>{tr.label}</span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        {tr.iss && (
                          <p>
                            ISS: <span className="font-semibold">{(tr.iss * 100).toFixed(0)}%</span> sobre valor da OS
                          </p>
                        )}
                        {tr.pis && (
                          <p>
                            PIS: <span className="font-semibold">{(tr.pis * 100).toFixed(2)}%</span>
                          </p>
                        )}
                        {tr.cofins && (
                          <p>
                            COFINS: <span className="font-semibold">{(tr.cofins * 100).toFixed(2)}%</span>
                          </p>
                        )}
                        {tr.dasRate && (
                          <p>
                            DAS (Simples): <span className="font-semibold">{(tr.dasRate * 100).toFixed(1)}%</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Técnico Responsável</p>
                  <select
                    value={selOS.assigned_technician_id || ''}
                    onChange={(e) => assignTech(selOS.id, e.target.value || null)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nenhum (não atribuído)</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Progresso</p>
                  <div className="space-y-2">
                    {['OPEN', 'SCHEDULED', 'IN_TRANSIT', 'IN_PROGRESS', 'COMPLETED', 'INVOICED'].map((s) => {
                      const sMap = {
                        OPEN: 'Aberta',
                        SCHEDULED: 'Agendada',
                        IN_TRANSIT: 'Em Trânsito',
                        IN_PROGRESS: 'Em Andamento',
                        COMPLETED: 'Concluída',
                        INVOICED: 'Faturada',
                      };
                      const steps = ['OPEN', 'SCHEDULED', 'IN_TRANSIT', 'IN_PROGRESS', 'COMPLETED', 'INVOICED'];
                      const currentIdx = steps.indexOf(selOS.status);
                      const thisIdx = steps.indexOf(s);
                      const done = thisIdx < currentIdx,
                        current = s === selOS.status;
                      return (
                        <div
                          key={s}
                          className={`flex items-center gap-2 text-xs ${current ? 'text-blue-700 font-semibold' : done ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${current ? 'bg-blue-600 text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                          >
                            {done ? '✓' : thisIdx + 1}
                          </span>
                          {sMap[s]}
                          {current && <span className="text-blue-500">← atual</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {selOS.status === 'CANCELLED' || selOS.status === 'INVOICED' ? (
                <div className="flex-1">
                  {selOS.status === 'INVOICED' && selOS.nf ? (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 text-lg">🧾</span>
                        <div>
                          <p className="text-xs text-purple-400 font-medium uppercase tracking-wide">
                            Nota Fiscal Emitida
                          </p>
                          <p className="text-sm font-bold text-purple-800">
                            NF {selOS.nf.number} · Série {selOS.nf.series}
                          </p>
                        </div>
                      </div>
                      {selOS.nf.date && <p className="text-xs text-purple-600">Emissão: {fmtDate(selOS.nf.date)}</p>}
                      {selOS.nf.value && (
                        <p className="text-xs font-semibold text-purple-700">
                          Valor: {fmt(Math.round(parseFloat(selOS.nf.value) * 100))}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-center text-gray-400 py-2">
                      {selOS.status === 'INVOICED' ? 'OS finalizada e faturada.' : 'OS cancelada.'}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {flow && (
                    <button
                      onClick={() => (selOS.status === 'COMPLETED' ? requestInvoice(selOS.id) : advance(selOS.id))}
                      className={`flex-1 py-2.5 text-white rounded-lg text-sm font-semibold ${btnColors[flow.color] || 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {flow.label} →
                    </button>
                  )}
                  <button
                    onClick={() => cancel(selOS.id)}
                    className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                  >
                    Cancelar OS
                  </button>
                </>
              )}
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Nova OS Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Nova Ordem de Serviço" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select
              value={newOS.customer_id}
              onChange={(e) => setNewOS((p) => ({ ...p, customer_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione o cliente...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {[
            { label: 'Cidade', key: 'city', type: 'text', placeholder: 'Ex: São José do Rio Preto' },
            {
              label: 'Subestação / Local',
              key: 'substation',
              type: 'text',
              placeholder: 'Ex: SE Cliente — Sala de Energia',
            },
            { label: 'Descrição', key: 'description', type: 'text', placeholder: 'Descreva o serviço...' },
            { label: 'Data Agendada *', key: 'scheduled_date', type: 'date', placeholder: '' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type}
                value={newOS[f.key]}
                onChange={(e) => setNewOS((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Técnico</label>
            <select
              value={newOS.assigned_technician_id}
              onChange={(e) => setNewOS((p) => ({ ...p, assigned_technician_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">Nenhum (não atribuído)</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={newOS.type}
                onChange={(e) => setNewOS((p) => ({ ...p, type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {['Instalação', 'Manutenção', 'Revisão', 'Emergência'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <select
                value={newOS.priority}
                onChange={(e) => setNewOS((p) => ({ ...p, priority: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setNewModal(false)}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={createOS}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Criar OS
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Emissão de Nota Fiscal */}
      <Modal open={nfModal} onClose={() => setNfModal(false)} title="Emitir Nota Fiscal" size="md">
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-2">
            <span className="text-purple-500 text-lg">🧾</span>
            <p className="text-xs text-purple-700 font-medium">
              Informe os dados da NF antes de faturar a OS. O número ficará vinculado permanentemente ao registro.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Número da NF *</label>
              <input
                value={nfData.number}
                onChange={(e) => setNfData((p) => ({ ...p, number: e.target.value }))}
                placeholder="Ex: 000123"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Série</label>
              <input
                value={nfData.series}
                onChange={(e) => setNfData((p) => ({ ...p, series: e.target.value }))}
                placeholder="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Emissão</label>
              <input
                type="date"
                value={nfData.date}
                onChange={(e) => setNfData((p) => ({ ...p, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor da NF (R$)</label>
              <input
                type="number"
                value={nfData.value}
                onChange={(e) => setNfData((p) => ({ ...p, value: e.target.value }))}
                placeholder="0,00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setNfModal(false)}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmInvoice}
              disabled={!nfData.number.trim()}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${nfData.number.trim() ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              Faturar OS — NF {nfData.number || '—'}
            </button>
          </div>
        </div>
      </Modal>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export { OrdersPage };
