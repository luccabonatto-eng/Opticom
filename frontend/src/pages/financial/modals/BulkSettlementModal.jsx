import { Modal } from '../../../components/Modal.jsx';
import { fmt } from '../../../utils/format.js';
import { soma, txAberto } from '../calculations.js';

const BulkSettlementModal = ({ bulkSettleModal, confirmBulkSettle, setBulkSettleModal }) => (
  <Modal open={!!bulkSettleModal} onClose={() => setBulkSettleModal(null)} title="Dar baixa nos selecionados" size="sm">
    {bulkSettleModal &&
      (() => {
        const { txs, data } = bulkSettleModal;
        const total = soma(txs, txAberto);
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Lançamentos</span>
                <span className="font-medium text-gray-700">{txs.length}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total em aberto</span>
                <span className="font-bold text-amber-700">{fmt(total)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Todos serão quitados pelo valor cheio. Para baixa parcial, use o botão da linha.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data do pagamento/recebimento</label>
              <input
                type="date"
                value={data || ''}
                autoFocus
                onChange={(e) => setBulkSettleModal((p) => ({ ...p, data: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setBulkSettleModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmBulkSettle}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Baixar {fmt(total)}
              </button>
            </div>
          </div>
        );
      })()}
  </Modal>
);

export { BulkSettlementModal };
