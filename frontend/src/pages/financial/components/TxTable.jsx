import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '../../../components/Badge.jsx';
import { fmt, fmtDate } from '../../../utils/format.js';

// Larguras padrão equilibradas
const ALL_COLUMNS = [
  { id: 'description', label: 'Descrição', defaultWidth: 210, minWidth: 120 },
  { id: 'category', label: 'Categoria', defaultWidth: 125, minWidth: 80 },
  { id: 'customer', label: 'Cliente', defaultWidth: 135, minWidth: 80 },
  { id: 'invoice', label: 'NF', defaultWidth: 70, minWidth: 50, onlyIf: (props) => props.showNF },
  { id: 'bank', label: 'Banco', defaultWidth: 105, minWidth: 70 },
  { id: 'payment_method', label: 'F. Pagamento', defaultWidth: 105, minWidth: 70 },
  { id: 'due_date', label: 'Vencimento', defaultWidth: 95, minWidth: 75 },
  { id: 'amount', label: 'Valor', defaultWidth: 95, minWidth: 75 },
  { id: 'paid', label: (props) => props.baixaLabel || 'Pago', defaultWidth: 90, minWidth: 70 },
  { id: 'open', label: 'Em aberto', defaultWidth: 90, minWidth: 70 },
  { id: 'status', label: 'Status', defaultWidth: 95, minWidth: 75 },
];

const DEFAULT_ACTIONS_WIDTH = 120;

const TxTable = ({
  tableId = 'default',
  txList = [],
  btnLabel = 'Baixar',
  baixaLabel = 'Recebido',
  onSettle,
  showNF = false,
  selected = new Set(),
  onToggle,
  onToggleAll,
  customers = [],
  bankAccounts = [],
  payMethods = [],
  txCatName = (t) => t.category_id || '—',
  txStatus = (t) => t.status,
  txDue = (t) => t.due_date,
  txPago = () => 0,
  txAberto = () => 0,
  estornarBaixa,
  openEditTx,
  deleteTx,
}) => {
  const applicableColumns = ALL_COLUMNS.filter((c) => !c.onlyIf || c.onlyIf({ showNF, baixaLabel }));

  const defaultWidthsMap = applicableColumns.reduce(
    (acc, col) => {
      acc[col.id] = col.defaultWidth;
      return acc;
    },
    { actions: DEFAULT_ACTIONS_WIDTH },
  );

  // Visibilidade de colunas salva individualmente por tabela
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = localStorage.getItem(`opticom_tx_cols_${tableId}`);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length > 0) {
          return new Set(arr);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar colunas da tabela ' + tableId, e);
    }
    return new Set(applicableColumns.map((c) => c.id));
  });

  // Largura de colunas salva individualmente por tabela
  const [widths, setWidths] = useState(() => {
    try {
      const saved = localStorage.getItem(`opticom_tx_widths_${tableId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...defaultWidthsMap, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar larguras da tabela ' + tableId, e);
    }
    return defaultWidthsMap;
  });

  // Sincroniza se o tableId mudar
  useEffect(() => {
    try {
      const savedCols = localStorage.getItem(`opticom_tx_cols_${tableId}`);
      if (savedCols) {
        const arr = JSON.parse(savedCols);
        if (Array.isArray(arr) && arr.length > 0) {
          setVisibleCols(new Set(arr));
        } else {
          setVisibleCols(new Set(applicableColumns.map((c) => c.id)));
        }
      } else {
        setVisibleCols(new Set(applicableColumns.map((c) => c.id)));
      }

      const savedWidths = localStorage.getItem(`opticom_tx_widths_${tableId}`);
      if (savedWidths) {
        const parsed = JSON.parse(savedWidths);
        if (parsed && typeof parsed === 'object') {
          setWidths({ ...defaultWidthsMap, ...parsed });
        } else {
          setWidths(defaultWidthsMap);
        }
      } else {
        setWidths(defaultWidthsMap);
      }
    } catch (e) {
      // fallback
    }
  }, [tableId, showNF]);

  // Controle de arraste
  const [activeCol, setActiveCol] = useState(null);
  const dragInfoRef = useRef(null);

  const handleMouseDown = (colId, e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = widths[colId] || defaultWidthsMap[colId] || 90;
    const colDef = applicableColumns.find((c) => c.id === colId);
    const minWidth = colId === 'actions' ? 90 : colDef?.minWidth || 50;
    const isActions = colId === 'actions';

    dragInfoRef.current = { colId, startX, startWidth, minWidth, isActions };
    setActiveCol(colId);

    const handleMouseMove = (moveEvent) => {
      if (!dragInfoRef.current) return;
      const { colId: activeId, startX: initialX, startWidth: initialW, minWidth: minW, isActions: actionsCol } =
        dragInfoRef.current;
      const delta = moveEvent.clientX - initialX;
      // Para ações (handle na esquerda), mover para a esquerda aumenta a largura
      const newWidth = actionsCol
        ? Math.max(minW, Math.round(initialW - delta))
        : Math.max(minW, Math.round(initialW + delta));

      setWidths((prev) => ({
        ...prev,
        [activeId]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setActiveCol(null);

      setWidths((latestWidths) => {
        try {
          localStorage.setItem(`opticom_tx_widths_${tableId}`, JSON.stringify(latestWidths));
        } catch (err) {
          console.error('Erro ao salvar larguras:', err);
        }
        return latestWidths;
      });
      dragInfoRef.current = null;
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResetColWidth = (colId) => {
    const defaultW = defaultWidthsMap[colId];
    if (!defaultW) return;
    setWidths((prev) => {
      const updated = { ...prev, [colId]: defaultW };
      try {
        localStorage.setItem(`opticom_tx_widths_${tableId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Menu de seleção de colunas
  const [showColPicker, setShowColPicker] = useState(false);
  const colPickerRef = useRef(null);
  const tableContainerRef = useRef(null);

  // Ajustar colunas à largura visível da tela
  const handleFitToScreen = () => {
    if (!tableContainerRef.current) return;
    const containerWidth = tableContainerRef.current.clientWidth || 1050;
    const fixedWidth = 40 + actionsWidth;
    const availableWidth = Math.max(500, containerWidth - fixedWidth - 10);
    const currentSum = renderedCols.reduce((sum, col) => sum + (widths[col.id] || col.defaultWidth), 0);
    if (currentSum <= 0) return;

    const scale = availableWidth / currentSum;
    const scaledWidths = { ...widths };
    renderedCols.forEach((col) => {
      const base = widths[col.id] || col.defaultWidth;
      const minW = col.minWidth || 50;
      scaledWidths[col.id] = Math.max(minW, Math.floor(base * scale));
    });

    setWidths(scaledWidths);
    try {
      localStorage.setItem(`opticom_tx_widths_${tableId}`, JSON.stringify(scaledWidths));
    } catch (e) {}
  };

  useEffect(() => {
    if (!showColPicker) return;
    const handleClickOutside = (e) => {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target)) {
        setShowColPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColPicker]);

  const toggleColVisibility = (colId) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) {
        if (next.size <= 1) return prev; // pelo menos 1 coluna visível
        next.delete(colId);
      } else {
        next.add(colId);
      }
      try {
        localStorage.setItem(`opticom_tx_cols_${tableId}`, JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  };

  const handleResetPreferences = () => {
    try {
      localStorage.removeItem(`opticom_tx_widths_${tableId}`);
      localStorage.removeItem(`opticom_tx_cols_${tableId}`);
    } catch (e) {}
    setVisibleCols(new Set(applicableColumns.map((c) => c.id)));
    setWidths(defaultWidthsMap);
  };

  const renderedCols = applicableColumns.filter((c) => visibleCols.has(c.id));
  const actionsWidth = widths.actions || DEFAULT_ACTIONS_WIDTH;
  const totalTableWidth = 40 + renderedCols.reduce((sum, col) => sum + (widths[col.id] || col.defaultWidth), 0) + actionsWidth;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Barra de ferramentas superior */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/80 border-b border-gray-200 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">{txList.length}</span>
          <span className="text-gray-500">{txList.length === 1 ? 'lançamento' : 'lançamentos'}</span>
          {selected.size > 0 && (
            <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full text-[11px] border border-blue-200">
              {selected.size} selecionado{selected.size > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Controles da tabela */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Botão Ajustar à tela */}
          <button
            type="button"
            onClick={handleFitToScreen}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors focus:outline-none"
            title="Ajustar todas as colunas para caber na largura da tela sem rolagem lateral"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>Ajustar à tela</span>
          </button>

          {/* Seletor de Colunas Visíveis */}
          <div className="relative" ref={colPickerRef}>
          <button
            type="button"
            onClick={() => setShowColPicker((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors focus:outline-none"
            title="Configurar quais colunas exibir ou ocultar"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <span>Colunas ({renderedCols.length}/{applicableColumns.length})</span>
          </button>

          {showColPicker && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                <span className="font-semibold text-gray-800 text-xs uppercase tracking-wide">Colunas Visíveis</span>
                <button
                  type="button"
                  onClick={handleResetPreferences}
                  className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline"
                  title="Restaurar larguras e visibilidade padrão"
                >
                  Restaurar padrão
                </button>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto py-1">
                {applicableColumns.map((col) => {
                  const isChecked = visibleCols.has(col.id);
                  const label = typeof col.label === 'function' ? col.label({ baixaLabel }) : col.label;
                  return (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer select-none text-xs text-gray-700"
                    >
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={isChecked}
                        onChange={() => toggleColVisibility(col.id)}
                      />
                      <span className="truncate">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Tabela com barra de rolagem horizontal padrão embaixo, igual à barra lateral */}
      <div ref={tableContainerRef} className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)] min-h-[350px]">
        <table
          className="text-sm border-collapse"
          style={{
            minWidth: `${totalTableWidth}px`,
            width: '100%',
            tableLayout: 'fixed',
          }}
        >
          <colgroup>
            <col style={{ width: '40px' }} />
            {renderedCols.map((col) => (
              <col key={col.id} style={{ width: `${widths[col.id] || col.defaultWidth}px` }} />
            ))}
            <col style={{ width: `${actionsWidth}px` }} />
          </colgroup>

          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-2.5 py-3 w-10 text-center bg-gray-50">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600"
                  aria-label="Selecionar todos os lançamentos"
                  checked={txList.length > 0 && txList.every((t) => selected.has(t.id))}
                  onChange={(e) =>
                    onToggleAll &&
                    onToggleAll(
                      txList.map((t) => t.id),
                      e.target.checked,
                    )
                  }
                />
              </th>

              {renderedCols.map((col) => {
                const label = typeof col.label === 'function' ? col.label({ baixaLabel }) : col.label;
                const isResizingThis = activeCol === col.id;
                return (
                  <th
                    key={col.id}
                    className="relative px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide select-none group bg-gray-50"
                  >
                    <div className="flex items-center justify-between overflow-hidden pr-2">
                      <span className="truncate" title={label}>{label}</span>
                    </div>

                    {/* Alça divisória para redimensionar por arraste */}
                    <div
                      onMouseDown={(e) => handleMouseDown(col.id, e)}
                      onDoubleClick={() => handleResetColWidth(col.id)}
                      title="Arraste para redimensionar (duplo clique para restaurar)"
                      className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center hover:bg-blue-100/70 transition-colors z-10 ${
                        isResizingThis ? 'bg-blue-500/20' : ''
                      }`}
                    >
                      <div
                        className={`w-[2px] h-4 rounded transition-colors ${
                          isResizingThis ? 'bg-blue-600' : 'bg-gray-300 group-hover:bg-blue-500'
                        }`}
                      />
                    </div>
                  </th>
                );
              })}

              <th className="relative px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide select-none group bg-gray-50">
                {/* Alça divisória para a coluna de ações */}
                <div
                  onMouseDown={(e) => handleMouseDown('actions', e)}
                  onDoubleClick={() => handleResetColWidth('actions')}
                  title="Arraste para redimensionar (duplo clique para restaurar)"
                  className={`absolute left-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center hover:bg-blue-100/70 transition-colors z-10 ${
                    activeCol === 'actions' ? 'bg-blue-500/20' : ''
                  }`}
                >
                  <div
                    className={`w-[2px] h-4 rounded transition-colors ${
                      activeCol === 'actions' ? 'bg-blue-600' : 'bg-gray-300 group-hover:bg-blue-500'
                    }`}
                  />
                </div>
                <span className="pr-1">Ações</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {txList.length === 0 && (
              <tr>
                <td
                  colSpan={renderedCols.length + 2}
                  className="px-4 py-12 text-center text-sm text-gray-400"
                >
                  Nenhum lançamento encontrado
                </td>
              </tr>
            )}

            {txList.map((t) => {
              const status = txStatus(t);
              const isSelected = selected.has(t.id);
              const rowBg = isSelected
                ? 'bg-blue-50'
                : status === 'OVERDUE'
                ? 'bg-red-50'
                : status === 'PARTIAL'
                ? 'bg-sky-50/40'
                : status === 'PAID' || status === 'RECEIVED'
                ? 'bg-green-50/30'
                : 'bg-white';

              return (
                <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${rowBg}`}>
                  <td className="px-2.5 py-2.5 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600"
                      aria-label={`Selecionar lançamento ${t.description || ''}`}
                      checked={isSelected}
                      onChange={() => onToggle && onToggle(t.id)}
                    />
                  </td>

                  {renderedCols.map((col) => {
                    if (col.id === 'description') {
                      const desc = t.description || t.desc || '—';
                      return (
                        <td key={col.id} className="px-3 py-2.5 overflow-hidden">
                          <p className="text-gray-800 truncate" title={desc}>
                            {desc}
                          </p>
                        </td>
                      );
                    }

                    if (col.id === 'category') {
                      const cat = txCatName(t);
                      return (
                        <td key={col.id} className="px-3 py-2.5 text-xs text-gray-500 overflow-hidden">
                          <span className="truncate block" title={cat}>
                            {cat}
                          </span>
                        </td>
                      );
                    }

                    if (col.id === 'customer') {
                      const name =
                        t.customers?.name ||
                        customers.find((c) => c.id === t.customer_id)?.name;
                      return (
                        <td key={col.id} className="px-3 py-2.5 text-xs text-gray-500 overflow-hidden">
                          <span className="truncate block" title={name || '—'}>
                            {name || <span className="text-gray-300">—</span>}
                          </span>
                        </td>
                      );
                    }

                    if (col.id === 'invoice') {
                      return (
                        <td key={col.id} className="px-3 py-2.5 text-xs text-gray-500 overflow-hidden">
                          <span className="truncate block">
                            {t.invoice_number || <span className="text-gray-300">—</span>}
                          </span>
                        </td>
                      );
                    }

                    if (col.id === 'bank') {
                      const name =
                        bankAccounts.find((b) => b.id === t.bank_account_id)?.name ||
                        t.account;
                      return (
                        <td key={col.id} className="px-3 py-2.5 text-xs text-gray-500 overflow-hidden">
                          <span className="truncate block" title={name || '—'}>
                            {name || <span className="text-gray-300">—</span>}
                          </span>
                        </td>
                      );
                    }

                    if (col.id === 'payment_method') {
                      const name =
                        payMethods.find((m) => m.id === t.payment_method_id)?.name ||
                        t.payMethod;
                      return (
                        <td key={col.id} className="px-3 py-2.5 text-xs text-gray-500 overflow-hidden">
                          <span className="truncate block" title={name || '—'}>
                            {name || <span className="text-gray-300">—</span>}
                          </span>
                        </td>
                      );
                    }

                    if (col.id === 'due_date') {
                      return (
                        <td key={col.id} className="px-3 py-2.5 text-gray-600 whitespace-nowrap overflow-hidden">
                          {fmtDate(txDue(t))}
                        </td>
                      );
                    }

                    if (col.id === 'amount') {
                      return (
                        <td key={col.id} className="px-3 py-2.5 font-semibold text-gray-800 whitespace-nowrap overflow-hidden">
                          {fmt(t.amount)}
                        </td>
                      );
                    }

                    if (col.id === 'paid') {
                      const pago = txPago(t);
                      return (
                        <td key={col.id} className="px-3 py-2.5 text-green-700 whitespace-nowrap overflow-hidden">
                          {pago > 0 ? fmt(pago) : <span className="text-gray-300">—</span>}
                        </td>
                      );
                    }

                    if (col.id === 'open') {
                      const aberto = txAberto(t);
                      return (
                        <td
                          key={col.id}
                          className={`px-3 py-2.5 font-medium whitespace-nowrap overflow-hidden ${
                            aberto > 0 ? 'text-amber-700' : 'text-gray-300'
                          }`}
                        >
                          {aberto > 0 ? fmt(aberto) : '—'}
                        </td>
                      );
                    }

                    if (col.id === 'status') {
                      return (
                        <td key={col.id} className="px-3 py-2.5 overflow-hidden">
                          <Badge status={status} />
                        </td>
                      );
                    }

                    return <td key={col.id} />;
                  })}

                  {/* Coluna Ações */}
                  <td className="px-3 py-2.5 overflow-hidden">
                    <div className="flex items-center justify-end gap-1.5">
                      {txAberto(t) > 0 && onSettle && (
                        <button
                          onClick={() => onSettle(t.id)}
                          className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
                        >
                          {btnLabel}
                        </button>
                      )}
                      {txPago(t) > 0 && estornarBaixa && (
                        <button
                          onClick={() => estornarBaixa(t)}
                          title="Estornar baixa"
                          aria-label={`Estornar baixa de ${t.description || ''}`}
                          className="text-xs text-gray-500 hover:text-amber-600 border border-gray-200 rounded-lg px-2 py-1 hover:bg-amber-50"
                        >
                          ↺
                        </button>
                      )}
                      {openEditTx && (
                        <button
                          onClick={() => openEditTx(t)}
                          title="Editar lançamento"
                          aria-label={`Editar lançamento ${t.description || ''}`}
                          className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded-lg px-2 py-1 hover:bg-blue-50"
                        >
                          ✎
                        </button>
                      )}
                      {deleteTx && (
                        <button
                          onClick={() => deleteTx(t.id)}
                          title="Excluir lançamento"
                          aria-label={`Excluir lançamento ${t.description || ''}`}
                          className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg px-2 py-1 hover:bg-red-50"
                        >
                          🗑
                        </button>
                      )}
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
};

export { TxTable };
