import { useEffect, useId, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Modal = ({ open, onClose, title, size = 'md', locked = false, children }) => {
  const panelRef = useRef(null);
  const titleId = useId();

  // Ao abrir, o foco entra na janela; ao fechar, volta para quem a abriu.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    const panel = panelRef.current;
    const body = panel?.lastElementChild; // conteúdo antes do × do cabeçalho
    (panel?.querySelector('[autofocus]') || body?.querySelector(FOCUSABLE) || panel?.querySelector(FOCUSABLE) || panel)?.focus();
    return () => opener?.focus?.();
  }, [open]);

  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  const handleBackdrop = locked ? undefined : onClose;

  // O listener fica no painel: com janelas empilhadas, só a de cima (que tem o foco) reage.
  const onKeyDown = (e) => {
    if (e.key === 'Escape' && !locked) {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...panelRef.current.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`bg-white rounded-2xl shadow-2xl ${widths[size]} w-full mx-3 sm:mx-4 max-h-[92vh] sm:max-h-[88vh] flex flex-col outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 id={titleId} className="text-base font-semibold text-gray-800">
            {title}
          </h2>
          {!locked && (
            <button
              onClick={onClose}
              aria-label="Fechar janela"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 text-xl leading-none"
            >
              ×
            </button>
          )}
        </div>
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

export { Modal };
