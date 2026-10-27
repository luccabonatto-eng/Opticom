import { Badge } from '../../components/Badge.jsx';
import { ContractTypeName } from './constants.js';
import { Icon } from '../../components/Icon.jsx';
import { KPI } from '../../components/KPI.jsx';
import { LabelField } from '../../components/LabelField.jsx';
import { Modal } from '../../components/Modal.jsx';
import { TAX_REGIMES } from '../../config/tax-regimes.js';
import { Toast } from '../../components/Toast.jsx';
import { api } from '../../api/client.js';
import { fmt, fmtDate } from '../../utils/format.js';
import { useEffect, useState } from 'react';

const ContractsPage = ({ taxRegime = 'REAL' }) => {
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    const [cRes, custRes] = await Promise.all([api.getAllContracts(), api.getAllCustomers()]);
    if (cRes.success) setContracts(cRes.data?.data || cRes.data || []);
    if (custRes.success) setCustomers(custRes.data?.data || custRes.data || []);
    setLoading(false);
  };
  const [selected, setSelected] = useState(null);
  const [newModal, setNewModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    customer_id: '',
    type: 'MONTHLY',
    value: '',
    start_date: '',
    end_date: '',
    sla_hours: '24',
  });

  const list = contracts.filter(
    (c) =>
      !q ||
      c.number.toLowerCase().includes(q.toLowerCase()) ||
      (c.customers?.name || '').toLowerCase().includes(q.toLowerCase()),
  );
  const totalActive = contracts.filter((c) => c.status === 'ACTIVE').reduce((s, c) => s + c.value, 0);
  const expiring = contracts.filter((c) => c.status === 'ACTIVE').length;
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const expiringList = contracts.filter((c) => c.status === 'ACTIVE' && c.end_date && new Date(c.end_date) <= in30);
  const expiringKpiVal = expiringList.length
    ? `${expiringList.length} contrato${expiringList.length > 1 ? 's' : ''}`
    : 'Nenhum';
  const expiringKpiSub = expiringList.length ? expiringList[0].number : 'próximos 30 dias';

  const create = async () => {
    if (!form.customer_id) {
      setToast('Selecione um cliente');
      return;
    }
    if (!form.value || isNaN(parseFloat(form.value)) || parseFloat(form.value) <= 0) {
      setToast('Informe um valor válido');
      return;
    }
    if (!form.start_date || !form.end_date) {
      setToast('Datas de início e fim são obrigatórias');
      return;
    }
    const result = await api.createContract({
      customer_id: form.customer_id,
      type: form.type,
      value: Math.round(parseFloat(form.value) * 100),
      start_date: form.start_date,
      end_date: form.end_date,
      sla_hours: parseInt(form.sla_hours) || 24,
      status: 'ACTIVE',
    });
    if (result.success) {
      setContracts((p) => [result.data, ...p]);
      setNewModal(false);
      setForm({ customer_id: '', type: 'MONTHLY', value: '', start_date: '', end_date: '', sla_hours: '24' });
      setToast(`Contrato ${result.data.number} criado com sucesso!`);
    } else {
      setToast(`Erro ao criar contrato: ${result.error}`);
    }
  };

  const suspend = async (id) => {
    const result = await api.updateContract(id, { status: 'SUSPENDED' });
    if (result.success) {
      setContracts((p) => p.map((c) => (c.id === id ? { ...c, status: 'SUSPENDED' } : c)));
      setSelected(null);
      setToast('Contrato suspenso.');
    } else setToast(`Erro: ${result.error}`);
  };
  const activate = async (id) => {
    const result = await api.updateContract(id, { status: 'ACTIVE' });
    if (result.success) {
      setContracts((p) => p.map((c) => (c.id === id ? { ...c, status: 'ACTIVE' } : c)));
      setSelected(null);
      setToast('Contrato reativado!');
    } else setToast(`Erro: ${result.error}`);
  };

  const sel = selected ? contracts.find((c) => c.id === selected.id) || selected : null;

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KPI title="Contratos Ativos" value={expiring} sub="na carteira" icon="contracts" color="blue" />
        <KPI title="MRR Total" value={fmt(totalActive)} sub="Receita recorrente" icon="financial" color="green" />
        <KPI title="Expirando em 30d" value={expiringKpiVal} sub={expiringKpiSub} icon="audit" color="orange" />
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nº ou cliente..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setNewModal(true)}
          className="ml-auto flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Icon name="plus" className="w-4 h-4" /> Novo Contrato
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Número', 'Cliente', 'Tipo', 'Valor/Ciclo', 'SLA', 'Vigência', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(c)}>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{c.number}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{c.customers?.name || c.customer || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{ContractTypeName[c.type]}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{fmt(c.value)}</td>
                <td className="px-4 py-3 text-gray-600">{c.sla_hours || c.sla || '—'}h</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {fmtDate(c.start_date || c.start)} → {fmtDate(c.end_date || c.end)}
                </td>
                <td className="px-4 py-3">
                  <Badge status={c.status} />
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs text-blue-600 hover:underline font-medium">Abrir →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contract Detail Modal */}
      <Modal open={!!sel} onClose={() => setSelected(null)} title={sel?.number || ''} size="md">
        {sel && (
          <div className="space-y-5">
            <Badge status={sel.status} />
            <div className="grid grid-cols-2 gap-4">
              <LabelField label="Cliente" value={sel.customers?.name || sel.customer || '—'} />
              <LabelField label="Tipo" value={ContractTypeName[sel.type]} />
              <LabelField label="Valor/Ciclo" value={fmt(sel.value)} />
              <LabelField label="SLA" value={`${sel.sla_hours || sel.sla || '—'}h`} />
              <LabelField label="Início" value={fmtDate(sel.start_date || sel.start)} />
              <LabelField label="Encerramento" value={fmtDate(sel.end_date || sel.end)} />
            </div>
            {/* Painel fiscal do contrato */}
            {(() => {
              const tr = TAX_REGIMES[taxRegime];
              const iss = tr.iss ? Math.round(sel.value * tr.iss) : null;
              return (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Carga Tributária</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tr.color}`}>{tr.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400">Valor Bruto/Ciclo</p>
                      <p className="font-semibold text-gray-800 mt-0.5">{fmt(sel.value)}</p>
                    </div>
                    {iss && (
                      <div>
                        <p className="text-gray-400">ISS ({(tr.iss * 100).toFixed(0)}%)</p>
                        <p className="font-semibold text-red-600 mt-0.5">({fmt(iss)})</p>
                      </div>
                    )}
                    {tr.pis && (
                      <div>
                        <p className="text-gray-400">PIS ({(tr.pis * 100).toFixed(2)}%)</p>
                        <p className="font-semibold text-red-600 mt-0.5">({fmt(Math.round(sel.value * tr.pis))})</p>
                      </div>
                    )}
                    {tr.cofins && (
                      <div>
                        <p className="text-gray-400">COFINS ({(tr.cofins * 100).toFixed(2)}%)</p>
                        <p className="font-semibold text-red-600 mt-0.5">({fmt(Math.round(sel.value * tr.cofins))})</p>
                      </div>
                    )}
                    {tr.dasRate && (
                      <div>
                        <p className="text-gray-400">DAS ({(tr.dasRate * 100).toFixed(1)}%)</p>
                        <p className="font-semibold text-red-600 mt-0.5">({fmt(Math.round(sel.value * tr.dasRate))})</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400">Valor Líquido Est.</p>
                      <p className="font-bold text-green-700 mt-0.5">
                        {fmt(
                          sel.value -
                            (iss || 0) -
                            (tr.pis ? Math.round(sel.value * tr.pis) : 0) -
                            (tr.cofins ? Math.round(sel.value * tr.cofins) : 0) -
                            (tr.dasRate ? Math.round(sel.value * tr.dasRate) : 0),
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {sel.status === 'ACTIVE' && (
                <button
                  onClick={() => suspend(sel.id)}
                  className="flex-1 py-2.5 border border-amber-300 text-amber-700 rounded-lg text-sm hover:bg-amber-50"
                >
                  Suspender
                </button>
              )}
              {sel.status === 'SUSPENDED' && (
                <button
                  onClick={() => activate(sel.id)}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Reativar
                </button>
              )}
              <button
                onClick={async () => {
                  const addYear = (d) =>
                    d
                      ? new Date(new Date(d).setFullYear(new Date(d).getFullYear() + 1)).toISOString().split('T')[0]
                      : null;
                  const result = await api.createContract({
                    customer_id: sel.customer_id,
                    type: sel.type,
                    value: sel.value,
                    start_date: addYear(sel.start_date || sel.start),
                    end_date: addYear(sel.end_date || sel.end),
                    sla_hours: sel.sla_hours || sel.sla,
                    status: 'ACTIVE',
                  });
                  if (result.success) {
                    setContracts((p) => [result.data, ...p]);
                    setSelected(null);
                    setToast(`Contrato renovado: ${result.data.number}`);
                  } else {
                    setToast(result.error || 'Erro ao renovar contrato');
                  }
                }}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Renovar Contrato
              </button>
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

      {/* Novo Contrato Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Novo Contrato" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select
              value={form.customer_id}
              onChange={(e) => setForm((p) => ({ ...p, customer_id: e.target.value }))}
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
            { label: 'Valor (R$) *', key: 'value', placeholder: '0,00', type: 'number' },
            { label: 'SLA (horas)', key: 'sla_hours', placeholder: '24', type: 'number' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                value={form[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="MONTHLY">Mensal</option>
              <option value="QUARTERLY">Trimestral</option>
              <option value="ANNUAL">Anual</option>
              <option value="ON_DEMAND">Avulso</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início *</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Encerramento *</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
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
              onClick={create}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Criar Contrato
            </button>
          </div>
        </div>
      </Modal>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export { ContractsPage };
