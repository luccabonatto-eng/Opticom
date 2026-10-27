const STATUS_FLOW = {
  OPEN: { next: 'SCHEDULED', label: 'Agendar OS', color: 'blue' },
  SCHEDULED: { next: 'IN_TRANSIT', label: 'Despachar Técnico', color: 'sky' },
  IN_TRANSIT: { next: 'IN_PROGRESS', label: 'Iniciar Atendimento', color: 'orange' },
  IN_PROGRESS: { next: 'COMPLETED', label: 'Concluir OS', color: 'green' },
  COMPLETED: { next: 'INVOICED', label: 'Faturar OS', color: 'purple' },
};

const COLS = [
  { key: 'OPEN', label: 'Abertas', bg: 'bg-gray-100', text: 'text-gray-700' },
  { key: 'SCHEDULED', label: 'Agendadas', bg: 'bg-blue-100', text: 'text-blue-700' },
  { key: 'IN_TRANSIT', label: 'Em Trânsito', bg: 'bg-sky-100', text: 'text-sky-700' },
  { key: 'IN_PROGRESS', label: 'Em Andamento', bg: 'bg-orange-100', text: 'text-orange-700' },
  { key: 'COMPLETED', label: 'Concluídas', bg: 'bg-green-100', text: 'text-green-700' },
  { key: 'INVOICED', label: 'Faturadas', bg: 'bg-purple-100', text: 'text-purple-700' },
];

export { STATUS_FLOW, COLS };
