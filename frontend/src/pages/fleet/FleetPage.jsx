import { Badge, STATUS_MAP } from '../../components/Badge.jsx';
import { Icon } from '../../components/Icon.jsx';
import { KPI } from '../../components/KPI.jsx';
import { LabelField } from '../../components/LabelField.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Toast } from '../../components/Toast.jsx';
import { api } from '../../api/client.js';
import { fmt, fmtDate } from '../../utils/format.js';
import { useEffect, useState } from 'react';

const FleetPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [technicians, setTechs] = useState([]);
  const [maintenance, setMaint] = useState([]);
  const [selected, setSelected] = useState(null);
  const [newModal, setNewModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ plate: '', model: '', year: '', assigned_technician_id: '' });
  const [odoEdit, setOdoEdit] = useState('');
  const [maintForm, setMaintForm] = useState({ date: '', type: 'Preventiva', desc: '', km: '', cost: '', tech: '' });

  useEffect(() => {
    api.getAllVehicles().then((r) => setVehicles(r.data?.data || r.data || []));
    api.getAllTechnicians().then((r) => setTechs(r.data?.data || r.data || []));
  }, []);

  useEffect(() => {
    if (selected?.id) {
      api.getVehicleMaintenance(selected.id).then((r) => {
        if (r.success) setMaint(r.data || []);
      });
    } else {
      setMaint([]);
    }
  }, [selected?.id]);

  const create = async () => {
    if (!form.plate || !form.model) {
      setToast('Placa e modelo são obrigatórios');
      return;
    }
    const result = await api.createVehicle({
      plate: form.plate.toUpperCase(),
      model: form.model,
      year: parseInt(form.year) || new Date().getFullYear(),
      assigned_technician_id: form.assigned_technician_id || null,
      status: 'AVAILABLE',
    });
    if (result.success) {
      setVehicles((p) => [result.data, ...p]);
      setNewModal(false);
      setForm({ plate: '', model: '', year: '', assigned_technician_id: '' });
      setToast(`Veículo ${result.data.plate} cadastrado!`);
    } else {
      setToast(`Erro: ${result.error}`);
    }
  };

  const updateOdo = async (id) => {
    const km = parseInt(odoEdit) || 0;
    const result = await api.updateVehicle(id, { odometer: km });
    if (result.success) {
      setVehicles((p) => p.map((v) => (v.id === id ? { ...v, odometer: km } : v)));
      setSelected((prev) => (prev ? { ...prev, odometer: km } : null));
      setOdoEdit('');
      setToast('Odômetro atualizado!');
    } else {
      setToast(`Erro: ${result.error}`);
    }
  };

  const changeStatus = async (id, status) => {
    const result = await api.updateVehicle(id, { status });
    if (result.success) {
      setVehicles((p) => p.map((v) => (v.id === id ? { ...v, status } : v)));
      setSelected((prev) => (prev ? { ...prev, status } : null));
      setToast('Status do veículo atualizado!');
    } else {
      setToast(`Erro: ${result.error}`);
    }
  };

  const sel = selected ? vehicles.find((v) => v.id === selected.id) || selected : null;

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI
          title="Frota Total"
          value={`${vehicles.length} veículos`}
          sub={`${vehicles.filter((v) => v.status === 'IN_USE').length} em campo`}
          icon="fleet"
          color="blue"
        />
        <KPI
          title="Disponíveis"
          value={vehicles.filter((v) => v.status === 'AVAILABLE').length}
          sub="prontos para uso"
          icon="fleet"
          color="green"
        />
        <KPI
          title="Em Manutenção"
          value={vehicles.filter((v) => v.status === 'MAINTENANCE').length}
          sub="fora de operação"
          icon="audit"
          color="orange"
        />
        <KPI
          title="Km Total Frota"
          value={`${vehicles.reduce((s, v) => s + v.odometer, 0).toLocaleString('pt-BR')} km`}
          sub="odômetro acumulado"
          icon="fleet"
          color="purple"
        />
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Frota Cadastrada</h3>
        <button
          onClick={() => setNewModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Icon name="plus" className="w-4 h-4" /> Novo Veículo
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Placa', 'Modelo', 'Ano', 'Responsável', 'Status', 'Odômetro', 'Próx. Revisão', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicles.map((v) => (
              <tr
                key={v.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelected(v);
                  setOdoEdit(String(v.odometer));
                }}
              >
                <td className="px-4 py-3 font-mono font-bold text-gray-700">{v.plate}</td>
                <td className="px-4 py-3 text-gray-800">{v.model}</td>
                <td className="px-4 py-3 text-gray-600">{v.year}</td>
                <td className="px-4 py-3 text-gray-600">
                  {v.technicians?.name || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge status={v.status} />
                </td>
                <td className="px-4 py-3 text-gray-700">{(v.odometer || 0).toLocaleString('pt-BR')} km</td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(v.next_service_date || v.nextService)}</td>
                <td className="px-4 py-3">
                  <button className="text-xs text-blue-600 hover:underline font-medium">Detalhes →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vehicle Detail Modal */}
      <Modal
        open={!!sel}
        onClose={() => setSelected(null)}
        title={`${sel?.plate || ''} — ${sel?.model || ''}`}
        size="md"
      >
        {sel && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Badge status={sel.status} />
              <span className="text-sm text-gray-500">{sel.year}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <LabelField label="Modelo" value={sel.model} />
              <LabelField label="Ano" value={sel.year} />
              <LabelField label="Responsável" value={sel.tech || 'Não atribuído'} />
              <LabelField label="Última Revisão" value={fmtDate(sel.lastService)} />
              <LabelField label="Próx. Revisão" value={fmtDate(sel.nextService)} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Odômetro (km)</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={odoEdit}
                  onChange={(e) => setOdoEdit(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => updateOdo(sel.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Alterar Status</p>
              <div className="flex gap-2">
                {['AVAILABLE', 'IN_USE', 'MAINTENANCE'].map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(sel.id, s)}
                    className={`flex-1 py-2 text-xs rounded-lg border transition-colors ${sel.status === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {STATUS_MAP[s]?.[1] || s}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">Histórico de Manutenção</p>
                <span className="text-xs text-gray-400">{maintenance.length} registro(s)</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {maintenance.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">Nenhum registro ainda</p>
                ) : (
                  maintenance.map((m) => (
                    <div key={m.id} className="bg-gray-50 rounded-lg p-2.5 text-xs">
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`font-semibold px-1.5 py-0.5 rounded ${m.type === 'Preventiva' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}
                        >
                          {m.type}
                        </span>
                        <span className="text-gray-400">
                          {fmtDate(m.date)} · {m.km?.toLocaleString('pt-BR')} km
                        </span>
                      </div>
                      <p className="text-gray-700 mt-0.5">{m.description || m.desc}</p>
                      <div className="flex justify-between mt-0.5 text-gray-400">
                        <span>Técnico: {m.technician_name || m.tech || '—'}</span>
                        <span className="font-medium text-gray-600">{fmt(m.cost)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                <p className="text-xs font-semibold text-gray-600">Registrar Manutenção</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">Data</label>
                    <input
                      type="date"
                      value={maintForm.date}
                      onChange={(e) => setMaintForm((p) => ({ ...p, date: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Tipo</label>
                    <select
                      value={maintForm.type}
                      onChange={(e) => setMaintForm((p) => ({ ...p, type: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white"
                    >
                      <option>Preventiva</option>
                      <option>Corretiva</option>
                      <option>Revisão</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">KM atual</label>
                    <input
                      type="number"
                      value={maintForm.km}
                      onChange={(e) => setMaintForm((p) => ({ ...p, km: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white"
                      placeholder="87500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Custo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={maintForm.cost}
                      onChange={(e) => setMaintForm((p) => ({ ...p, cost: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white"
                      placeholder="350.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Descrição</label>
                  <input
                    value={maintForm.desc}
                    onChange={(e) => setMaintForm((p) => ({ ...p, desc: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white"
                    placeholder="Troca de óleo e filtros..."
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Técnico</label>
                  <select
                    value={maintForm.tech}
                    onChange={(e) => setMaintForm((p) => ({ ...p, tech: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white"
                  >
                    <option value="">Selecionar...</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={async () => {
                    if (!maintForm.date || !maintForm.desc) {
                      setToast('Data e descrição são obrigatórios');
                      return;
                    }
                    const result = await api.createVehicleMaintenance(sel.id, {
                      date: maintForm.date,
                      type: maintForm.type,
                      description: maintForm.desc,
                      km: parseInt(maintForm.km) || sel.odometer || null,
                      cost: Math.round(parseFloat(maintForm.cost || 0) * 100),
                      technician_name: maintForm.tech || null,
                    });
                    if (result.success) {
                      setMaint((prev) => [result.data, ...prev]);
                      setMaintForm({ date: '', type: 'Preventiva', desc: '', km: '', cost: '', tech: '' });
                      setToast('Manutenção registrada!');
                    } else {
                      setToast(`Erro: ${result.error}`);
                    }
                  }}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                >
                  Registrar
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Novo Veículo Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Novo Veículo" size="md">
        <div className="space-y-4">
          {[
            { label: 'Placa *', key: 'plate', placeholder: 'Ex: MNO-5H01' },
            { label: 'Modelo *', key: 'model', placeholder: 'Ex: Fiat Fiorino' },
            { label: 'Ano', key: 'year', placeholder: '2026', type: 'number' },
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
            <select
              value={form.assigned_technician_id}
              onChange={(e) => setForm((p) => ({ ...p, assigned_technician_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">Nenhum</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
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
              Cadastrar Veículo
            </button>
          </div>
        </div>
      </Modal>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export { FleetPage };
