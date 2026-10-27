import { Modal } from '../../../components/Modal.jsx';
import { addMeses, hojeISO } from '../../../utils/dates.js';
import { fmt, fmtDate } from '../../../utils/format.js';

const TransactionModal = ({
  addTx,
  bankAccounts,
  customers,
  editTxId,
  expenseCats,
  incomeCats,
  newTx,
  newTxModal,
  payMethods,
  setEditTxId,
  setNewTx,
  setNewTxModal,
}) => (
  <Modal
    open={newTxModal}
    onClose={() => {
      setNewTxModal(false);
      setEditTxId(null);
    }}
    title={editTxId ? 'Editar Lançamento' : newTx.type === 'INCOME' ? 'Novo Recebimento' : 'Nova Despesa'}
    size="md"
  >
    <div className="space-y-4">
      <div className="flex gap-2">
        {[
          ['INCOME', '↑ Recebimento'],
          ['EXPENSE', '↓ Despesa'],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setNewTx((p) => ({ ...p, type: v, category_id: '' }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${newTx.type === v ? (v === 'INCOME' ? 'bg-green-600 text-white border-green-600' : 'bg-red-600 text-white border-red-600') : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {l}
          </button>
        ))}
      </div>
      {editTxId && (
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          O status vem da baixa: use <strong>{newTx.type === 'INCOME' ? 'Baixar' : 'Pagar'}</strong> na lista para
          registrar o valor recebido ou pago, e <strong>↺</strong> para estornar.
        </p>
      )}
      {[
        { label: 'Descrição *', key: 'description', type: 'text', placeholder: 'Ex: Fatura Hospital Regional' },
        { label: 'Valor (R$) *', key: 'amount', type: 'number', placeholder: '0,00' },
        { label: 'Vencimento *', key: 'due_date', type: 'date', placeholder: '' },
      ].map((f) => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
          <input
            type={f.type}
            value={newTx[f.key]}
            onChange={(e) => setNewTx((p) => ({ ...p, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
        <select
          value={newTx.category_id}
          onChange={(e) => setNewTx((p) => ({ ...p, category_id: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sem categoria</option>
          {(newTx.type === 'INCOME' ? incomeCats : expenseCats).map((c) => (
            <option key={c.id || c} value={c.id || c}>
              {c.name || c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
        <select
          value={newTx.customer_id}
          onChange={(e) => setNewTx((p) => ({ ...p, customer_id: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sem cliente vinculado</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          Vincule a um cliente para acompanhar quanto está sendo gasto para atendê-lo.
        </p>
      </div>
      {newTx.type === 'INCOME' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nº da Nota Fiscal</label>
          <input
            type="text"
            value={newTx.invoice_number}
            onChange={(e) => setNewTx((p) => ({ ...p, invoice_number: e.target.value }))}
            placeholder="Ex: 12345"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conta Bancária</label>
          <select
            value={newTx.bank_account_id}
            onChange={(e) => setNewTx((p) => ({ ...p, bank_account_id: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecionar...</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name || b.bank_name || b.bank} — {b.account_number || b.account || ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
          <select
            value={newTx.payment_method_id}
            onChange={(e) => setNewTx((p) => ({ ...p, payment_method_id: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecionar...</option>
            {payMethods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {!editTxId && (
        <div className="border-t border-gray-100 pt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repetir mensalmente</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="60"
                value={newTx.repetir}
                onChange={(e) => setNewTx((p) => ({ ...p, repetir: e.target.value }))}
                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">vez(es)</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {(parseInt(newTx.repetir) || 1) > 1
                ? `Cria ${parseInt(newTx.repetir)} lançamentos de ${newTx.amount ? fmt(Math.round(parseFloat(newTx.amount) * 100)) : 'R$ —'}, um por mês${newTx.due_date ? `, de ${fmtDate(newTx.due_date)} a ${fmtDate(addMeses(newTx.due_date, parseInt(newTx.repetir) - 1))}` : ''}. O valor é o de cada parcela.`
                : 'Para aluguel, folha, seguro ou conta parcelada — o valor acima é o de cada parcela.'}
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newTx.jaPago}
              className="w-4 h-4 accent-blue-600"
              onChange={(e) =>
                setNewTx((p) => ({
                  ...p,
                  jaPago: e.target.checked,
                  paid_date: e.target.checked ? p.paid_date || p.due_date || hojeISO() : '',
                }))
              }
            />
            <span className="text-sm text-gray-700">Já foi {newTx.type === 'INCOME' ? 'recebido' : 'pago'}</span>
          </label>
          {newTx.jaPago && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data do {newTx.type === 'INCOME' ? 'recebimento' : 'pagamento'} *
              </label>
              <input
                type="date"
                value={newTx.paid_date}
                onChange={(e) => setNewTx((p) => ({ ...p, paid_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Entra já quitado, pelo valor cheio. Para valor parcial, lance pendente e use a baixa.
              </p>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => {
            setNewTxModal(false);
            setEditTxId(null);
          }}
          className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={addTx}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {editTxId ? 'Salvar Alterações' : 'Salvar Lançamento'}
        </button>
      </div>
    </div>
  </Modal>
);

export { TransactionModal };
