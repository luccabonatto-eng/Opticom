import { Icon } from '../../components/Icon.jsx';
import { Modal } from '../../components/Modal.jsx';
import { useState } from 'react';

const BASIC = [
  ['Chave Phillips 1/4"', 1],
  ['Chave Phillips 3/16"', 1],
  ['Chave Phillips 1/8"', 1],
  ['Chave de fenda 1/4"', 1],
  ['Chave de fenda 3/16"', 1],
  ['Chave de fenda 1/8"', 1],
  ['Martelo de unha 27 mm', 1],
  ['Alicate universal 8"', 1],
  ['Alicate de corte diagonal 6"', 1],
  ['Alicate de bico meia-cana 6"', 1],
  ['Chave ajustável 8"', 1],
  ['Jogo de chaves Allen', 1],
  ['Estilete', 1],
  ['Trena 5 m', 1],
  ['Lanterna', 1],
];
const items = (extra = []) => [...BASIC, ...extra].map(([name, qty], i) => ({ id: i + 1, name, qty }));

// shortcut: caixas em memória como as ferramentas; vão para o banco junto com a tabela tools
const BOXES_SEED = [
  {
    id: 1,
    name: 'Caixa 01',
    items: items([
      ['Kit limpeza de fibra', 1],
      ['Decapador de fibra', 1],
    ]),
  },
  { id: 2, name: 'Caixa 02', items: items([['Decapador de fibra', 1]]) },
  {
    id: 3,
    name: 'Caixa 03',
    items: items([
      ['Jogo de brocas', 1],
      ['Testador de tensão', 1],
    ]),
  },
  { id: 4, name: 'Caixa 04', items: items([['Testador de cabo de rede', 1]]) },
];

const input = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

const BoxesView = ({ boxes, setBoxes, tools, setTools, status }) => {
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null); // cópia da caixa em edição
  const [newItem, setNewItem] = useState({ name: '', qty: '1' });
  const [err, setErr] = useState('');

  const term = q.trim().toLowerCase();
  const toolsIn = (box) => tools.filter((t) => t.box === box.name);
  const shown = boxes.filter(
    (b) =>
      !term ||
      b.name.toLowerCase().includes(term) ||
      b.items.some((i) => i.name.toLowerCase().includes(term)) ||
      toolsIn(b).some((t) => `${t.name} ${t.code}`.toLowerCase().includes(term)),
  );
  const hit = (text) => term && text.toLowerCase().includes(term);

  const open = (box) => {
    setEdit(
      box
        ? structuredClone(box)
        : {
            id: null,
            name: `Caixa ${String(boxes.length + 1).padStart(2, '0')}`,
            items: items(),
          },
    );
    setNewItem({ name: '', qty: '1' });
    setErr('');
  };
  const addItem = () => {
    const qty = Number(newItem.qty);
    if (!newItem.name.trim() || !Number.isInteger(qty) || qty <= 0)
      return setErr('Informe o nome e uma quantidade inteira maior que zero');
    setEdit((b) => ({
      ...b,
      items: [...b.items, { id: Date.now(), name: newItem.name.trim(), qty }],
    }));
    setNewItem({ name: '', qty: '1' });
    setErr('');
  };
  const save = () => {
    const name = edit.name.trim();
    if (!name) return setErr('Dê um nome para a caixa');
    if (boxes.some((b) => b.id !== edit.id && b.name.toLowerCase() === name.toLowerCase()))
      return setErr('Já existe uma caixa com esse nome');
    if (edit.items.some((i) => !Number.isInteger(i.qty) || i.qty <= 0))
      return setErr('Quantidades devem ser inteiras e maiores que zero');
    const box = { ...edit, name, id: edit.id ?? Date.now() };
    const old = boxes.find((b) => b.id === edit.id);
    // Renomear a caixa leva junto os equipamentos que estavam nela
    if (old && old.name !== name) setTools((list) => list.map((t) => (t.box === old.name ? { ...t, box: name } : t)));
    setBoxes((list) => (edit.id ? list.map((b) => (b.id === edit.id ? box : b)) : [...list, box]));
    setEdit(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            aria-label="Procurar item nas caixas"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Onde está? Ex: martelo"
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => open(null)}
          className="ml-auto flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Icon name="plus" className="w-4 h-4" /> Nova Caixa
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {shown.map((b) => (
          <section key={b.id} className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-800">{b.name}</p>
                <p className="text-xs text-gray-500">
                  {b.items.reduce((s, i) => s + i.qty, 0)} ferramenta(s) manual(is) · {toolsIn(b).length} com patrimônio
                </p>
              </div>
              <button
                onClick={() => open(b)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
              >
                <Icon name="edit" className="w-3.5 h-3.5" /> Editar
              </button>
            </header>
            <div className="px-4 py-3 space-y-3 text-sm">
              <ul className="divide-y divide-gray-50">
                {b.items.map((i) => (
                  <li
                    key={i.id}
                    className={`flex justify-between py-1 ${hit(i.name) ? 'bg-yellow-100 -mx-2 px-2 rounded' : ''}`}
                  >
                    <span className="text-gray-700">{i.name}</span>
                    <span className="font-medium text-gray-800">{i.qty}</span>
                  </li>
                ))}
              </ul>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Com patrimônio</p>
                {!toolsIn(b).length && <p className="text-xs text-gray-500">Nenhuma.</p>}
                {toolsIn(b).map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-2 py-1 ${hit(`${t.name} ${t.code}`) ? 'bg-yellow-100 -mx-2 px-2 rounded' : ''}`}
                  >
                    <span className="font-mono text-xs text-gray-500">{t.code}</span>
                    <span className="flex-1 text-gray-700 truncate">{t.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status[t.status][0]}`}>
                      {status[t.status][1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
        {!shown.length && <p className="text-sm text-gray-500">Nenhuma caixa com esse item.</p>}
      </div>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? `Editar ${edit.name}` : 'Nova Caixa'}
        size="md"
      >
        {edit && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da caixa</label>
              <input
                aria-label="Nome da caixa"
                value={edit.name}
                onChange={(e) => setEdit((b) => ({ ...b, name: e.target.value }))}
                className={`${input} w-full`}
              />
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-lg">
              {edit.items.map((i) => (
                <div key={i.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                  <span className="flex-1 text-gray-700">{i.name}</span>
                  <input
                    aria-label={`Quantidade de ${i.name}`}
                    type="number"
                    min="1"
                    value={i.qty}
                    onChange={(e) =>
                      setEdit((b) => ({
                        ...b,
                        items: b.items.map((x) => (x.id === i.id ? { ...x, qty: Number(e.target.value) } : x)),
                      }))
                    }
                    className="w-16 border border-gray-200 rounded px-2 py-1 text-sm"
                  />
                  <button
                    aria-label={`Remover ${i.name}`}
                    onClick={() =>
                      setEdit((b) => ({
                        ...b,
                        items: b.items.filter((x) => x.id !== i.id),
                      }))
                    }
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Icon name="close" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                aria-label="Novo item"
                placeholder="Novo item, ex: Chave de boca 10 mm"
                value={newItem.name}
                onChange={(e) => setNewItem((n) => ({ ...n, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                className={`${input} flex-1 min-w-0`}
              />
              <input
                aria-label="Quantidade do novo item"
                type="number"
                min="1"
                value={newItem.qty}
                onChange={(e) => setNewItem((n) => ({ ...n, qty: e.target.value }))}
                className={`${input} w-20`}
              />
              <button
                onClick={addItem}
                className="px-3 border border-blue-600 text-blue-600 rounded-lg text-sm hover:bg-blue-50"
              >
                Adicionar
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Equipamentos com patrimônio entram na caixa pelo campo "Caixa" do cadastro da ferramenta.
            </p>
            {err && <p className="text-xs text-red-600">{err}</p>}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEdit(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Salvar caixa
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export { BoxesView, BOXES_SEED };
