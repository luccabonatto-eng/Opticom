import { Modal } from '../../../components/Modal.jsx';
import { fmt } from '../../../utils/format.js';

const CardPaymentModal = ({ faturaModal, monthLabel, pagarFatura, setFaturaModal }) => (
  <Modal open={!!faturaModal} onClose={() => setFaturaModal(null)} title="Pagar Fatura do Cartão" size="sm">
    {faturaModal &&
      (() => {
        const { nome, mes, compras, aberto, valorFatura } = faturaModal;
        const valorCents = Math.round(parseFloat(String(valorFatura || '0').replace(',', '.')) * 100) || 0;
        const dif = valorCents - aberto;
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-gray-800">
                {nome} · {monthLabel(mes)}
              </p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{compras.length} compra(s) lançada(s)</span>
                <span className="font-bold text-gray-700">{fmt(aberto)}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor da fatura (R$)</label>
              <input
                type="number"
                step="0.01"
                autoFocus
                value={valorFatura}
                onChange={(e) => setFaturaModal((p) => ({ ...p, valorFatura: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
              <p className={`text-xs mt-1.5 ${dif === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                {dif === 0
                  ? '✓ Bate com o que foi lançado'
                  : `Divergência de ${fmt(Math.abs(dif))} — ${dif > 0 ? 'há compras não lançadas' : 'foi lançado a mais que a fatura'}`}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data do pagamento</label>
              <input
                type="date"
                value={faturaModal.vencimento}
                onChange={(e) => setFaturaModal((p) => ({ ...p, vencimento: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
            <p className="text-xs text-gray-400">
              Cria uma saída de caixa no valor da fatura e dá baixa nas compras. As despesas já estão no DRE desde a
              compra, então não serão contadas de novo.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setFaturaModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={pagarFatura}
                className="flex-1 py-2.5 bg-fuchsia-600 text-white rounded-lg text-sm font-medium hover:bg-fuchsia-700"
              >
                Confirmar pagamento
              </button>
            </div>
          </div>
        );
      })()}
  </Modal>
);

export { CardPaymentModal };
