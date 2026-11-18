import { Icon } from '../components/Icon.jsx';
import { TITLES } from '../config/navigation.js';
import { useState } from 'react';

// shortcut: os alertas vinham de uma lista fixa de demonstração ('Empresa ABC
// — R$ 2.500,00 vencido') que nunca mudava. Enquanto não existe endpoint de
// alertas no backend, o sininho fica vazio em vez de mentir. Passar `alerts`
// quando o endpoint existir.
const Header = ({ page, onLogout, setPage, regime, user, alerts = [], onMenu }) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const visible = alerts.filter((a) => !dismissed.includes(a.id));
  const navMap = {
    OVERDUE_RECEIVABLE: 'financial',
    BATTERY_END_OF_LIFE: 'inventory',
    LOW_STOCK: 'inventory',
    OVERDUE_ORDER: 'orders',
  };
  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-3.5 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button onClick={onMenu} aria-label="Abrir menu" className="md:hidden -ml-1 p-2 rounded-lg text-gray-600 hover:bg-gray-100">
          <Icon name="menu" className="w-5 h-5" />
        </button>
        <h1 className="text-base md:text-lg font-semibold text-gray-800 truncate">{TITLES[page] || page}</h1>
        {regime && (
          <span
            title="Regime tributário"
            className={`hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${regime.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${regime.dot}`} />
            {regime.short}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 md:gap-3 shrink-0">
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            aria-label={visible.length ? `Notificações (${visible.length})` : 'Notificações'}
            aria-expanded={notifOpen}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative"
          >
            <Icon name="bell" className="w-5 h-5" />
            {visible.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-10 w-[min(24rem,calc(100vw-2rem))] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">
                  Notificações{' '}
                  {visible.length > 0 && (
                    <span className="ml-1.5 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {visible.length}
                    </span>
                  )}
                </p>
                {visible.length > 0 && (
                  <button
                    onClick={() => setDismissed(alerts.map((a) => a.id))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              {visible.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">Nenhuma notificação pendente</p>
              )}
              {visible.map((a) => {
                const sev = {
                  HIGH: ['bg-red-500', 'Alta'],
                  MEDIUM: ['bg-amber-500', 'Média'],
                  LOW: ['bg-blue-500', 'Baixa'],
                }[a.severity] || ['bg-gray-400', ''];
                return (
                  <div
                    key={a.id}
                    className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex items-start gap-2"
                  >
                    <span role="img" aria-label={`Prioridade ${sev[1]}`} className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sev[0]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{a.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.message}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setPage(navMap[a.type] || 'dashboard');
                          setNotifOpen(false);
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => setDismissed((p) => [...p, a.id])}
                        aria-label="Dispensar notificação"
                        className="text-gray-500 hover:text-gray-700 ml-1 p-0.5"
                      >
                        <Icon name="close" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 border-l border-gray-200 pl-3">
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {(user?.name || '?')[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-gray-500">{user?.company?.name || 'Opticom'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          aria-label="Sair do sistema"
          title="Sair do sistema"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Icon name="logout" className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export { Header };
