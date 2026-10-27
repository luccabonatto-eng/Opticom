import { Icon } from '../components/Icon.jsx';
import { MOCK_ALERTS } from '../mocks/demo.js';
import { TITLES } from '../config/navigation.js';
import { useState } from 'react';

const Header = ({ page, onLogout, setPage, regime, user }) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const visible = MOCK_ALERTS.filter((a) => !dismissed.includes(a.id));
  const navMap = {
    OVERDUE_RECEIVABLE: 'financial',
    BATTERY_END_OF_LIFE: 'inventory',
    LOW_STOCK: 'inventory',
    OVERDUE_ORDER: 'orders',
  };
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-800">{TITLES[page] || page}</h1>
        {regime && (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${regime.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${regime.dot}`} />
            {regime.short}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative"
          >
            <Icon name="bell" className="w-5 h-5" />
            {visible.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-10 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">
                  Notificações{' '}
                  {visible.length > 0 && (
                    <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {visible.length}
                    </span>
                  )}
                </p>
                {visible.length > 0 && (
                  <button
                    onClick={() => setDismissed(MOCK_ALERTS.map((a) => a.id))}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              {visible.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">Nenhuma notificação pendente</p>
              )}
              {visible.map((a) => {
                const sev = {
                  HIGH: ['border-l-red-500', '🔴'],
                  MEDIUM: ['border-l-amber-400', '🟡'],
                  LOW: ['border-l-blue-400', '🔵'],
                }[a.severity];
                return (
                  <div
                    key={a.id}
                    className={`border-l-4 ${sev[0]} px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex items-start gap-2`}
                  >
                    <span className="text-sm mt-0.5">{sev[1]}</span>
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
                        className="text-xs text-gray-400 hover:text-gray-600 ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 border-l border-gray-200 pl-3">
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {(user?.name || '?')[0]}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700">{user?.name || 'Usuário'}</p>
            <p className="text-xs text-gray-400">{user?.company?.name || 'Opticom'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Icon name="logout" className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export { Header };
