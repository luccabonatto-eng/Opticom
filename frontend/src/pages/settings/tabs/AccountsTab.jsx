import { Badge } from '../../../components/Badge.jsx';
import { fmt, fmtDate } from '../../../utils/format.js';

const AccountsTab = ({
  addInvestment,
  bankAccounts,
  initBalEdit,
  investList,
  investLoading,
  newInvest,
  saveInitBal,
  savingBal,
  setInitBalEdit,
  setNewInvest,
}) => (
  <div className="space-y-4">
    {/* Saldo Inicial das Contas */}
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Saldo Inicial das Contas Bancárias</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          O saldo inicial é usado no DFC para calcular o Saldo Final Projetado de Caixa
        </p>
      </div>
      {bankAccounts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Nenhuma conta bancária cadastrada</p>
      ) : (
        <div className="space-y-3">
          {bankAccounts.map((b) => {
            const cur =
              initBalEdit[b.id] !== undefined
                ? initBalEdit[b.id]
                : ((b.initial_balance || 0) / 100).toFixed(2).replace('.', ',');
            return (
              <div key={b.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-200 bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                  {(b.bank_name || b.name || '?')[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.bank_name || '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">R$</span>
                  <input
                    value={cur}
                    onChange={(e) => setInitBalEdit((p) => ({ ...p, [b.id]: e.target.value }))}
                    className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                  />
                  <button
                    onClick={() => saveInitBal(b.id)}
                    disabled={savingBal[b.id]}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingBal[b.id] ? '...' : 'Salvar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* Investimentos */}
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Registrar Investimento</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Compra de equipamentos, veículos, infraestrutura — lançado como despesa de Investimento no DFC
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Descrição *</label>
          <input
            value={newInvest.description}
            onChange={(e) => setNewInvest((p) => ({ ...p, description: e.target.value }))}
            placeholder="Ex: Compra de veículo Fiorino 2024"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Valor (R$) *</label>
          <input
            value={newInvest.amount}
            onChange={(e) => setNewInvest((p) => ({ ...p, amount: e.target.value }))}
            placeholder="0,00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Data *</label>
          <input
            type="date"
            value={newInvest.due_date}
            onChange={(e) => setNewInvest((p) => ({ ...p, due_date: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Conta Bancária</label>
          <select
            value={newInvest.bank_account_id}
            onChange={(e) => setNewInvest((p) => ({ ...p, bank_account_id: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">Selecionar conta...</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={addInvestment}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        Registrar Investimento
      </button>

      {/* Lista de investimentos */}
      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico de Investimentos</p>
        {investLoading ? (
          <p className="text-sm text-gray-400 text-center py-4">Carregando...</p>
        ) : investList.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum investimento registrado</p>
        ) : (
          <div className="space-y-2">
            {investList.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.description}</p>
                  <p className="text-xs text-gray-400">{fmtDate(t.due_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-700">{fmt(t.amount)}</p>
                  <Badge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export { AccountsTab };
