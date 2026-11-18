import { Icon } from '../../components/Icon.jsx';
import { KPI } from '../../components/KPI.jsx';
import { LabelField } from '../../components/LabelField.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Toast } from '../../components/Toast.jsx';
import { BoxesView } from './BoxesView.jsx';
import { fmt, fmtDate } from '../../utils/format.js';
import { hojeISO } from '../../utils/dates.js';
import { useState } from 'react';

// shortcut: protótipo com dados em memória (somem ao recarregar); trocar por tabela tools + tool_movements no backend quando o layout for aprovado.
const TOOLS_SEED = [
  {
    id: 1,
    code: 'FER-001',
    name: 'Máquina de Fusão Fujikura 41S',
    serial: 'FJ41S-22871',
    box: 'Caixa 01',
    value: 4500000,
    status: 'CHECKED_OUT',
    holder: 'Carlos Souza',
    since: '2026-11-10',
    due: '2026-11-14',
    os: 'OS-1042',
    calib: '2027-03-01',
    hist: [{ date: '2026-11-10', type: 'OUT', who: 'Carlos Souza', note: 'OS-1042' }],
  },
  {
    id: 2,
    code: 'FER-002',
    name: 'OTDR EXFO MaxTester 715',
    serial: 'EX715-0093',
    box: 'Caixa 01',
    value: 3800000,
    status: 'AVAILABLE',
    calib: '2026-11-05',
  },
  {
    id: 3,
    code: 'FER-003',
    name: 'Clivador de Precisão CT-30',
    serial: 'CT30-5512',
    box: 'Caixa 02',
    value: 350000,
    status: 'CHECKED_OUT',
    holder: 'Ana Lima',
    since: '2026-11-17',
    due: '2026-11-21',
    os: 'OS-1051',
  },
  {
    id: 4,
    code: 'FER-004',
    name: 'Power Meter + Fonte de Luz',
    serial: 'PM-7781',
    box: 'Caixa 02',
    value: 120000,
    status: 'AVAILABLE',
    calib: '2027-01-15',
  },
  {
    id: 5,
    code: 'FER-005',
    name: 'Furadeira de Impacto Bosch',
    serial: 'BSH-99213',
    box: 'Caixa 03',
    value: 65000,
    status: 'MAINTENANCE',
    note: 'Mandril travando',
  },
  {
    id: 6,
    code: 'FER-006',
    name: 'Multímetro Fluke 117',
    serial: 'FL117-3321',
    box: 'Caixa 03',
    value: 180000,
    status: 'CHECKED_OUT',
    holder: 'Carlos Souza',
    since: '2026-11-03',
    due: '2026-11-07',
    os: 'OS-1033',
    calib: '2026-12-10',
    hist: [{ date: '2026-11-03', type: 'OUT', who: 'Carlos Souza', note: 'OS-1033' }],
  },
  {
    id: 7,
    code: 'FER-007',
    name: 'Escada Extensível 7m',
    serial: '—',
    box: '',
    value: 90000,
    status: 'AVAILABLE',
  },
  {
    id: 8,
    code: 'FER-008',
    name: 'Alicate de Crimpagem RJ45',
    serial: '—',
    box: 'Caixa 04',
    value: 15000,
    status: 'LOST',
    note: 'Não devolvido após OS-0988',
  },
];
const STATUS = {
  AVAILABLE: ['bg-green-100 text-green-700', 'Disponível'],
  CHECKED_OUT: ['bg-blue-100 text-blue-700', 'Com técnico'],
  MAINTENANCE: ['bg-yellow-100 text-yellow-700', 'Manutenção'],
  LOST: ['bg-red-100 text-red-700', 'Extraviada'],
};
export const MOVE = {
  OUT: 'Retirada',
  IN: 'Devolução',
  MAINT: 'Manutenção',
  BACK: 'Volta da manutenção',
  LOST: 'Extravio',
};

const isLate = (t) => t.status === 'CHECKED_OUT' && t.due && t.due < hojeISO();
const calibLate = (t) => t.calib && t.calib < hojeISO();
const input =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

const ToolsTab = ({ tools, setTools, techs, boxes, setBoxes }) => {
  const [view, setView] = useState('list');
  const [q, setQ] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fTech, setFTech] = useState('');
  const [selId, setSelId] = useState(null);
  const [checkout, setCheckout] = useState({ holder: '', os: '', due: '' });
  const [retCond, setRetCond] = useState('OK');
  const [newModal, setNewModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    serial: '',
    box: '',
    value: '',
    calib: '',
  });
  const [toast, setToast] = useState(null);

  const sel = tools.find((t) => t.id === selId);
  const shown = tools.filter(
    (t) =>
      (!q || `${t.name} ${t.code} ${t.serial} ${t.box}`.toLowerCase().includes(q.toLowerCase())) &&
      (!fStatus || (fStatus === 'LATE' ? isLate(t) : t.status === fStatus)) &&
      (!fTech || t.holder === fTech),
  );

  const move = (type, patch, note) => {
    const entry = {
      date: hojeISO(),
      type,
      who: patch.holder || sel.holder || '—',
      note,
    };
    setTools((p) => p.map((t) => (t.id === sel.id ? { ...t, ...patch, hist: [entry, ...(t.hist || [])] } : t)));
    setToast(`${sel.name}: ${MOVE[type].toLowerCase()} registrada!`);
    setSelId(null);
  };

  const doCheckout = () => {
    if (!checkout.holder) return setToast('Escolha o técnico');
    move(
      'OUT',
      {
        status: 'CHECKED_OUT',
        holder: checkout.holder,
        since: hojeISO(),
        due: checkout.due,
        os: checkout.os,
      },
      checkout.os,
    );
    setCheckout({ holder: '', os: '', due: '' });
  };
  const doReturn = () => {
    const damaged = retCond !== 'OK';
    move(
      'IN',
      {
        status: damaged ? 'MAINTENANCE' : 'AVAILABLE',
        holder: null,
        since: null,
        due: null,
        os: null,
        note: damaged ? retCond : null,
      },
      retCond,
    );
    setRetCond('OK');
  };

  const create = () => {
    if (!form.code.trim() || !form.name.trim()) return setToast('Código e nome são obrigatórios');
    if (tools.some((t) => t.code.toLowerCase() === form.code.trim().toLowerCase()))
      return setToast('Código já cadastrado');
    setTools((p) => [
      {
        ...form,
        id: Date.now(),
        code: form.code.trim(),
        value: Math.round(parseFloat(form.value || 0) * 100),
        status: 'AVAILABLE',
      },
      ...p,
    ]);
    setForm({ code: '', name: '', serial: '', box: '', value: '', calib: '' });
    setNewModal(false);
    setToast('Ferramenta cadastrada!');
  };

  const out = tools.filter((t) => t.status === 'CHECKED_OUT');
  const late = tools.filter(isLate);

  return (
    <div className="space-y-4">
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        Protótipo: dados de exemplo, as alterações não são salvas.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          title="Ferramentas"
          value={tools.length}
          sub={fmt(tools.reduce((s, t) => s + (t.value || 0), 0))}
          icon="inventory"
        />
        <KPI
          title="Disponíveis"
          value={tools.filter((t) => t.status === 'AVAILABLE').length}
          icon="check"
          color="green"
        />
        <KPI
          title="Com técnicos"
          value={out.length}
          sub={`${late.length} com devolução atrasada`}
          icon="technicians"
          color={late.length ? 'orange' : 'blue'}
        />
        <KPI
          title="Atenção"
          value={tools.filter((t) => t.status === 'MAINTENANCE' || t.status === 'LOST' || calibLate(t)).length}
          sub="manutenção, extravio ou calibração vencida"
          icon="shield"
          color="red"
        />
      </div>

      <div
        className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5"
        role="group"
        aria-label="Visualização"
      >
        {[
          ['list', 'Todas as ferramentas'],
          ['boxes', 'Por caixa'],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`px-4 py-1.5 text-sm rounded-md ${view === v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {view === 'boxes' && (
        <BoxesView boxes={boxes} setBoxes={setBoxes} tools={tools} setTools={setTools} status={STATUS} />
      )}

      {view === 'list' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                aria-label="Buscar ferramenta"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nome, código ou nº de série..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              aria-label="Filtrar por status"
              value={fStatus}
              onChange={(e) => setFStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS).map(([k, [, l]]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
              <option value="LATE">Devolução atrasada</option>
            </select>
            <select
              aria-label="Filtrar por técnico"
              value={fTech}
              onChange={(e) => setFTech(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos os técnicos</option>
              {techs.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <button
              onClick={() => setNewModal(true)}
              className="ml-auto flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Icon name="plus" className="w-4 h-4" /> Nova Ferramenta
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Código', 'Ferramenta', 'Status', 'Responsável', 'Devolução prevista', 'Caixa', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map((t) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-gray-50 cursor-pointer ${isLate(t) ? 'bg-orange-50' : ''}`}
                    onClick={() => setSelId(t.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-500">S/N {t.serial || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS[t.status][0]}`}
                      >
                        {STATUS[t.status][1]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {t.holder || '—'}
                      {t.os && <p className="text-xs text-gray-500">{t.os}</p>}
                    </td>
                    <td
                      className={`px-4 py-3 text-xs ${isLate(t) ? 'text-orange-700 font-semibold' : 'text-gray-600'}`}
                    >
                      {t.status === 'CHECKED_OUT' ? (t.due ? fmtDate(t.due) : 'Sem prazo') : '—'}
                      {isLate(t) && ' · atrasada'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{t.box || 'Sem caixa'}</td>
                    <td className="px-4 py-3 text-xs text-blue-600 font-medium whitespace-nowrap">
                      {t.status === 'AVAILABLE' ? 'Retirar' : t.status === 'CHECKED_OUT' ? 'Devolver' : 'Detalhes'}
                    </td>
                  </tr>
                ))}
                {!shown.length && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                      Nenhuma ferramenta encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={!!sel} onClose={() => setSelId(null)} title={sel?.name || ''} size="lg">
        {sel && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <LabelField label="Código" value={sel.code} />
              <LabelField label="Nº de série" value={sel.serial || '—'} />
              <LabelField label="Caixa" value={sel.box || 'Sem caixa'} />
              <LabelField label="Valor" value={fmt(sel.value || 0)} />
              <LabelField label="Status" value={STATUS[sel.status][1]} />
              <LabelField label="Próxima calibração" value={sel.calib ? fmtDate(sel.calib) : '—'} />
              {sel.holder && <LabelField label="Com" value={`${sel.holder} desde ${fmtDate(sel.since)}`} />}
              {sel.note && <LabelField label="Observação" value={sel.note} />}
            </div>

            {sel.status === 'AVAILABLE' && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Retirada para técnico</p>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    aria-label="Técnico"
                    value={checkout.holder}
                    onChange={(e) => setCheckout((p) => ({ ...p, holder: e.target.value }))}
                    className={input}
                  >
                    <option value="">Técnico *</option>
                    {techs.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  <input
                    aria-label="OS"
                    placeholder="OS (opcional)"
                    value={checkout.os}
                    onChange={(e) => setCheckout((p) => ({ ...p, os: e.target.value }))}
                    className={input}
                  />
                  <input
                    aria-label="Devolução prevista"
                    type="date"
                    min={hojeISO()}
                    value={checkout.due}
                    onChange={(e) => setCheckout((p) => ({ ...p, due: e.target.value }))}
                    className={input}
                  />
                </div>
                <button
                  onClick={doCheckout}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Confirmar Retirada
                </button>
              </div>
            )}

            {sel.status === 'CHECKED_OUT' && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Devolução</p>
                <div className="flex gap-2">
                  {['OK', 'Danificada', 'Incompleta'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setRetCond(c)}
                      aria-pressed={retCond === c}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border ${retCond === c ? (c === 'OK' ? 'bg-green-700 text-white border-green-700' : 'bg-orange-600 text-white border-orange-600') : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {c === 'OK' ? 'Em ordem' : c}
                    </button>
                  ))}
                </div>
                {retCond !== 'OK' && (
                  <p className="text-xs text-orange-700">A ferramenta vai direto para Manutenção.</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={doReturn}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Confirmar Devolução
                  </button>
                  <button
                    onClick={() =>
                      move(
                        'LOST',
                        {
                          status: 'LOST',
                          note: `Extraviada com ${sel.holder}`,
                        },
                        'Extravio',
                      )
                    }
                    className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                  >
                    Marcar extravio
                  </button>
                </div>
              </div>
            )}

            {sel.status === 'AVAILABLE' && (
              <button
                onClick={() => move('MAINT', { status: 'MAINTENANCE' }, 'Enviada p/ manutenção')}
                className="text-sm text-yellow-700 hover:underline"
              >
                Enviar para manutenção
              </button>
            )}
            {(sel.status === 'MAINTENANCE' || sel.status === 'LOST') && (
              <button
                onClick={() =>
                  move(
                    'BACK',
                    { status: 'AVAILABLE', note: null, holder: null },
                    sel.status === 'LOST' ? 'Encontrada' : 'Reparada',
                  )
                }
                className="w-full py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800"
              >
                {sel.status === 'LOST' ? 'Foi encontrada — voltar ao estoque' : 'Voltou da manutenção — disponível'}
              </button>
            )}

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Histórico</p>
              {!(sel.hist || []).length ? (
                <p className="text-xs text-gray-500">Nenhuma movimentação registrada.</p>
              ) : (
                <table className="w-full text-xs" aria-label="Histórico da ferramenta">
                  <tbody className="divide-y divide-gray-100">
                    {sel.hist.map((m, i) => (
                      <tr key={i}>
                        <td className="py-2 text-gray-600 whitespace-nowrap">{fmtDate(m.date)}</td>
                        <td className="py-2 font-medium text-gray-800">{MOVE[m.type]}</td>
                        <td className="py-2 text-gray-600">{m.who}</td>
                        <td className="py-2 text-gray-500">{m.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={newModal} onClose={() => setNewModal(false)} title="Nova Ferramenta" size="md">
        <div className="space-y-4">
          {[
            { l: 'Código / Patrimônio *', k: 'code', ph: 'FER-009' },
            { l: 'Nome *', k: 'name', ph: 'Ex: Máquina de Fusão' },
            { l: 'Nº de série', k: 'serial', ph: 'Ex: FJ41S-12345' },
          ].map((f) => (
            <div key={f.k}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.l}</label>
              <input
                aria-label={f.l}
                value={form[f.k]}
                onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))}
                placeholder={f.ph}
                className={input}
              />
            </div>
          ))}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caixa</label>
              <select
                aria-label="Caixa"
                value={form.box}
                onChange={(e) => setForm((p) => ({ ...p, box: e.target.value }))}
                className={input}
              >
                <option value="">Sem caixa</option>
                {boxes.map((b) => (
                  <option key={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <input
                aria-label="Valor"
                type="number"
                min="0"
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                placeholder="0,00"
                className={input}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calibração</label>
              <input
                aria-label="Próxima calibração"
                type="date"
                value={form.calib}
                onChange={(e) => setForm((p) => ({ ...p, calib: e.target.value }))}
                className={input}
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
              Cadastrar
            </button>
          </div>
        </div>
      </Modal>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export { ToolsTab, TOOLS_SEED, STATUS };
