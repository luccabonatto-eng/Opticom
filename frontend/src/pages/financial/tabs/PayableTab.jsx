import { Icon } from '../../../components/Icon.jsx';
import { fmt } from '../../../utils/format.js';
import { soma, txAberto, txPago } from '../calculations.js';

const PayableTab = ({
  DateFilter,
  TxTable,
  abrirBaixaLote,
  bulkDeleteTx,
  catP,
  custP,
  customers,
  dateFromP,
  dateToP,
  expenseCats,
  payable,
  qP,
  selP,
  setCatP,
  setCustP,
  setDateFromP,
  setDateToP,
  setEditTxId,
  setImportModal,
  setNewTx,
  setNewTxModal,
  setQP,
  setSelP,
  setStatusP,
  settle,
  statusP,
  txVencido,
}) =>
  (() => {
    const pTot = soma(payable, (t) => t.amount); // previsto
    const pPaid = soma(payable, txPago); // efetivo
    const pPend = soma(
      payable.filter((t) => !txVencido(t)),
      txAberto,
    );
    const pOver = soma(payable.filter(txVencido), txAberto);
    const hasFilter = dateFromP || dateToP || statusP !== 'all' || catP !== 'all' || custP !== 'all' || qP;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div
            className={`border rounded-xl p-4 ${hasFilter ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-100'}`}
          >
            <p
              className={`text-xs font-medium uppercase tracking-wide ${hasFilter ? 'text-blue-600' : 'text-red-600'}`}
            >
              {hasFilter ? 'Total Filtrado' : 'Total Despesas'}
            </p>
            <p className={`text-2xl font-bold mt-1 ${hasFilter ? 'text-blue-700' : 'text-red-700'}`}>{fmt(pTot)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{payable.length} lançamento(s)</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Pago</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{fmt(pPaid)}</p>
            <p className="text-xs text-gray-400 mt-0.5">de {fmt(pTot)} previsto</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Pendentes</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{fmt(pPend)}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Vencidos</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">{fmt(pOver)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={qP}
            onChange={(e) => setQP(e.target.value)}
            placeholder="Buscar pela descrição..."
            aria-label="Buscar pela descrição..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusP}
            onChange={(e) => setStatusP(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="all">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="PARTIAL">Parcial</option>
            <option value="PAID">Pago</option>
            <option value="OVERDUE">Vencido</option>
          </select>
          <select
            value={catP}
            onChange={(e) => setCatP(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="all">Todas as categorias</option>
            {expenseCats.map((c) => (
              <option key={c.id || c} value={c.name || c}>
                {c.name || c}
              </option>
            ))}
          </select>
          <select
            value={custP}
            onChange={(e) => setCustP(e.target.value)}
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
          <DateFilter monthNavigation settledLabel="Contas pagas" settledOnly={statusP === 'PAID'} onSettledChange={(checked) => setStatusP(checked ? 'PAID' : 'all')} from={dateFromP} setFrom={setDateFromP} to={dateToP} setTo={setDateToP} />
          {hasFilter && (
            <button
              onClick={() => {
                setDateFromP('');
                setDateToP('');
                setStatusP('all');
                setCatP('all');
                setCustP('all');
                setQP('');
              }}
              className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 border border-gray-200 rounded-lg"
            >
              Limpar filtros
            </button>
          )}
          <button
            onClick={() => setImportModal('EXPENSE')}
            className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            ↑ Importar planilha
          </button>
          <button
            onClick={() => {
              setEditTxId(null);
              setNewTx({
                type: 'EXPENSE',
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
            className="ml-auto flex items-center gap-1.5 bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <Icon name="plus" className="w-4 h-4" /> Nova Despesa
          </button>
        </div>
        {selP.size > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
            <span className="text-sm font-medium text-blue-700">{selP.size} selecionado(s)</span>
            <button
              onClick={() => abrirBaixaLote([...selP], setSelP)}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700"
            >
              ✓ Dar baixa
            </button>
            <button
              onClick={() => bulkDeleteTx([...selP], setSelP)}
              className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-700"
            >
              🗑 Excluir selecionados
            </button>
            <button onClick={() => setSelP(new Set())} className="text-xs text-blue-600 hover:underline ml-auto">
              Limpar seleção
            </button>
          </div>
        )}
        <TxTable
          tableId="payable"
          txList={payable}
          btnLabel="Pagar"
          baixaLabel="Pago"
          onSettle={settle}
          selected={selP}
          onToggle={(id) =>
            setSelP((prev) => {
              const n = new Set(prev);
              n.has(id) ? n.delete(id) : n.add(id);
              return n;
            })
          }
          onToggleAll={(ids, checked) =>
            setSelP((prev) => {
              const n = new Set(prev);
              ids.forEach((id) => (checked ? n.add(id) : n.delete(id)));
              return n;
            })
          }
        />
      </div>
    );
  })();

export { PayableTab };
