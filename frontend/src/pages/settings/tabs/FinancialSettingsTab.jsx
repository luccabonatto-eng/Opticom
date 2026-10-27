import { CLASSES_DESPESA, CLASSES_RECEITA } from '../../../config/financial.js';
import { api } from '../../../api/client.js';
import { fmt } from '../../../utils/format.js';

const FinancialSettingsTab = ({
  bankAccounts,
  expenseCats,
  incomeCats,
  newBank,
  newCat,
  newCatClass,
  newCatClassIn,
  newCatType,
  newPay,
  payMethods,
  setBankAccounts,
  setExpenseCats,
  setIncomeCats,
  setNewBank,
  setNewCat,
  setNewCatClass,
  setNewCatClassIn,
  setNewCatType,
  setNewPay,
  setPayMethods,
  setToast,
}) =>
  (() => {
    const activeBanks = bankAccounts.filter((b) => b.active);
    const activePayTotal = payMethods.filter((p) => p.active).length;
    return (
      <div className="space-y-4">
        {/* Categorias */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Categorias de Lançamentos</h3>
          <div className="grid grid-cols-2 gap-6">
            {/* Receita */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Categorias de Receita</p>
              </div>
              <div className="space-y-1 mb-3">
                {incomeCats.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-green-800 flex-1 truncate">{c.name}</span>
                    <select
                      value={c.accounting_class || 'OUTRAS_RECEITAS'}
                      onChange={async (e) => {
                        const cls = e.target.value;
                        const r = await api.updateCategory('income', c.id, { accounting_class: cls });
                        if (r.success)
                          setIncomeCats((p) => p.map((x) => (x.id === c.id ? { ...x, accounting_class: cls } : x)));
                        else setToast(r.error || 'Erro ao mudar a classe');
                      }}
                      title="Onde esta categoria entra no DRE e no fluxo de caixa"
                      className="text-xs bg-white border border-green-200 rounded px-1.5 py-0.5 text-green-700 max-w-[190px]"
                    >
                      {CLASSES_RECEITA.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={async () => {
                        const r = await api.deleteCategory('income', c.id);
                        if (r.success) setIncomeCats((p) => p.filter((x) => x.id !== c.id));
                        else setToast(r.error || 'Erro ao remover categoria');
                      }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <input
                  value={newCatType === 'income' ? newCat : ''}
                  onChange={(e) => {
                    setNewCat(e.target.value);
                    setNewCatType('income');
                  }}
                  placeholder="Nova categoria..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-2">
                  <select
                    value={newCatClassIn}
                    onChange={(e) => setNewCatClassIn(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {CLASSES_RECEITA.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      if (!newCat.trim() || newCatType !== 'income') return;
                      const r = await api.createCategory('income', {
                        name: newCat.trim(),
                        accounting_class: newCatClassIn,
                      });
                      if (r.success) {
                        setIncomeCats((p) => [...p, r.data?.data || r.data]);
                        setNewCat('');
                      } else setToast(r.error || 'Erro ao criar categoria');
                    }}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 whitespace-nowrap"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
            {/* Despesa */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Categorias de Despesa</p>
              </div>
              <div className="space-y-1 mb-3">
                {expenseCats.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-red-800 flex-1 truncate">{c.name}</span>
                    <select
                      value={c.accounting_class || 'OUTRAS_DESPESAS'}
                      onChange={async (e) => {
                        const cls = e.target.value;
                        const r = await api.updateCategory('expense', c.id, { accounting_class: cls });
                        if (r.success)
                          setExpenseCats((p) => p.map((x) => (x.id === c.id ? { ...x, accounting_class: cls } : x)));
                        else setToast(r.error || 'Erro ao mudar a classe');
                      }}
                      title="Onde esta categoria entra no DRE e no fluxo de caixa"
                      className="text-xs bg-white border border-red-200 rounded px-1.5 py-0.5 text-red-700 max-w-[190px]"
                    >
                      {CLASSES_DESPESA.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={async () => {
                        const r = await api.deleteCategory('expense', c.id);
                        if (r.success) setExpenseCats((p) => p.filter((x) => x.id !== c.id));
                        else setToast(r.error || 'Erro ao remover categoria');
                      }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <input
                  value={newCatType === 'expense' ? newCat : ''}
                  onChange={(e) => {
                    setNewCat(e.target.value);
                    setNewCatType('expense');
                  }}
                  placeholder="Nova categoria..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="flex gap-2">
                  <select
                    value={newCatClass}
                    onChange={(e) => setNewCatClass(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {CLASSES_DESPESA.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      if (!newCat.trim() || newCatType !== 'expense') return;
                      const r = await api.createCategory('expense', {
                        name: newCat.trim(),
                        accounting_class: newCatClass,
                      });
                      if (r.success) {
                        setExpenseCats((p) => [...p, r.data?.data || r.data]);
                        setNewCat('');
                      } else setToast(r.error || 'Erro ao criar categoria');
                    }}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 whitespace-nowrap"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contas Bancárias */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Contas Bancárias</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {activeBanks.length} conta(s) ativa(s) · Saldo total:{' '}
                {fmt(activeBanks.reduce((s, b) => s + b.balance, 0))}
              </p>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            {bankAccounts.map((b) => (
              <div
                key={b.id}
                className={`flex items-center gap-4 p-3 rounded-xl border ${b.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                  {(b.bank || b.name || '?')[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{b.bank || b.name}</p>
                  <p className="text-xs text-gray-400">
                    Ag. {b.agency} · CC {b.account} · {b.type}
                  </p>
                </div>
                <p className="text-sm font-semibold text-green-700">{fmt(b.balance)}</p>
                <button
                  onClick={() =>
                    setBankAccounts((p) => p.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)))
                  }
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${b.active ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'}`}
                >
                  {b.active ? 'Ativa' : 'Inativa'}
                </button>
                <button
                  onClick={async () => {
                    const r = await api.deleteBankAccount(b.id);
                    if (r.success) setBankAccounts((p) => p.filter((x) => x.id !== b.id));
                    else setToast(r.error || 'Erro ao remover conta');
                  }}
                  className="text-xs text-gray-300 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">Adicionar Conta</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Banco *', key: 'bank', placeholder: 'Ex: Santander' },
                { label: 'Agência', key: 'agency', placeholder: '0000-0' },
                { label: 'Conta *', key: 'account', placeholder: '00000-0' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  <input
                    value={newBank[f.key]}
                    onChange={(e) => setNewBank((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                <select
                  value={newBank.type}
                  onChange={(e) => setNewBank((p) => ({ ...p, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                >
                  {['Corrente', 'Poupança', 'Pagamento'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!newBank.bank.trim() || !newBank.account.trim()) return;
                const displayName = newBank.agency
                  ? `${newBank.bank} Ag.${newBank.agency} CC ${newBank.account}`
                  : `${newBank.bank} CC ${newBank.account}`;
                const r = await api.createBankAccount({
                  name: displayName,
                  bank_name: newBank.bank,
                  account_number: newBank.account,
                });
                if (r.success) {
                  setBankAccounts((p) => [
                    ...p,
                    {
                      ...r.data,
                      bank: r.data.bank_name || newBank.bank,
                      account: r.data.account_number || newBank.account,
                      agency: newBank.agency,
                      type: newBank.type,
                      balance: 0,
                      active: true,
                    },
                  ]);
                  setNewBank({ bank: '', agency: '', account: '', type: 'Corrente' });
                  setToast('Conta bancária adicionada!');
                } else {
                  setToast(r.error || 'Erro ao adicionar conta');
                }
              }}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Adicionar Conta
            </button>
          </div>
        </div>

        {/* Formas de Pagamento */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Formas de Pagamento</h3>
              <p className="text-xs text-gray-400 mt-0.5">{activePayTotal} forma(s) ativa(s)</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {payMethods.map((m) => (
              <div
                key={m.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${m.active ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
              >
                <span className={`text-sm font-medium ${m.active ? 'text-blue-800' : 'text-gray-400'}`}>{m.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setPayMethods((p) => p.map((x) => (x.id === m.id ? { ...x, active: !x.active } : x)))
                    }
                    className={`w-9 h-5 rounded-full transition-colors relative ${m.active ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${m.active ? 'left-4' : 'left-0.5'}`}
                    />
                  </button>
                  <button
                    onClick={async () => {
                      const r = await api.deletePaymentMethod(m.id);
                      if (r.success) setPayMethods((p) => p.filter((x) => x.id !== m.id));
                      else setToast(r.error || 'Erro ao remover método');
                    }}
                    className="text-xs text-gray-300 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-4 flex gap-2">
            <input
              value={newPay}
              onChange={(e) => setNewPay(e.target.value)}
              placeholder="Nova forma de pagamento..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={async () => {
                if (!newPay.trim()) return;
                const r = await api.createPaymentMethod({ name: newPay.trim() });
                if (r.success) {
                  setPayMethods((p) => [...p, { ...r.data, active: true }]);
                  setNewPay('');
                } else setToast(r.error || 'Erro ao criar método');
              }}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    );
  })();

export { FinancialSettingsTab };
