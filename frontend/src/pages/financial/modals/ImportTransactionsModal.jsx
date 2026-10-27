import { Modal } from '../../../components/Modal.jsx';
import { fmt, fmtDate } from '../../../utils/format.js';

const ImportTransactionsModal = ({
  importDragging,
  importFileName,
  importModal,
  importTab,
  importText,
  lerPlanilha,
  loadImportFile,
  parseImport,
  setImportDragging,
  setImportFileName,
  setImportModal,
  setImportTab,
  setImportText,
}) => (
  <Modal
    open={!!importModal}
    onClose={() => {
      setImportModal(null);
      setImportText('');
      setImportFileName('');
    }}
    title={importModal === 'INCOME' ? 'Importar Recebimentos' : 'Importar Despesas'}
    size="md"
  >
    {(() => {
      const lidas = lerPlanilha(importText);
      const validas = lidas.filter((r) => r.amount > 0);
      const qtd = validas.length;
      const invalidas = lidas.length - qtd;
      const fechar = () => {
        setImportModal(null);
        setImportText('');
        setImportFileName('');
      };
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {[
              ['arquivo', '📎 Anexar arquivo'],
              ['colar', '📋 Colar texto'],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setImportTab(v)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${importTab === v ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            <p className="font-semibold mb-1">Colunas esperadas (CSV separado por ; ou tab):</p>
            <p className="font-mono">Descrição; Valor; Vencimento (AAAA-MM-DD); Categoria</p>
            <p className="mt-1 text-blue-500">Exemplo: Fatura Cliente X; 1.500,00; 2026-05-10; Receita de OS</p>
            <p className="mt-1 text-blue-400">Linha de cabeçalho é ignorada automaticamente.</p>
          </div>

          {importTab === 'arquivo' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setImportDragging(true);
              }}
              onDragLeave={() => setImportDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setImportDragging(false);
                loadImportFile(e.dataTransfer.files[0]);
              }}
              className={`rounded-xl border-2 border-dashed flex flex-col items-center gap-3 py-8 px-6 transition-colors ${importDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
            >
              <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-2xl">
                📄
              </div>
              {importFileName ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-800">{importFileName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {qtd} lançamento(s) detectado(s){invalidas > 0 ? ` · ${invalidas} sem valor válido` : ''}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Arraste o arquivo CSV aqui</p>
              )}
              <label className="cursor-pointer bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
                {importFileName ? 'Trocar arquivo' : 'Selecionar arquivo'}
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.txt,.tsv"
                  onChange={(e) => loadImportFile(e.target.files[0])}
                />
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cole os dados da planilha aqui:</label>
              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportFileName('');
                }}
                rows={8}
                placeholder={
                  'Fatura ABC; 2.500,00; 2026-05-15; Receita de Contratos\nFatura XYZ; 800,00; 2026-05-20; Receita de OS'
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                {qtd} lançamento(s) detectado(s){invalidas > 0 ? ` · ${invalidas} sem valor válido` : ''}
              </p>
            </div>
          )}

          {qtd > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <p className="bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 border-b border-gray-200">
                Prévia
              </p>
              <div className="divide-y divide-gray-100 max-h-36 overflow-y-auto">
                {validas.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs">
                    <span className="text-gray-700 truncate flex-1">{r.description}</span>
                    <span className="text-gray-400 whitespace-nowrap">{fmtDate(r.due_date)}</span>
                    <span className={`whitespace-nowrap ${r.tipo === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                      {r.tipo === 'INCOME' ? 'entrada' : r.tipo === 'EXPENSE' ? 'saída' : ''}
                    </span>
                    <span className="font-semibold whitespace-nowrap text-gray-800">{fmt(r.amount)}</span>
                  </div>
                ))}
                {qtd > 3 && <p className="px-3 py-1.5 text-xs text-gray-400">+ {qtd - 3} linha(s)</p>}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={fechar}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={parseImport}
              disabled={qtd === 0}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Importar {qtd} lançamento(s)
            </button>
          </div>
        </div>
      );
    })()}
  </Modal>
);

export { ImportTransactionsModal };
