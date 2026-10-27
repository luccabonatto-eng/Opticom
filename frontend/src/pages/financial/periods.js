const monthLabel = (ym) => {
  const [y, m] = ym.split('-');
  const nms = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return `${nms[parseInt(m) - 1]} ${y}`;
};

const prevMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
};

const BUD_PERIODS = [
  ['2026-04', 'Abril 2026'],
  ['2026-03', 'Março 2026'],
  ['2026-02', 'Fevereiro 2026'],
  ['2026-01', 'Janeiro 2026'],
  ['2025-12', 'Dezembro 2025'],
  ['2025-11', 'Novembro 2025'],
];

export { monthLabel, prevMonth, BUD_PERIODS };
