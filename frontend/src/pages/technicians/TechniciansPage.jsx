import { Badge } from '../../components/Badge.jsx';
import { Icon } from '../../components/Icon.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Toast } from '../../components/Toast.jsx';
import { api } from '../../api/client.js';
import { useEffect, useState } from 'react';

const TechniciansPage = () => {
  const [technicians, setTechnicians] = useState([]);
  const [selected, setSelected] = useState(null);
  const [newModal, setNewModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', specs: '', status: 'ACTIVE' });

  useEffect(() => {
    loadTechnicians();
  }, []);
  const loadTechnicians = async () => {
    const r = await api.getAllTechnicians();
    if (r.success) setTechnicians(r.data?.data || r.data || []);
    else setTechnicians([]);
  };

  const create = async () => {
    if (!form.name || !form.phone) {
      setToast('Nome e telefone são obrigatórios');
      return;
    }
    const result = await api.createTechnician({
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      specializations: form.specs
        ? form.specs
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      status: form.status,
    });
    if (result.success) {
      setTechnicians((p) => [result.data, ...p]);
      setNewModal(false);
      setForm({ name: '', phone: '', email: '', specs: '', status: 'ACTIVE' });
      setToast(`Técnico ${form.name} cadastrado!`);
    } else {
      setToast(`Erro: ${result.error}`);
    }
  };

  const toggleStatus = async (id) => {
    const t = technicians.find((x) => x.id === id);
    const newStatus = t?.status === 'ACTIVE' ? 'ON_LEAVE' : 'ACTIVE';
    const result = await api.updateTechnician(id, { status: newStatus });
    if (result.success) {
      setTechnicians((p) => p.map((x) => (x.id === id ? { ...x, status: newStatus } : x)));
      setSelected(null);
      setToast('Status do técnico atualizado!');
    } else {
      setToast(`Erro: ${result.error}`);
    }
  };

  const deleteTech = async (id) => {
    if (!window.confirm('Excluir este técnico permanentemente?')) return;
    const result = await api.deleteTechnician(id);
    if (result.success) {
      setTechnicians((p) => p.filter((x) => x.id !== id));
      setSelected(null);
      setToast('Técnico excluído.');
    } else {
      setToast(`Erro: ${result.error}`);
    }
  };

  const sel = selected ? technicians.find((t) => t.id === selected.id) || selected : null;

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
            {technicians.filter((t) => t.status === 'ACTIVE').length} ativos
          </span>
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
            {technicians.filter((t) => t.status !== 'ACTIVE').length} afastados
          </span>
        </div>
        <button
          onClick={() => setNewModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Icon name="plus" className="w-4 h-4" /> Novo Técnico
        </button>
      </div>
      {technicians.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="technicians" className="w-7 h-7 text-blue-400" />
          </div>
          <p className="text-gray-600 font-medium mb-1">Nenhum técnico cadastrado</p>
          <p className="text-sm text-gray-400 mb-5">Clique em "Novo Técnico" para adicionar o primeiro.</p>
          <button
            onClick={() => setNewModal(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Icon name="plus" className="w-4 h-4" /> Novo Técnico
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {technicians.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelected(t)}
            className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow ${t.status !== 'ACTIVE' ? 'opacity-70' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {(t.name || '?')[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{t.name}</h3>
                  <p className="text-sm text-gray-500">{t.phone}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(t.specializations || t.specs || []).map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-100"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Badge status={t.status} />
            </div>
            {t.status === 'ACTIVE' && (
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800">{t.orders || 0}</p>
                  <p className="text-xs text-gray-400">OS / mês</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800">
                    {t.avg_time || t.avgMin || '—'}
                    <span className="text-sm font-normal text-gray-400">min</span>
                  </p>
                  <p className="text-xs text-gray-400">Tempo médio</p>
                </div>
                <div className="text-center">
                  <p
                    className={`text-xl font-bold ${(t.rework_percentage || t.rework || 0) > 5 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {t.rework_percentage || t.rework || 0}%
                  </p>
                  <p className="text-xs text-gray-400">Retrabalho</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tech Detail Modal */}
      <Modal open={!!sel} onClose={() => setSelected(null)} title={sel?.name || ''} size="md">
        {sel && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {(sel.name || '?')[0]}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">{sel.name}</h3>
                <Badge status={sel.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Icon name="phone" className="w-4 h-4 text-gray-400" />
                <a href={`tel:${sel.phone}`} className="text-sm text-blue-600">
                  {sel.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="mail" className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${sel.email}`} className="text-sm text-blue-600">
                  {sel.email || '—'}
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Especializações</p>
              <div className="flex flex-wrap gap-2">
                {(sel.specializations || sel.specs || []).map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 bg-blue-50 text-blue-600 text-sm rounded-lg border border-blue-100"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            {sel.status === 'ACTIVE' && (
              <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{sel.orders || 0}</p>
                  <p className="text-xs text-gray-400 mt-0.5">OS este mês</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {sel.avg_time || sel.avgMin || '—'}
                    <span className="text-sm font-normal text-gray-400">min</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Tempo médio</p>
                </div>
                <div>
                  <p
                    className={`text-2xl font-bold ${(sel.rework_percentage || sel.rework || 0) > 5 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {sel.rework_percentage || sel.rework || 0}%
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Retrabalho</p>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => toggleStatus(sel.id)}
                className={`flex-1 py-2.5 border rounded-lg text-sm font-medium ${sel.status === 'ACTIVE' ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}
              >
                {sel.status === 'ACTIVE' ? 'Registrar Afastamento' : 'Retornar ao Trabalho'}
              </button>
              <button
                onClick={() => deleteTech(sel.id)}
                className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
              >
                Excluir
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

      {/* Novo Técnico Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Novo Técnico" size="md">
        <div className="space-y-4">
          {[
            { label: 'Nome Completo *', key: 'name', placeholder: 'Ex: André Ferreira' },
            { label: 'Telefone *', key: 'phone', placeholder: '(17) 99999-0000' },
            { label: 'E-mail', key: 'email', placeholder: 'andre@opticom.com.br' },
            { label: 'Especializações', key: 'specs', placeholder: 'Ex: Instalação, Emergência (separar por vírgula)' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                value={form[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
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
              Cadastrar Técnico
            </button>
          </div>
        </div>
      </Modal>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export { TechniciansPage };
