import { fmt, fmtDate } from '../../../utils/format.js';

const StatementTab = ({
  bankAccounts,
  expenseCats,
  ignoreStmt,
  importAllStmt,
  importStmtLine,
  incomeCats,
  loadStmtFile,
  setStmtBankAccountId,
  setStmtCats,
  setStmtDragging,
  setStmtFileName,
  setStmtLines,
  setStmtResults,
  stmtBankAccountId,
  stmtCats,
  stmtDragging,
  stmtFileName,
  stmtLines,
  stmtProgresso,
  stmtResults,
}) =>
  (() => {
    const done = stmtLines.filter((l) => stmtResults[l.id]?.action === 'imported').length;
    const ignored = stmtLines.filter((l) => stmtResults[l.id]?.action === 'ignore').length;
    const pending = stmtLines.filter((l) => !stmtResults[l.id]?.action).length;
    const totalC = stmtLines.filter((l) => l.type === 'CREDIT').reduce((s, l) => s + l.amount, 0);
    const totalD = stmtLines.filter((l) => l.type === 'DEBIT').reduce((s, l) => s + l.amount, 0);
    const pct = stmtLines.length ? Math.round((done / stmtLines.length) * 100) : 0;
    if (stmtLines.length === 0)
      return (
        <div
          className="flex flex-col items-center justify-center gap-6 py-16"
          onDragOver={(e) => {
            e.preventDefault();
            setStmtDragging(true);
          }}
          onDragLeave={() => setStmtDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setStmtDragging(false);
            loadStmtFile(e.dataTransfer.files[0]);
          }}
        >
          <div
            className={`w-full max-w-lg rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center gap-4 py-14 px-8 ${stmtDragging ? 'border-teal-400 bg-teal-50' : 'border-gray-300 bg-white'}`}
          >
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-3xl">⇅</div>
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-base">Arraste o extrato aqui</p>
              <p className="text-sm text-gray-400 mt-1">Cada linha vira um lançamento — você só categoriza</p>
            </div>
            <label className="cursor-pointer bg-teal-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-teal-700 transition-colors">
              Selecionar arquivo
              <input
                type="file"
                className="hidden"
                accept=".csv,.ofx,.txt,.ret"
                onChange={(e) => loadStmtFile(e.target.files[0])}
              />
            </label>
            <p className="text-xs text-gray-400 text-center">
              Formatos suportados: <strong>OFX</strong> (Bradesco, Itaú, Santander, BB) e <strong>CSV</strong> separado
              por ; , ou tab
            </p>
          </div>
        </div>
      );
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-semibold text-gray-800">{stmtFileName}</p>
            <p className="text-xs text-gray-400">
              {stmtLines.length} linhas · {done} importadas · {pending} pendentes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={stmtBankAccountId}
              onChange={(e) => setStmtBankAccountId(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Conta bancária deste extrato...</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || b.bank_name || b.bank} — {b.account_number || b.account || ''}
                </option>
              ))}
            </select>
            <button
              onClick={importAllStmt}
              disabled={!!stmtProgresso}
              className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 disabled:opacity-60 disabled:cursor-wait"
            >
              {stmtProgresso
                ? `Importando ${stmtProgresso.feito} de ${stmtProgresso.total}...`
                : 'Importar todas com categoria'}
            </button>
            <button
              onClick={() => {
                setStmtLines([]);
                setStmtResults({});
                setStmtCats({});
                setStmtFileName('');
                setStmtBankAccountId('');
              }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50"
            >
              Novo arquivo
            </button>
          </div>
        </div>

        {/* KPI bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { l: 'Entradas', v: fmt(totalC), c: 'text-green-600', bg: 'bg-green-50' },
            { l: 'Saídas', v: fmt(totalD), c: 'text-red-600', bg: 'bg-red-50' },
            { l: 'Importados', v: done, c: 'text-teal-600', bg: 'bg-teal-50' },
            { l: 'Pendentes', v: pending, c: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((k) => (
            <div key={k.l} className={`${k.bg} rounded-xl p-3`}>
              <p className="text-xs text-gray-500">{k.l}</p>
              <p className={`text-lg font-bold ${k.c}`}>{k.v}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${stmtProgresso ? 'bg-teal-400 animate-pulse' : 'bg-teal-500'}`}
            style={{ width: `${stmtProgresso ? Math.round((stmtProgresso.feito / stmtProgresso.total) * 100) : pct}%` }}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-24">Data</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Descrição</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 w-28">Valor</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-52">Categoria</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 w-32">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stmtLines.map((line) => {
                const res = stmtResults[line.id] || {};
                const isCredit = line.type === 'CREDIT';
                const cats = isCredit ? incomeCats : expenseCats;
                const catSel = stmtCats[line.id] || '';
                if (res.action === 'imported')
                  return (
                    <tr key={line.id} className="bg-green-50">
                      <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{fmtDate(line.date)}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 truncate max-w-xs">{line.description}</td>
                      <td
                        className={`px-3 py-2.5 text-right text-xs font-semibold whitespace-nowrap ${isCredit ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {isCredit ? '+' : '−'}
                        {fmt(line.amount)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-400">
                        {cats.find((c) => c.id === catSel)?.name || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs text-green-600 font-medium">✓ Importado</td>
                    </tr>
                  );
                if (res.action === 'ignore')
                  return (
                    <tr key={line.id} className="opacity-40 bg-gray-50">
                      <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{fmtDate(line.date)}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 truncate max-w-xs">{line.description}</td>
                      <td
                        className={`px-3 py-2.5 text-right text-xs whitespace-nowrap ${isCredit ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {isCredit ? '+' : '−'}
                        {fmt(line.amount)}
                      </td>
                      <td colSpan={2} className="px-3 py-2.5 text-center text-xs text-gray-400">
                        Ignorado
                        <button
                          onClick={() => setStmtResults((p) => ({ ...p, [line.id]: {} }))}
                          className="ml-2 text-blue-400 hover:text-blue-600"
                        >
                          desfazer
                        </button>
                      </td>
                    </tr>
                  );
                return (
                  <tr key={line.id} className={res.action === 'erro' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(line.date)}</td>
                    <td className="px-3 py-2.5">
                      <p className="text-xs text-gray-800 font-medium truncate max-w-xs">{line.description}</p>
                      {res.action === 'erro' && <p className="text-xs text-red-600 mt-0.5">falhou: {res.msg}</p>}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-semibold text-sm whitespace-nowrap ${isCredit ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {isCredit ? '+' : '−'}
                      {fmt(line.amount)}
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={catSel}
                        onChange={(e) => setStmtCats((p) => ({ ...p, [line.id]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        <option value="">Selecionar...</option>
                        {cats.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => importStmtLine(line)}
                          disabled={!catSel}
                          className="px-2.5 py-1 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Importar
                        </button>
                        <button
                          onClick={() => ignoreStmt(line.id)}
                          className="px-2 py-1 border border-gray-200 text-gray-400 text-xs rounded-lg hover:bg-gray-50"
                        >
                          —
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  })();

export { StatementTab };
