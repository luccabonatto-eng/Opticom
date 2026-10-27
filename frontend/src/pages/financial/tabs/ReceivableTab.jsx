import { Icon } from '../../../components/Icon.jsx';
import { fmt } from '../../../utils/format.js';
import { soma, txAberto, txPago } from '../calculations.js';

const ReceivableTab = ({
  DateFilter,
  TxTable,
  abrirBaixaLote,
  bulkDeleteTx,
  catR,
  custR,
  customers,
  dateFromR,
  dateToR,
  incomeCats,
  qR,
  receivable,
  selR,
  setCatR,
  setCustR,
  setDateFromR,
  setDateToR,
  setEditTxId,
  setImportModal,
  setNewTx,
  setNewTxModal,
  setQR,
  setSelR,
  setStatusR,
  settle,
  statusR,
  txVencido,
}) =>
  (() => {
    const rTot = soma(receivable, (t) => t.amount); // previsto
    const rReceived = soma(receivable, txPago); // efetivo
    const rPending = soma(
      receivable.filter((t) => !txVencido(t)),
      txAberto,
    );
    const rOverdue = soma(receivable.filter(txVencido), txAberto);
    const hasFilter = dateFromR || dateToR || statusR !== 'all' || catR !== 'all' || custR !== 'all' || qR;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div
            className={`border rounded-xl p-4 ${hasFilter ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-100'}`}
          >
            <p
              className={`text-xs font-medium uppercase tracking-wide ${hasFilter ? 'text-blue-600' : 'text-green-600'}`}
            >
              {hasFilter ? 'Total Filtrado' : 'Total Receitas'}
            </p>
            <p className={`text-2xl font-bold mt-1 ${hasFilter ? 'text-blue-700' : 'text-green-700'}`}>{fmt(rTot)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{receivable.length} lançamento(s)</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Recebido</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{fmt(rReceived)}</p>
            <p className="text-xs text-gray-400 mt-0.5">de {fmt(rTot)} previsto</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Pendentes</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{fmt(rPending)}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Vencidos</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{fmt(rOverdue)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={qR}
            onChange={(e) => setQR(e.target.value)}
            placeholder="Buscar pela descrição..."
            aria-label="Buscar pela descrição..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusR}
            onChange={(e) => setStatusR(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="all">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="PARTIAL">Parcial</option>
            <option value="RECEIVED">Recebido</option>
            <option value="OVERDUE">Vencido</option>
          </select>
          <select
            value={catR}
            onChange={(e) => setCatR(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="all">Todas as categorias</option>
            {incomeCats.map((c) => (
              <option key={c.id || c} value={c.name || c}>
                {c.name || c}
              </option>
            ))}
          </select>
          <select
            value={custR}
            onChange={(e) => setCustR(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none max-w-[180px] truncate"
          >
            <option value="all">Todos os clientes</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="__sem_cliente__">Sem cliente vinculado</option>
          </select>
          <DateFilter monthNavigation settledLabel="Contas recebidas" settledOnly={statusR === 'RECEIVED'} onSettledChange={(checked) => setStatusR(checked ? 'RECEIVED' : 'all')} from={dateFromR} setFrom={setDateFromR} to={dateToR} setTo={setDateToR} />
          {hasFilter && (
            <button
              onClick={() => {
                setDateFromR('');
                setDateToR('');
                setStatusR('all');
                setCatR('all');
                setCustR('all');
                setQR('');
              }}
              className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 border border-gray-200 rounded-lg"
            >
              Limpar filtros
            </button>
          )}
          <button
            onClick={() => setImportModal('INCOME')}
            className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            ↑ Importar planilha
          </button>
          <button
            onClick={() => {
              setEditTxId(null);
              setNewTx({
                type: 'INCOME',
                description: '',
                amount: '',
                due_date: '',
                status: 'PENDING',
                category_id: '',
                bank_account_id: '',
                payment_method_id: '',
                customer_id: '',
                invoice_number: '',
                repetir: 1,
                jaPago: false,
                paid_date: '',
              });
              setNewTxModal(true);
            }}
            className="ml-auto flex items-center gap-1.5 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Icon name="plus" className="w-4 h-4" /> Novo Recebimento
          </button>
        </div>
        {selR.size > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
            <span className="text-sm font-medium text-blue-700">{selR.size} selecionado(s)</span>
            <button
              onClick={() => abrirBaixaLote([...selR], setSelR)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700"
            >
              ✓ Dar baixa
            </button>
            <button
              onClick={() => bulkDeleteTx([...selR], setSelR)}
              className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-700"
            >
              🗑 Excluir selecionados
            </button>
            <button onClick={() => setSelR(new Set())} className="text-xs text-blue-600 hover:underline ml-auto">
              Limpar seleção
            </button>
          </div>
        )}
        <TxTable
          tableId="receivable"
          txList={receivable}
          btnLabel="Baixar"
          baixaLabel="Recebido"
          onSettle={settle}
          showNF
          selected={selR}
          onToggle={(id) =>
            setSelR((prev) => {
              const n = new Set(prev);
              n.has(id) ? n.delete(id) : n.add(id);
              return n;
            })
          }
          onToggleAll={(ids, checked) =>
            setSelR((prev) => {
              const n = new Set(prev);
              ids.forEach((id) => (checked ? n.add(id) : n.delete(id)));
              return n;
            })
          }
        />
      </div>
    );
  })();

export { ReceivableTab };
