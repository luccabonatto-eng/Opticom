import { DEFAULT_PERMISSIONS, MENU } from '../config/navigation.js';
import { Icon } from '../components/Icon.jsx';

const Sidebar = ({ page, setPage, collapsed, setCollapsed, user, permissions }) => {
  const role = user?.role || 'TECHNICIAN';
  const allowed = new Set((permissions || DEFAULT_PERMISSIONS)[role] || DEFAULT_PERMISSIONS[role] || []);
  const visibleMenu = MENU.filter((m) => allowed.has(m.id));
  const ungrouped = visibleMenu.filter((m) => !m.group);
  const groups = [...new Set(visibleMenu.filter((m) => m.group).map((m) => m.group))];
  const NavBtn = ({ m }) => (
    <button
      onClick={() => setPage(m.id)}
      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${collapsed ? 'justify-center px-0' : ''} ${page === m.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
      title={m.label}
    >
      <Icon name={m.icon} className="w-4 h-4 shrink-0" />
      {!collapsed && <span>{m.label}</span>}
    </button>
  );
  return (
    <aside
      className={`${collapsed ? 'w-14' : 'w-60'} bg-gray-900 text-white flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-200`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-3 border-b border-gray-800 ${collapsed ? 'justify-center' : ''}`}
      >
        {!collapsed ? (
          <>
            <div className="bg-white rounded-md px-2 py-1.5">
              <img src="/logo-opticom-grande-color.png" alt="Opticom Service" className="h-6 object-contain" />
            </div>
            <button onClick={() => setCollapsed(true)} className="ml-auto text-gray-500 hover:text-white p-1 shrink-0">
              <Icon name="chevLeft" className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button onClick={() => setCollapsed(false)} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {ungrouped.map((m) => (
          <NavBtn key={m.id} m={m} />
        ))}
        {groups.map((g) => (
          <div key={g} className="mt-3">
            {!collapsed && (
              <p className="px-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-widest">{g}</p>
            )}
            {collapsed && <div className="mx-3 my-1 border-t border-gray-700" />}
            {visibleMenu
              .filter((m) => m.group === g)
              .map((m) => (
                <NavBtn key={m.id} m={m} />
              ))}
          </div>
        ))}
      </nav>
      <div className={`px-4 py-3 border-t border-gray-800 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold shrink-0">
              {(user?.name || '?')[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-gray-400">{user?.role || ''}</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
            {(user?.name || '?')[0]}
          </div>
        )}
      </div>
    </aside>
  );
};

export { Sidebar };
