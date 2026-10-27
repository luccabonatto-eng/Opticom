const shortDate = (value) => value
  ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace(' de ', ', ').replace('.', '')
  : 'Selecionar';

const DateFilter = ({ from, setFrom, to, setTo, monthNavigation = false, settledLabel, settledOnly, onSettledChange }) => {
  if (monthNavigation) {
    const moveMonth = (offset) => {
      const anchor = from || to;
      const date = anchor ? new Date(`${anchor}T12:00:00`) : new Date();
      const first = new Date(date.getFullYear(), date.getMonth() + offset, 1, 12);
      const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12);
      const iso = (day) => `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      setFrom(iso(first));
      setTo(iso(last));
    };
    const dateInput = (value, setter, label, boundary) => (
      <label className="relative flex h-8 w-24 items-center justify-center rounded border border-gray-300 bg-gray-50 text-xs text-gray-600 focus-within:ring-2 focus-within:ring-blue-500">
        <span aria-hidden="true">{shortDate(value)}</span>
        <input type="date" aria-label={label} value={value} {...boundary}
          onChange={(event) => setter(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
    );
    return (
      <div role="group" aria-label="Filtrar por vencimento" className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
        <span className="flex items-center gap-1 text-sm text-gray-500">
          Filtrar
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18l-7 8v8l-4-2v-6z" /></svg>
        </span>
        <button type="button" aria-label="Mês anterior" title="Mês anterior" onClick={() => moveMonth(-1)} className="rounded p-1 text-gray-500 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500">◀</button>
        {dateInput(from, setFrom, 'Data inicial', { max: to || undefined })}
        <span className="text-xs text-gray-500">a</span>
        {dateInput(to, setTo, 'Data final', { min: from || undefined })}
        <button type="button" aria-label="Próximo mês" title="Próximo mês" onClick={() => moveMonth(1)} className="rounded p-1 text-gray-500 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500">▶</button>
        {settledLabel && (
          <label className="flex cursor-pointer flex-col items-center gap-1 border-l border-gray-200 pl-3 text-[10px] text-gray-500 whitespace-nowrap">
            {settledLabel}
            <button
              type="button"
              role="switch"
              aria-label={settledLabel}
              aria-checked={settledOnly}
              title={`Mostrar somente ${settledLabel.toLowerCase()}`}
              onClick={() => onSettledChange(!settledOnly)}
              className={`relative h-7 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${settledOnly ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${settledOnly ? 'translate-x-5' : 'translate-x-0'} left-0.5`} />
            </button>
          </label>
        )}
        {(from || to) && <button type="button" aria-label="Limpar período" title="Limpar período" onClick={() => { setFrom(''); setTo(''); }} className="rounded px-1 text-gray-400 hover:text-red-500">✕</button>}
      </div>
    );
  }
  return (
  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
    <span className="text-xs text-gray-400 whitespace-nowrap">De:</span>
    <input
      type="date"
      value={from}
      onChange={(e) => setFrom(e.target.value)}
      className="text-xs border-0 bg-transparent focus:outline-none text-gray-700 w-32"
    />
    <span className="text-xs text-gray-400">Até:</span>
    <input
      type="date"
      value={to}
      onChange={(e) => setTo(e.target.value)}
      className="text-xs border-0 bg-transparent focus:outline-none text-gray-700 w-32"
    />
    {(from || to) && (
      <button
        onClick={() => {
          setFrom('');
          setTo('');
        }}
        className="text-xs text-gray-400 hover:text-red-500 ml-1 font-bold"
      >
        ✕
      </button>
    )}
  </div>
  );
};

export { DateFilter };
