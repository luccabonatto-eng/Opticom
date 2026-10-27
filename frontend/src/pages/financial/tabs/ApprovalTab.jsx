import { api } from '../../../api/client.js';
import { fmt, fmtDate } from '../../../utils/format.js';
import { txDue, txPago } from '../calculations.js';

const ApprovalTab = ({
  Promise,
  approvalQueue,
  approvalSel,
  bankAccounts,
  payMethods,
  setApprovalSel,
  setToast,
  setTx,
  transactions,
  txCatName,
  txVencido,
}) =>
  (() => {
    const queueExp = approvalQueue.filter((t) => t.type === 'EXPENSE');
    const queueInc = approvalQueue.filter((t) => t.type === 'INCOME');
    const selExp = queueExp.filter((t) => approvalSel.has(t.id)).reduce((s, t) => s + t.amount, 0);
    const selInc = queueInc.filter((t) => approvalSel.has(t.id)).reduce((s, t) => s + t.amount, 0);
    const saldoAtual = 12500000;
    const saldoPos = saldoAtual - selExp + selInc;
    const expPaid = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + txPago(t), 0);
    const totalExpBase = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const dreImpactPct = totalExpBase > 0 ? ((selExp / totalExpBase) * 100).toFixed(1) : '0.0';
    const cfTodayOuts = queueExp.reduce((s, t) => s + t.amount, 0);
    const cfTodayIns = queueInc.reduce((s, t) => s + t.amount, 0);
    const toggleSel = (id) =>
      setApprovalSel((prev) => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
      });
    const selAll = () => setApprovalSel(new Set(approvalQueue.map((t) => t.id)));
    const selNone = () => setApprovalSel(new Set());
    const approveSelected = async () => {
      if (approvalSel.size === 0) return;
      const ids = [...approvalSel];
      const today = new Date().toISOString().split('T')[0];
      // Aprovar em lote quita integralmente: o efetivo passa a ser o valor cheio
      const results = await Promise.all(
        ids.map((id) => {
          const t = transactions.find((x) => x.id === id);
          const newStatus = t?.type === 'INCOME' ? 'RECEIVED' : 'PAID';
          return api
            .updateTransaction(id, { status: newStatus, amount_paid: t?.amount || 0, paid_date: today })
            .then((r) => ({ id, ok: r.success }));
        }),
      );
      const okIds = new Set(results.filter((r) => r.ok).map((r) => r.id));
      setTx((prev) =>
        prev.map((t) =>
          okIds.has(t.id)
            ? { ...t, status: t.type === 'INCOME' ? 'RECEIVED' : 'PAID', amount_paid: t.amount || 0, paid_date: today }
            : t,
        ),
      );
      setApprovalSel(new Set());
      const failCount = ids.length - okIds.size;
      setToast(
        failCount === 0
          ? `${okIds.size} lançamento(s) aprovado(s) com sucesso!`
          : `${okIds.size} aprovado(s), ${failCount} falharam`,
      );
    };
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">Aprovações do Dia</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} ·{' '}
              {approvalQueue.length} lançamento(s) aguardando aprovação
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={selAll}
              className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
            >
              Selecionar tudo
            </button>
            {approvalSel.size > 0 && (
              <button
                onClick={selNone}
                className="text-xs text-gray-400 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Limpar
              </button>
            )}
            {approvalSel.size > 0 && (
              <button
                onClick={approveSelected}
                className="text-xs bg-violet-600 text-white px-4 py-1.5 rounded-lg hover:bg-violet-700 font-semibold"
              >
                ✓ Aprovar {approvalSel.size} selecionado(s) — {fmt(selExp + selInc)}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 items-start">
          {/* Lista de lançamentos — col 3/5 */}
          <div className="col-span-3 space-y-3">
            {/* Despesas */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-red-700">↓ Pagamentos a Aprovar</span>
                  <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                    {queueExp.length}
                  </span>
                </div>
                <span className="text-sm font-bold text-red-700">{fmt(cfTodayOuts)}</span>
              </div>
              {queueExp.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">Nenhum pagamento pendente para hoje</p>
              ) : (
                queueExp.map((t) => (
                  <label
                    key={t.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors ${approvalSel.has(t.id) ? 'bg-violet-50 border-violet-100' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={approvalSel.has(t.id)}
                      onChange={() => toggleSel(t.id)}
                      className="mt-0.5 w-4 h-4 shrink-0 accent-violet-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium truncate">{t.description || t.desc}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{txCatName(t)}</span>
                        {(bankAccounts.find((b) => b.id === t.bank_account_id)?.name || t.account) && (
                          <span className="text-xs text-gray-400">
                            · {bankAccounts.find((b) => b.id === t.bank_account_id)?.name || t.account}
                          </span>
                        )}
                        {(payMethods.find((m) => m.id === t.payment_method_id)?.name || t.payMethod) && (
                          <span className="text-xs text-gray-400">
                            · {payMethods.find((m) => m.id === t.payment_method_id)?.name || t.payMethod}
                          </span>
                        )}
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded ${txVencido(t) ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
                        >
                          {txVencido(t) ? 'Vencido' : 'Pendente'}
                        </span>
                        <span className="text-xs text-gray-400">venc. {fmtDate(txDue(t))}</span>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold shrink-0 ${approvalSel.has(t.id) ? 'text-violet-700' : 'text-red-600'}`}
                    >
                      {fmt(t.amount)}
                    </span>
                  </label>
                ))
              )}
            </div>
            {/* Recebimentos */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-green-700">↑ Recebimentos a Confirmar</span>
                  <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                    {queueInc.length}
                  </span>
                </div>
                <span className="text-sm font-bold text-green-700">{fmt(cfTodayIns)}</span>
              </div>
              {queueInc.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">Nenhum recebimento pendente para hoje</p>
              ) : (
                queueInc.map((t) => (
                  <label
                    key={t.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors ${approvalSel.has(t.id) ? 'bg-violet-50 border-violet-100' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={approvalSel.has(t.id)}
                      onChange={() => toggleSel(t.id)}
                      className="mt-0.5 w-4 h-4 shrink-0 accent-violet-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium truncate">{t.description || t.desc}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{txCatName(t)}</span>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          Pendente
                        </span>
                        <span className="text-xs text-gray-400">venc. {fmtDate(txDue(t))}</span>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold shrink-0 ${approvalSel.has(t.id) ? 'text-violet-700' : 'text-green-600'}`}
                    >
                      {fmt(t.amount)}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Painel de simulação — col 2/5 */}
          <div className="col-span-2 space-y-3 sticky top-0">
            {/* Impacto no Caixa */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                Impacto no Caixa
                {approvalSel.size > 0 && (
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                    simulação ativa
                  </span>
                )}
              </h3>
              <div className="space-y-0">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">Saldo atual</span>
                  <span className="text-sm font-semibold text-gray-800">{fmt(saldoAtual)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">(+) Recebimentos confirmados</span>
                  <span className={`text-sm font-semibold ${selInc > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                    {selInc > 0 ? '+' + fmt(selInc) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">(−) Pagamentos aprovados</span>
                  <span className={`text-sm font-semibold ${selExp > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                    {selExp > 0 ? '−' + fmt(selExp) : '—'}
                  </span>
                </div>
                <div
                  className={`flex justify-between items-center py-2.5 mt-1 rounded-lg px-2 ${approvalSel.size > 0 ? 'bg-violet-50' : 'bg-gray-50'}`}
                >
                  <span className="text-xs font-bold text-gray-700">Saldo pós-aprovação</span>
                  <span
                    className={`text-base font-bold ${saldoPos > saldoAtual ? 'text-green-700' : saldoPos >= 10000000 ? 'text-blue-700' : 'text-red-700'}`}
                  >
                    {fmt(saldoPos)}
                  </span>
                </div>
                {approvalSel.size > 0 && (
                  <p
                    className={`text-xs text-center pt-2 font-medium ${saldoPos < saldoAtual ? 'text-red-500' : 'text-green-600'}`}
                  >
                    {saldoPos < saldoAtual
                      ? `▼ Redução de ${fmt(saldoAtual - saldoPos)} no caixa`
                      : `▲ Aumento de ${fmt(saldoPos - saldoAtual)} no caixa`}
                  </p>
                )}
              </div>
            </div>

            {/* Impacto no DRE */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Impacto no DRE</h3>
              {approvalSel.size === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Selecione lançamentos para simular</p>
              ) : (
                <div className="space-y-0 text-xs">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Despesas pagas (atual)</span>
                    <span className="font-medium text-gray-700">{fmt(expPaid)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">(+) Aprovações selecionadas</span>
                    <span className="font-semibold text-red-500">{selExp > 0 ? '+' + fmt(selExp) : '—'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b-2 border-violet-200">
                    <span className="font-semibold text-gray-700">Despesas pagas (simulado)</span>
                    <span className="font-bold text-red-700">{fmt(expPaid + selExp)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Impacto no resultado</span>
                    <span className={`font-semibold ${selExp > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {selExp > 0 ? '−' + fmt(selExp) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">% sobre total de despesas</span>
                    <span className="font-medium text-gray-600">{dreImpactPct}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Impacto no Fluxo de Caixa — hoje */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Fluxo de Caixa — Hoje (05/04)</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-1.5 text-left text-gray-400 font-medium"></th>
                    <th className="py-1.5 text-right text-gray-400 font-medium">Sem aprovação</th>
                    <th className="py-1.5 text-right text-violet-600 font-bold">Com aprovação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 text-gray-500">Entradas</td>
                    <td className="py-2 text-right text-green-600 font-medium">
                      {cfTodayIns > 0 ? fmt(cfTodayIns) : '—'}
                    </td>
                    <td className="py-2 text-right font-bold text-green-700">
                      {selInc > 0 ? fmt(selInc) : cfTodayIns > 0 ? fmt(cfTodayIns) : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-500">Saídas</td>
                    <td className="py-2 text-right text-red-500 font-medium">
                      {cfTodayOuts > 0 ? fmt(cfTodayOuts) : '—'}
                    </td>
                    <td className="py-2 text-right font-bold text-red-700">{selExp > 0 ? fmt(selExp) : '—'}</td>
                  </tr>
                  <tr className="border-t-2 border-gray-200">
                    <td className="py-2 font-semibold text-gray-700">Resultado do dia</td>
                    <td
                      className={`py-2 text-right font-semibold ${cfTodayIns - cfTodayOuts >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {fmt(cfTodayIns - cfTodayOuts)}
                    </td>
                    <td
                      className={`py-2 text-right font-bold ${selInc - selExp >= 0 ? 'text-green-700' : 'text-red-700'}`}
                    >
                      {fmt(selInc - selExp)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-semibold text-gray-700">Saldo final</td>
                    <td className="py-2 text-right font-semibold text-gray-600">
                      {fmt(saldoAtual + cfTodayIns - cfTodayOuts)}
                    </td>
                    <td
                      className={`py-2 text-right font-bold ${saldoPos >= saldoAtual ? 'text-green-700' : saldoPos >= 10000000 ? 'text-blue-700' : 'text-red-700'}`}
                    >
                      {fmt(saldoPos)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  })();

export { ApprovalTab };
