const BotaoExportar = ({ onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-blue-600 whitespace-nowrap"
  >
    ↓ Exportar CSV
  </button>
);

export { BotaoExportar };
