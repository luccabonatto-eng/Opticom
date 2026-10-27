import { Icon } from '../../components/Icon.jsx';
import { LabelField } from '../../components/LabelField.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Toast } from '../../components/Toast.jsx';
import { api } from '../../api/client.js';
import { fmt } from '../../utils/format.js';
import { useEffect, useState } from 'react';

const InventoryPage = () => {
  const [q, setQ] = useState('');
  const [belowMin, setBelowMin] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [newModal, setNewModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustDir, setAdjustDir] = useState('+');
  const [adjustNote, setAdjustNote] = useState('');
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ sku: '', name: '', cat: 'Equipamentos', qty: '', min: '', cost: '', loc: '' });
  const [invTab, setInvTab] = useState('items');
  const [products, setProducts] = useState([]);
  const [prodForm, setProdForm] = useState({
    code: '',
    name: '',
    cat: 'Equipamentos',
    unit: 'un',
    costRef: '',
    desc: '',
  });
  const [newProdModal, setNewProdModal] = useState(false);

  const normalizeProduct = (p) => ({
    ...p,
    cat: p.category || p.cat || 'Outros',
    qty: p.quantity ?? p.qty ?? 0,
    min: p.min_quantity ?? p.min ?? 0,
    cost: p.unit_cost !== undefined ? Math.round(p.unit_cost * 100) : p.cost || 0,
    loc: p.description || p.loc || '',
    belowMin: (p.quantity ?? p.qty ?? 0) < (p.min_quantity ?? p.min ?? 1),
    code: p.sku || p.code || '',
    unit: p.unit || 'un',
    costRef: p.unit_cost !== undefined ? Math.round(p.unit_cost * 100) : p.costRef || 0,
    desc: p.description || p.desc || '',
  });

  useEffect(() => {
    api.getAllProducts().then((r) => {
      if (r.success) {
        const normalized = (r.data?.data || r.data || []).map(normalizeProduct);
        setInventory(normalized);
        setProducts(normalized);
      }
    });
  }, []);

  const items = inventory.filter(
    (i) =>
      (!q || i.name.toLowerCase().includes(q.toLowerCase()) || i.sku.toLowerCase().includes(q.toLowerCase())) &&
      (!belowMin || i.belowMin),
  );

  const createItem = async () => {
    if (!form.name || !form.sku) {
      setToast('Nome e SKU são obrigatórios');
      return;
    }
    const result = await api.createProduct({
      sku: form.sku,
      name: form.name,
      category: form.cat,
      quantity: parseInt(form.qty) || 0,
      min_quantity: parseInt(form.min) || 0,
      unit_cost: parseFloat(form.cost || 0),
      description: form.loc,
    });
    if (result.success) {
      const normalized = normalizeProduct(result.data);
      setInventory((p) => [normalized, ...p]);
      setProducts((p) => [normalized, ...p]);
      setNewModal(false);
      setForm({ sku: '', name: '', cat: 'Equipamentos', qty: '', min: '', cost: '', loc: '' });
      setToast(`Item ${form.name} cadastrado!`);
    } else {
      setToast(result.error || 'Erro ao cadastrar item');
    }
  };

  const doAdjust = async () => {
    const target = adjustModal || selected;
    if (!target) return;
    const qty = parseInt(adjustQty) || 0;
    const curQty = inventory.find((i) => i.id === target.id)?.qty ?? target.qty ?? 0;
    const newQty = adjustDir === '+' ? curQty + qty : Math.max(0, curQty - qty);
    const result = await api.updateProduct(target.id, { quantity: newQty });
    if (result.success) {
      const updater = (i) =>
        i.id !== target.id ? i : { ...i, qty: newQty, quantity: newQty, belowMin: newQty < i.min };
      setInventory((p) => p.map(updater));
      setToast(`Estoque de ${target.name} ajustado!`);
    } else {
      setToast(result.error || 'Erro ao ajustar estoque');
    }
    setAdjustModal(null);
    setAdjustQty('');
    setAdjustDir('+');
    setAdjustNote('');
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setInvTab('items')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${invTab === 'items' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Itens de Estoque
        </button>
        <button
          onClick={() => setInvTab('products')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${invTab === 'products' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Catálogo de Produtos
        </button>
      </div>

      {invTab === 'items' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={belowMin}
                onChange={(e) => setBelowMin(e.target.checked)}
                className="rounded"
              />
              Apenas abaixo do mínimo
            </label>
            <button
              onClick={() => setNewModal(true)}
              className="ml-auto flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Icon name="plus" className="w-4 h-4" /> Novo Item
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    'SKU',
                    'Nome',
                    'Categ.',
                    'Qtd / Mín',
                    'Custo Unit.',
                    'Valor Total',
                    'Localização',
                    'Status',
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
                {items.map((i) => (
                  <tr
                    key={i.id}
                    className={`hover:bg-gray-50 cursor-pointer ${i.belowMin ? 'bg-red-50' : ''}`}
                    onClick={() => setSelected(i)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{i.sku}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{i.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{i.cat}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${i.belowMin ? 'text-red-600' : 'text-gray-800'}`}>{i.qty}</span>
                        <span className="text-xs text-gray-400">/ {i.min}</span>
                      </div>
                      <div className="w-16 bg-gray-100 rounded-full h-1 mt-1">
                        <div
                          className={`h-1 rounded-full ${i.belowMin ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (i.qty / i.min) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{fmt(i.cost)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{fmt(i.cost * i.qty)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{i.loc}</td>
                    <td className="px-4 py-3">
                      {i.belowMin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">
                          ⚠ Crítico
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-blue-600 hover:underline font-medium">Ajustar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Item Detail / Adjust Modal */}
          <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || ''} size="md">
            {selected && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <LabelField label="SKU" value={selected.sku} />
                  <LabelField label="Categoria" value={selected.cat} />
                  <LabelField label="Custo Unit." value={fmt(selected.cost)} />
                  <LabelField label="Localização" value={selected.loc} />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Quantidade Atual</p>
                    <p className={`text-2xl font-bold ${selected.belowMin ? 'text-red-600' : 'text-gray-800'}`}>
                      {inventory.find((i) => i.id === selected.id)?.qty ?? selected.qty}
                    </p>
                    <p className="text-xs text-gray-400">Mínimo: {selected.min}</p>
                  </div>
                  <LabelField
                    label="Valor Total"
                    value={fmt(selected.cost * (inventory.find((i) => i.id === selected.id)?.qty ?? selected.qty))}
                  />
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Ajustar Estoque</p>
                  <div className="flex gap-2 mb-3">
                    {[
                      ['+', 'Entrada / Compra'],
                      ['-', 'Saída / Uso'],
                    ].map(([d, l]) => (
                      <button
                        key={d}
                        onClick={() => setAdjustDir(d)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border ${adjustDir === d ? (d === '+' ? 'bg-green-600 text-white border-green-600' : 'bg-red-600 text-white border-red-600') : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {d} {l}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Quantidade</label>
                      <input
                        type="number"
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Observação</label>
                      <input
                        value={adjustNote}
                        onChange={(e) => setAdjustNote(e.target.value)}
                        placeholder="Motivo..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      doAdjust();
                      setSelected(null);
                    }}
                    className="mt-3 w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Confirmar Ajuste
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {/* New Item Modal */}
          <Modal open={newModal} onClose={() => setNewModal(false)} title="Novo Item de Estoque" size="md">
            <div className="space-y-4">
              {[
                { label: 'SKU *', key: 'sku', placeholder: 'Ex: NOB-5KVA' },
                { label: 'Nome *', key: 'name', placeholder: 'Ex: Nobreak 5KVA' },
                { label: 'Localização', key: 'loc', placeholder: 'Ex: Almox. A — Prat. 1' },
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={form.cat}
                  onChange={(e) => setForm((p) => ({ ...p, cat: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  {['Equipamentos', 'Conectores', 'Cabos', 'Elétrico', 'Outros'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Qtd Inicial', key: 'qty', placeholder: '0' },
                  { label: 'Qtd Mínima', key: 'min', placeholder: '0' },
                  { label: 'Custo (R$)', key: 'cost', placeholder: '0,00' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <input
                      type="number"
                      value={form[f.key]}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setNewModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={createItem}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Cadastrar Item
                </button>
              </div>
            </div>
          </Modal>

          {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
        </div>
      )}

      {invTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{products.length} produto(s) cadastrado(s)</p>
            <button
              onClick={() => setNewProdModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Icon name="plus" className="w-4 h-4" /> Novo Produto
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Código', 'Nome', 'Categoria', 'Unid.', 'Custo Ref.', 'Descrição', ''].map((h) => (
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
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.cat}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.unit}</td>
                    <td className="px-4 py-3 text-gray-700">{fmt(p.costRef)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{p.desc}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={async () => {
                          const r = await api.deleteProduct(p.id);
                          if (r.success) {
                            setProducts((prev) => prev.filter((x) => x.id !== p.id));
                            setInventory((prev) => prev.filter((x) => x.id !== p.id));
                          }
                        }}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Modal open={newProdModal} onClose={() => setNewProdModal(false)} title="Novo Produto" size="md">
            <div className="space-y-4">
              {[
                { l: 'Código *', k: 'code', ph: 'PROD-007' },
                { l: 'Nome *', k: 'name', ph: 'Nome do produto' },
                { l: 'Custo de Referência (R$)', k: 'costRef', ph: '0.00', type: 'number' },
                { l: 'Descrição', k: 'desc', ph: 'Descrição técnica do produto' },
              ].map((f) => (
                <div key={f.k}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.l}</label>
                  <input
                    type={f.type || 'text'}
                    value={prodForm[f.k]}
                    onChange={(e) => setProdForm((p) => ({ ...p, [f.k]: e.target.value }))}
                    placeholder={f.ph}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={prodForm.cat}
                    onChange={(e) => setProdForm((p) => ({ ...p, cat: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  >
                    {['Baterias', 'Equipamentos', 'Cabos', 'Conectores', 'Elétrico', 'Outros'].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <select
                    value={prodForm.unit}
                    onChange={(e) => setProdForm((p) => ({ ...p, unit: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  >
                    {['un', 'cx', 'kg', 'm', 'lt', 'par'].map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setNewProdModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!prodForm.code.trim() || !prodForm.name.trim()) return;
                    const r = await api.createProduct({
                      sku: prodForm.code,
                      name: prodForm.name,
                      category: prodForm.cat,
                      unit_cost: parseFloat(prodForm.costRef || 0),
                      description: prodForm.desc,
                    });
                    if (r.success) {
                      const n = normalizeProduct(r.data);
                      setProducts((p) => [...p, n]);
                      setInventory((p) => [...p, n]);
                      setNewProdModal(false);
                      setProdForm({ code: '', name: '', cat: 'Equipamentos', unit: 'un', costRef: '', desc: '' });
                      setToast('Produto cadastrado!');
                    } else setToast(r.error || 'Erro ao cadastrar produto');
                  }}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Cadastrar
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
};

export { InventoryPage };
