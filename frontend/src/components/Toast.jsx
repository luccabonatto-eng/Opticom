import { useEffect } from 'react';
import { toastKind } from '../utils/toast-kind.js';

const Toast = ({ msg, type, onClose }) => {
  const kind = type || toastKind(String(msg));
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, []);
  const colors = { success: 'bg-gray-900 text-white', error: 'bg-red-600 text-white', info: 'bg-blue-600 text-white' };
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`fixed bottom-5 right-5 z-[100] ${colors[kind]} text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-3`}
    >
      <span className={kind === 'success' ? 'text-green-400' : 'text-white font-bold'}>{icons[kind]}</span> {msg}
      <button onClick={onClose} aria-label="Fechar aviso" className="text-white/70 hover:text-white ml-1">
        ×
      </button>
    </div>
  );
};

export { Toast };
