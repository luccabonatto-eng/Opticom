import { Badge } from '../../components/Badge.jsx';
import { Icon } from '../../components/Icon.jsx';
import { LabelField } from '../../components/LabelField.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Toast } from '../../components/Toast.jsx';
import { api } from '../../api/client.js';
import { fmt } from '../../utils/format.js';
import { useEffect, useState } from 'react';

const CustomersPage = ({ setPage }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [typeF, setTypeF] = useState('all');
  const [selected, setSelected] = useState(null);
  const [newModal, setNewModal] = useState(false);
  const [editId, setEditId] = useState(null); // null = cadastrando
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'PJ', doc: '', city: '', phone: '', email: '', active: true });

  // Carregar clientes da API
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    const result = await api.getAllCustomers();
    if (result.success) {
      setCustomers(result.data?.data || result.data || []);
    } else {
      setCustomers([]);
    }
    setLoading(false);
  };

  const list = customers.filter(
    (c) =>
      (!q || c.name.toLowerCase().includes(q.toLowerCase()) || c.doc.includes(q)) &&
      (typeF === 'all' || c.type === typeF),
  );

  const limparForm = () => {
    setEditId(null);
    setForm({ name: '', type: 'PJ', doc: '', city: '', phone: '', email: '', active: true });
  };

  const salvar = async () => {
    if (!form.name) {
      setToast('Nome é obrigatório');
      return;
    }
    if (!form.doc) {
      setToast('CPF/CNPJ é obrigatório');
      return;
    }

    const result = editId ? await api.updateCustomer(editId, form) : await api.createCustomer(form);
    if (!result.success) {
      setToast(`Erro ao ${editId ? 'salvar' : 'criar'} cliente: ${result.error}`);
      return;
    }
    if (editId) {
      setCustomers((p) => p.map((c) => (c.id === editId ? { ...c, ...result.data } : c)));
      setSelected((p) => (p?.id === editId ? { ...p, ...result.data } : p));
      setToast(`Cliente ${form.name} atualizado!`);
    } else {
      setCustomers((p) => [result.data, ...p]);
      setToast(`Cliente ${form.name} cadastrado com sucesso!`);
    }
    setNewModal(false);
    limparForm();
  };

  const abrirEdicao = (c) => {
    setEditId(c.id);
    setForm({
      name: c.name || '',
      type: c.type || 'PJ',
      doc: c.doc || '',
      city: c.city || '',
      phone: c.phone || '',
      email: c.email || '',
      active: c.active !== false,
    });
    setSelected(null);
    setNewModal(true);
  };

  const excluir = async (c) => {
    // transactions.customer_id é SET NULL: excluir o cliente não falha, apenas
    // arranca o vínculo do histórico financeiro em silêncio. Avisa antes.
    const r = await api.getTransactions({ customer_id: c.id, limit: 1 });
    const qtdLanc = r.success ? r.data?.pagination?.total || 0 : 0;

    const aviso =
      qtdLanc > 0
        ? `O cliente ${c.name} tem ${qtdLanc} lançamento(s) financeiro(s). Eles NÃO serão excluídos, mas perderão o vínculo com o cliente e passarão a aparecer como "Sem cliente" no DRE. Isso não pode ser desfeito.\n\nExcluir mesmo assim?`
        : `Excluir o cliente ${c.name} permanentemente? Essa ação não pode ser desfeita.`;
    if (!window.confirm(aviso)) return;

    const result = await api.deleteCustomer(c.id);
    if (result.success) {
      setCustomers((p) => p.filter((x) => x.id !== c.id));
      setSelected(null);
      setToast(qtdLanc > 0 ? `Cliente excluído. ${qtdLanc} lançamento(s) ficaram sem cliente.` : 'Cliente excluído.');
    } else {
      // contracts e orders bloqueiam a exclusão no banco (NO ACTION)
      const vinculado = /foreign key|violates|constraint/i.test(result.error || '');
      setToast(
        vinculado
          ? 'Cliente tem OS ou contratos vinculados e não pode ser excluído. Use Inativar.'
          : `Erro ao excluir: ${result.error}`,
      );
    }
  };

  const toggleActive = async (id) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;

    const result = await api.updateCustomer(id, { active: !customer.active });
    if (result.success) {
      setCustomers((p) => p.map((c) => (c.id === id ? result.data : c)));
      setSelected((p) => (p?.id === id ? result.data : p));
    } else {
      setToast(`Erro ao atualizar cliente: ${result.error}`);
    }
  };

  const sel = selected ? customers.find((c) => c.id === selected.id) || selected : null;

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nome ou documento..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={typeF}
          onChange={(e) => setTypeF(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="all">Todos</option>
          <option value="PJ">Pessoa Jurídica</option>
          <option value="PF">Pessoa Física</option>
        </select>
        <button
          onClick={() => {
            limparForm();
            setNewModal(true);
          }}
          className="ml-auto flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Icon name="plus" className="w-4 h-4" /> Novo Cliente
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Tipo', 'Nome', 'Documento', 'Cidade', 'Contratos', 'OS Abertas', 'Faturamento', 'Status', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(c)}>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${c.type === 'PJ' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}
                  >
                    {c.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.doc}</td>
                <td className="px-4 py-3 text-gray-600">{c.city || '—'}</td>
                <td className="px-4 py-3 text-center text-gray-700">{c.contracts}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${c.openOS > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                    {c.openOS}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{fmt(c.revenue)}</td>
                <td className="px-4 py-3">
                  <Badge status={c.active ? 'ACTIVE' : 'INACTIVE'} />
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs text-blue-600 hover:underline font-medium">Detalhes →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
          <span className="text-xs text-gray-500">{list.length} clientes encontrados</span>
        </div>
      </div>

      {/* Customer Detail Modal */}
      <Modal open={!!sel} onClose={() => setSelected(null)} title={sel?.name || ''} size="lg">
        {sel && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${sel.type === 'PJ' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}
              >
                {sel.type}
              </span>
              <Badge status={sel.active ? 'ACTIVE' : 'INACTIVE'} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <LabelField label="Documento" value={sel.doc} />
                <LabelField label="Cidade" value={sel.city} />
                <div className="flex items-center gap-2">
                  <Icon name="phone" className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${sel.phone}`} className="text-sm text-blue-600">
                    {sel.phone || '—'}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="mail" className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${sel.email}`} className="text-sm text-blue-600">
                    {sel.email || '—'}
                  </a>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xl font-bold text-gray-800">{sel.contracts}</p>
                    <p className="text-xs text-gray-400">Contratos</p>
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${sel.openOS > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
                      {sel.openOS}
                    </p>
                    <p className="text-xs text-gray-400">OS Abertas</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{fmt(sel.revenue)}</p>
                    <p className="text-xs text-gray-400">Faturamento</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelected(null);
                  setPage('orders');
                }}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Nova OS para este cliente
              </button>
              <button
                onClick={() => {
                  setSelected(null);
                  setPage('financial');
                }}
                className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-sm font-semibold flex items-center gap-1.5"
                title="Ver DRE e rentabilidade financeira deste cliente"
              >
                <span>📊</span> Ver DRE & Lucro
              </button>
              <button
                onClick={() => toggleActive(sel.id)}
                className={`px-4 py-2.5 border rounded-lg text-sm ${sel.active ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
              >
                {sel.active ? 'Inativar' : 'Ativar'}
              </button>
              <button
                onClick={() => abrirEdicao(sel)}
                title="Editar dados do cliente"
                className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                ✎ Editar
              </button>
              <button
                onClick={() => excluir(sel)}
                title="Excluir cliente permanentemente"
                className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
              >
                🗑 Excluir
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Novo Cliente Modal */}
      <Modal
        open={newModal}
        onClose={() => {
          setNewModal(false);
          limparForm();
        }}
        title={editId ? 'Editar Cliente' : 'Novo Cliente'}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            {[
              ['PJ', 'Pessoa Jurídica'],
              ['PF', 'Pessoa Física'],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setForm((p) => ({ ...p, type: v }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {l}
              </button>
            ))}
          </div>
          {[
            { label: 'Nome / Razão Social *', key: 'name', placeholder: 'Ex: Empresa XYZ Ltda' },
            {
              label: form.type === 'PJ' ? 'CNPJ *' : 'CPF *',
              key: 'doc',
              placeholder: form.type === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00',
            },
            { label: 'Cidade', key: 'city', placeholder: 'Ex: São José do Rio Preto' },
            { label: 'Telefone', key: 'phone', placeholder: '(17) 99999-0000' },
            { label: 'E-mail', key: 'email', placeholder: 'contato@empresa.com.br' },
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
              onClick={() => {
                setNewModal(false);
                limparForm();
              }}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              {editId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </div>
      </Modal>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export { CustomersPage };
