import { Icon } from '../../components/Icon.jsx';
import { Toast } from '../../components/Toast.jsx';
import { api } from '../../api/client.js';
import { fmtDate } from '../../utils/format.js';
import { hojeISO } from '../../utils/dates.js';
import { useState } from 'react';

const input =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const EMPTY = { tech: '', date: hojeISO(), due: '', dest: '' };

// Abre o termo numa janela própria e chama a impressão (ou "Salvar como PDF")
const printTerm = (kit) => {
  const rows = (list, cols) =>
    list.length
      ? list.map((r) => `<tr>${cols.map((c) => `<td>${esc(r[c])}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${cols.length}" class="none">Nenhum</td></tr>`;
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) return false;
  w.document
    .write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Termo de Responsabilidade — ${esc(kit.tech)}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:32px}
  h1{font-size:16px;text-align:center;margin:0 0 4px} .sub{text-align:center;color:#555;margin-bottom:20px}
  .info{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-bottom:16px}
  h2{font-size:13px;margin:18px 0 6px} table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #999;padding:5px 7px;text-align:left} th{background:#eee} td.n{text-align:right}
  .none{text-align:center;color:#777} .decl{margin-top:20px;line-height:1.5;text-align:justify}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:56px;text-align:center}
  .sign div{border-top:1px solid #111;padding-top:4px} .ret{margin-top:40px;border:1px dashed #999;padding:10px}
</style></head><body>
<h1>TERMO DE RESPONSABILIDADE</h1>
<div class="sub">Retirada de materiais e ferramentas — Opticom · Saída nº ${esc(kit.id)}</div>
<div class="info">
  <div><b>Técnico:</b> ${esc(kit.tech)}</div><div><b>Data de saída:</b> ${esc(fmtDate(kit.date))}</div>
  <div><b>Destino / OS:</b> ${esc(kit.dest || '—')}</div><div><b>Retorno previsto:</b> ${esc(kit.due ? fmtDate(kit.due) : '—')}</div>
</div>
<h2>Materiais (produtos de estoque)</h2>
<table><tr><th>Código</th><th>Descrição</th><th>Qtd</th><th>Un</th></tr>${rows(kit.products, ['sku', 'name', 'qty', 'unit'])}</table>
<h2>Ferramentas e equipamentos</h2>
<table><tr><th>Patrimônio</th><th>Ferramenta</th><th>Nº de série</th></tr>${rows(kit.tools, ['code', 'name', 'serial'])}</table>
<p class="decl">Declaro que recebi os materiais e ferramentas relacionados acima, em perfeito estado de conservação e funcionamento,
para uso exclusivo nos serviços da empresa. Comprometo-me a zelar por eles, a devolver as ferramentas e os materiais não utilizados
no retorno, e a comunicar imediatamente qualquer perda, furto ou dano, respondendo por eles conforme a política interna da empresa.</p>
<div class="sign"><div>${esc(kit.tech)}<br>Técnico responsável</div><div>Responsável pelo almoxarifado</div></div>
<div class="ret"><b>Devolução</b> — Data: ____/____/______ &nbsp;&nbsp; Conferido por: ______________________________<br><br>
Itens faltantes ou danificados: ____________________________________________________________________</div>
<script>window.onload=()=>window.print()</script>
</body></html>`);
  w.document.close();
  return true;
};

const KitTab = ({ products, tools, setTools, techs, kits, setKits, onProductMoved }) => {
  const [head, setHead] = useState(EMPTY);
  const [cart, setCart] = useState([]); // produtos: { id, sku, name, unit, stock, qty }
  const [pick, setPick] = useState('');
  const [pickQty, setPickQty] = useState('1');
  const [toolIds, setToolIds] = useState([]);
  const [toolQ, setToolQ] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const inStock = products
    .filter((p) => p.qty > 0 && !cart.some((c) => c.id === p.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const available = tools.filter(
    (t) => t.status === 'AVAILABLE' && (!toolQ || `${t.name} ${t.code}`.toLowerCase().includes(toolQ.toLowerCase())),
  );
  const chosenTools = tools.filter((t) => toolIds.includes(t.id));

  const addProduct = () => {
    const p = products.find((x) => String(x.id) === pick);
    const qty = Number(pickQty);
    if (!p) return setToast('Escolha um produto');
    if (!Number.isInteger(qty) || qty <= 0) return setToast('Quantidade deve ser inteira e maior que zero');
    if (qty > p.qty) return setToast(`Só há ${p.qty} ${p.unit} de ${p.name} em estoque`);
    setCart((c) => [...c, { id: p.id, sku: p.sku, name: p.name, unit: p.unit, stock: p.qty, qty }]);
    setPick('');
    setPickQty('1');
  };

  const confirm = async () => {
    if (!head.tech) return setToast('Escolha o técnico');
    if (!cart.length && !toolIds.length) return setToast('Adicione ao menos um produto ou ferramenta');
    const bad = cart.find((c) => !Number.isInteger(c.qty) || c.qty <= 0 || c.qty > c.stock);
    if (bad) return setToast(`Quantidade inválida para ${bad.name} (estoque: ${bad.stock})`);

    setSaving(true);
    const note = `Saída p/ ${head.tech}${head.dest ? ` — ${head.dest}` : ''}`;
    const done = [];
    let fail = null;
    for (const c of cart) {
      const r = await api.createProductMovement(c.id, {
        type: 'OUT',
        quantity: c.qty,
        note,
      });
      if (!r.success) {
        fail = `${c.name}: ${r.error || 'erro ao baixar estoque'}`;
        break;
      }
      onProductMoved(c.id, r.data.balance_after);
      done.push(c);
    }
    setSaving(false);

    // Registra o que de fato saiu; o que falhou continua no carrinho para corrigir
    const kit = {
      id: (kits[0]?.id || 0) + 1,
      ...head,
      products: done,
      tools: chosenTools,
    };
    const entry = {
      date: head.date,
      type: 'OUT',
      who: head.tech,
      note: `Saída nº ${kit.id}`,
    };
    setTools((p) =>
      p.map((t) =>
        toolIds.includes(t.id)
          ? {
              ...t,
              status: 'CHECKED_OUT',
              holder: head.tech,
              since: head.date,
              due: head.due,
              os: head.dest,
              hist: [entry, ...(t.hist || [])],
            }
          : t,
      ),
    );
    setKits((k) => [kit, ...k]);
    setCart((c) => c.filter((x) => !done.includes(x)));
    setToolIds([]);
    if (fail) return setToast(`Saída nº ${kit.id} registrada sem o item que falhou — ${fail}`);
    setHead(EMPTY);
    if (!printTerm(kit)) setToast('Saída registrada. Libere pop-ups para imprimir o termo.');
    else setToast(`Saída nº ${kit.id} registrada!`);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        Os produtos saem do estoque de verdade. As ferramentas e a lista de saídas ainda são protótipo (somem ao
        recarregar).
      </p>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">1. Quem está saindo</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <select
                aria-label="Técnico"
                value={head.tech}
                onChange={(e) => setHead((h) => ({ ...h, tech: e.target.value }))}
                className={input}
              >
                <option value="">Técnico *</option>
                {techs.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
              <input
                aria-label="Destino ou OS"
                placeholder="Destino / OS (opcional)"
                value={head.dest}
                onChange={(e) => setHead((h) => ({ ...h, dest: e.target.value }))}
                className={input}
              />
              <label className="text-xs text-gray-500">
                Data de saída
                <input
                  type="date"
                  value={head.date}
                  onChange={(e) => setHead((h) => ({ ...h, date: e.target.value }))}
                  className={`${input} mt-1`}
                />
              </label>
              <label className="text-xs text-gray-500">
                Retorno previsto
                <input
                  type="date"
                  min={head.date}
                  value={head.due}
                  onChange={(e) => setHead((h) => ({ ...h, due: e.target.value }))}
                  className={`${input} mt-1`}
                />
              </label>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">2. Produtos do estoque</p>
            <div className="flex gap-2">
              <select
                aria-label="Produto"
                value={pick}
                onChange={(e) => setPick(e.target.value)}
                className={`${input} !w-auto flex-1 min-w-0`}
              >
                <option value="">Escolha o produto…</option>
                {inStock.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name} (estoque: {p.qty} {p.unit})
                  </option>
                ))}
              </select>
              <input
                aria-label="Quantidade do produto"
                type="number"
                min="1"
                value={pickQty}
                onChange={(e) => setPickQty(e.target.value)}
                className={`${input} !w-20 shrink-0`}
              />
              <button
                onClick={addProduct}
                className="flex items-center gap-1 px-3 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                <Icon name="plus" className="w-4 h-4" /> Adicionar
              </button>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-gray-700">3. Ferramentas disponíveis</p>
              <input
                aria-label="Buscar ferramenta"
                placeholder="Buscar…"
                value={toolQ}
                onChange={(e) => setToolQ(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-48"
              />
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-lg">
              {available.map((t) => (
                <label key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={toolIds.includes(t.id)}
                    onChange={(e) =>
                      setToolIds((ids) => (e.target.checked ? [...ids, t.id] : ids.filter((i) => i !== t.id)))
                    }
                    className="rounded"
                  />
                  <span className="font-mono text-xs text-gray-500 w-16">{t.code}</span>
                  <span className="text-gray-800">{t.name}</span>
                </label>
              ))}
              {!available.length && (
                <p className="px-3 py-4 text-sm text-gray-500 text-center">Nenhuma ferramenta disponível.</p>
              )}
            </div>
          </section>
        </div>

        <section className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 self-start">
          <p className="text-sm font-semibold text-gray-700">Resumo da saída {head.tech && `— ${head.tech}`}</p>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Produtos ({cart.length})</p>
            {!cart.length && <p className="text-xs text-gray-500">Nenhum produto adicionado.</p>}
            {cart.map((c) => (
              <div key={c.id} className="flex items-center gap-2 py-1.5 text-sm border-b border-gray-50">
                <span className="flex-1 text-gray-800 truncate">{c.name}</span>
                <input
                  aria-label={`Quantidade de ${c.name}`}
                  type="number"
                  min="1"
                  max={c.stock}
                  value={c.qty}
                  onChange={(e) =>
                    setCart((l) => l.map((x) => (x.id === c.id ? { ...x, qty: Number(e.target.value) } : x)))
                  }
                  className="w-16 border border-gray-200 rounded px-2 py-1 text-sm"
                />
                <span className="text-xs text-gray-500 w-6">{c.unit}</span>
                <button
                  aria-label={`Remover ${c.name}`}
                  onClick={() => setCart((l) => l.filter((x) => x.id !== c.id))}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Icon name="close" className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Ferramentas ({chosenTools.length})</p>
            {!chosenTools.length && <p className="text-xs text-gray-500">Nenhuma ferramenta marcada.</p>}
            {chosenTools.map((t) => (
              <p key={t.id} className="py-1 text-sm text-gray-800">
                <span className="font-mono text-xs text-gray-500 mr-2">{t.code}</span>
                {t.name}
              </p>
            ))}
          </div>
          <button
            onClick={confirm}
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Registrando…' : 'Confirmar saída e imprimir termo'}
          </button>
        </section>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <p className="text-sm font-semibold text-gray-700 px-4 pt-4 pb-2">Saídas registradas</p>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-y border-gray-200">
            <tr>
              {['Nº', 'Data', 'Técnico', 'Destino / OS', 'Retorno', 'Itens', ''].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {kits.map((k) => (
              <tr key={k.id}>
                <td className="px-4 py-2 font-mono text-xs">{k.id}</td>
                <td className="px-4 py-2 text-gray-600">{fmtDate(k.date)}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{k.tech}</td>
                <td className="px-4 py-2 text-gray-600">{k.dest || '—'}</td>
                <td className="px-4 py-2 text-gray-600">{k.due ? fmtDate(k.due) : '—'}</td>
                <td className="px-4 py-2 text-xs text-gray-600">
                  {k.products.length} produto(s) · {k.tools.length} ferramenta(s)
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => printTerm(k) || setToast('Libere pop-ups para imprimir')}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Imprimir termo
                  </button>
                </td>
              </tr>
            ))}
            {!kits.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                  Nenhuma saída registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export { KitTab };
