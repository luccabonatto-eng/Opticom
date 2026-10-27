const NotificationsTab = ({ notif, saveNotif, setNotif }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
    <div>
      <h3 className="text-base font-semibold text-gray-800">Preferências de Notificação</h3>
      <p className="text-xs text-gray-400 mt-0.5">Controle como e quando você recebe alertas</p>
    </div>
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Canal</p>
      {[
        ['email', 'Notificações por E-mail'],
        ['sms', 'Notificações por SMS'],
      ].map(([k, l]) => (
        <label key={k} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
          <span className="text-sm text-gray-700">{l}</span>
          <div
            onClick={() => setNotif((p) => ({ ...p, [k]: !p[k] }))}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${notif[k] ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notif[k] ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </div>
        </label>
      ))}
    </div>
    <div className="space-y-1 border-t border-gray-100 pt-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Eventos</p>
      {[
        ['lowStock', 'Estoque abaixo do mínimo'],
        ['osOverdue', 'OS em atraso'],
        ['contractExpiring', 'Contratos expirando (30 dias)'],
        ['payments', 'Cobranças vencidas'],
      ].map(([k, l]) => (
        <label key={k} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
          <span className="text-sm text-gray-700">{l}</span>
          <div
            onClick={() => setNotif((p) => ({ ...p, [k]: !p[k] }))}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${notif[k] ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notif[k] ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </div>
        </label>
      ))}
    </div>
    <div className="flex justify-end pt-2 border-t border-gray-100">
      <button
        onClick={saveNotif}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        Salvar Preferências
      </button>
    </div>
  </div>
);

export { NotificationsTab };
