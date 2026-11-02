const BotaoExportar = ({ onClick, title, label = '↓ Exportar CSV' }) => (
  <button
    onClick={onClick}
    title={title}
    className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-blue-600 whitespace-nowrap"
  >
    {label}
  </button>
);

export { BotaoExportar };
