import { useEffect } from 'react';

const Toast = ({ msg, type = 'success', onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, []);
  const colors = { success: 'bg-gray-900 text-white', error: 'bg-red-600 text-white', info: 'bg-blue-600 text-white' };
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  return (
    <div
      className={`fixed bottom-5 right-5 z-[100] ${colors[type] || colors.success} text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-3`}
    >
      <span className="text-green-400">{icons[type] || '✓'}</span> {msg}
      <button onClick={onClose} className="text-gray-400 hover:text-white ml-1">
        ×
      </button>
    </div>
  );
};

export { Toast };
