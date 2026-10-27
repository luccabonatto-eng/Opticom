const STATUS_MAP = {
  OPEN: ['bg-gray-100 text-gray-700', 'Aberta'],
  SCHEDULED: ['bg-blue-100 text-blue-700', 'Agendada'],
  IN_TRANSIT: ['bg-sky-100 text-sky-700', 'Em Trânsito'],
  IN_PROGRESS: ['bg-orange-100 text-orange-700', 'Em Andamento'],
  COMPLETED: ['bg-green-100 text-green-700', 'Concluída'],
  INVOICED: ['bg-purple-100 text-purple-700', 'Faturada'],
  CANCELLED: ['bg-red-100 text-red-700', 'Cancelada'],
  PENDING: ['bg-amber-100 text-amber-700', 'Pendente'],
  PARTIAL: ['bg-sky-100 text-sky-700', 'Parcial'],
  PAID: ['bg-green-100 text-green-700', 'Pago'],
  RECEIVED: ['bg-green-100 text-green-700', 'Recebido'],
  OVERDUE: ['bg-red-100 text-red-700', 'Vencido'],
  ACTIVE: ['bg-green-100 text-green-700', 'Ativo'],
  EXPIRED: ['bg-gray-100 text-gray-500', 'Expirado'],
  SUSPENDED: ['bg-yellow-100 text-yellow-700', 'Suspenso'],
  ON_LEAVE: ['bg-amber-100 text-amber-700', 'Afastado'],
  INACTIVE: ['bg-gray-100 text-gray-400', 'Inativo'],
  NEW: ['bg-blue-100 text-blue-700', 'Novo'],
  IN_USE: ['bg-green-100 text-green-700', 'Em Uso'],
  MAINTENANCE: ['bg-yellow-100 text-yellow-700', 'Manutenção'],
  DECOMMISSIONED: ['bg-red-100 text-red-600', 'Desativada'],
  AVAILABLE: ['bg-green-100 text-green-700', 'Disponível'],
  ADMIN: ['bg-purple-100 text-purple-700', 'Admin'],
  MANAGER: ['bg-blue-100 text-blue-700', 'Gerente'],
  TECHNICIAN: ['bg-gray-100 text-gray-700', 'Técnico'],
};

const Badge = ({ status }) => {
  const [cls, label] = STATUS_MAP[status] || ['bg-gray-100 text-gray-600', status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
  );
};

const PRIORITY_MAP = {
  LOW: ['border border-gray-300 text-gray-500', 'Baixa'],
  MEDIUM: ['border border-blue-300 text-blue-600', 'Média'],
  HIGH: ['border border-orange-400 text-orange-600', 'Alta'],
  URGENT: ['border border-red-500 text-red-600 bg-red-50', 'Urgente'],
};

const PriorityBadge = ({ p }) => {
  const [cls, label] = PRIORITY_MAP[p] || ['text-gray-500', '—'];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
};

const PRIORITY_BORDER = {
  LOW: 'border-l-gray-300',
  MEDIUM: 'border-l-blue-400',
  HIGH: 'border-l-orange-500',
  URGENT: 'border-l-red-600',
};

export { STATUS_MAP, Badge, PRIORITY_MAP, PriorityBadge, PRIORITY_BORDER };
