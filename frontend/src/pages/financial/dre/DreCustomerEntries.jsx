import { useState } from 'react';
import { Badge } from '../../../components/Badge.jsx';
import { fmt, fmtDate } from '../../../utils/format.js';
import { porVencimento, txDue } from '../calculations.js';

export function DreCustomerEntries({ customers, scopeLabel, txCatName }) {
  const [customerId, setCustomerId] = useState('');
  const customer = customers.find(c => String(c.id) === customerId);

  return (
    <details className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      <summary className="cursor-pointer text-sm font-semibold text-gray-800">Ver lançamentos de um cliente</summary>
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <label className="text-sm font-semibold text-gray-800 space-y-1">
          <select aria-label="Cliente para consultar lançamentos" value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            className="block w-full sm:w-80 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm">
            <option value="">Selecione um cliente</option>
            {[...customers].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        </label>
        <p className="text-xs text-gray-500">{scopeLabel} · Valores conforme a base selecionada no DRE</p>
      </div>
      {!customer ? <p className="text-sm text-gray-500">Selecione um cliente para consultar suas receitas e contas a pagar.</p> : (
        <>
          <h3 className="font-bold text-purple-900">{customer.name}</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[['INCOME', 'Receitas'], ['EXPENSE', 'Contas a pagar']].map(([type, title]) => {
              const entries = customer.transactions.filter(tx => tx.type === type).sort(porVencimento);
              return (
                <div key={type} className="min-w-0 border border-gray-200 rounded-lg p-3 space-y-3">
                  <div className="flex flex-wrap justify-between gap-2 text-sm font-bold">
                    <h4>{title} ({entries.length})</h4>
                    <span className={type === 'INCOME' ? 'text-emerald-700' : 'text-red-600'}>
                      {fmt(entries.reduce((sum, tx) => sum + (tx.amount || 0), 0))}
                    </span>
                  </div>
                  {entries.length === 0 ? <p className="text-xs text-gray-500 py-3">Nenhum lançamento neste período.</p> : (
                    <div className="overflow-auto max-h-80">
                      <table className="w-full text-xs">
                        <thead className="text-gray-500 border-b border-gray-200">
                          <tr><th className="text-left p-2">Vencimento</th><th className="text-left p-2">Descrição / Categoria</th><th className="text-center p-2">Status</th><th className="text-right p-2">Valor</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {entries.map(tx => (
                            <tr key={tx.id}>
                              <td className="p-2 whitespace-nowrap">{fmtDate(txDue(tx))}</td>
                              <td className="p-2"><p className="font-medium text-gray-800">{tx.description || tx.desc || 'Sem descrição'}</p><p className="text-gray-500">{txCatName(tx)}</p></td>
                              <td className="p-2 text-center"><Badge status={tx.status} /></td>
                              <td className="p-2 text-right whitespace-nowrap font-semibold">{fmt(tx.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </details>
  );
}
