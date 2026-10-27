import { Modal } from '../../../components/Modal.jsx';
import { fmt, fmtDate } from '../../../utils/format.js';
import { hojeISO } from '../../../utils/dates.js';
import { txAberto, txPago } from '../calculations.js';

const SettlementModal = ({ confirmSettle, setSettleModal, settleModal }) => (
  <Modal
    open={!!settleModal}
    onClose={() => setSettleModal(null)}
    title={settleModal?.tx?.type === 'INCOME' ? 'Registrar Recebimento' : 'Registrar Pagamento'}
    size="sm"
  >
    {settleModal &&
      (() => {
        const { tx, valor } = settleModal;
        const aberto = txAberto(tx);
        const valorCents = Math.round(parseFloat(String(valor || '0').replace(',', '.')) * 100) || 0;
        const restante = aberto - valorCents;
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-gray-800 truncate">{tx.description}</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Valor da conta</span>
                <span className="font-medium text-gray-700">{fmt(tx.amount)}</span>
              </div>
              {txPago(tx) > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Já {tx.type === 'INCOME' ? 'recebido' : 'pago'}</span>
                  <span className="font-medium text-green-700">{fmt(txPago(tx))}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>Em aberto</span>
                <span className="font-bold text-amber-700">{fmt(aberto)}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor a {tx.type === 'INCOME' ? 'receber' : 'pagar'} agora (R$)
              </label>
              <input
                type="number"
                step="0.01"
                autoFocus
                value={valor}
                onChange={(e) => setSettleModal((p) => ({ ...p, valor: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-between mt-1.5">
                <button
                  onClick={() => setSettleModal((p) => ({ ...p, valor: (aberto / 100).toFixed(2) }))}
                  className="text-xs text-blue-600 hover:underline"
                >
                  usar saldo total
                </button>
                <p
                  className={`text-xs ${restante > 0 ? 'text-amber-600' : restante < 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {restante > 0
                    ? `restam ${fmt(restante)} em aberto`
                    : restante < 0
                      ? 'valor acima do saldo'
                      : 'quita a conta'}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data do {tx.type === 'INCOME' ? 'recebimento' : 'pagamento'}
              </label>
              <input
                type="date"
                value={settleModal.data || ''}
                onChange={(e) => setSettleModal((p) => ({ ...p, data: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {settleModal.data && settleModal.data !== hojeISO() && (
                <p className="text-xs text-blue-600 mt-1">
                  Lançando com data retroativa ({fmtDate(settleModal.data)}).
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setSettleModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSettle}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        );
      })()}
  </Modal>
);

export { SettlementModal };
