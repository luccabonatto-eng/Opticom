import { DEFAULT_PERMISSIONS, MENU } from '../config/navigation.js';
import { Icon } from '../components/Icon.jsx';

// No celular vira gaveta (mobileOpen); a partir de md fica fixa e pode ser recolhida.
const Sidebar = ({ page, setPage, collapsed: collapsedDesktop, setCollapsed, user, permissions, mobileOpen, onClose }) => {
  const collapsed = collapsedDesktop && !mobileOpen;
  const role = user?.role || 'TECHNICIAN';
  const allowed = new Set((permissions || DEFAULT_PERMISSIONS)[role] || DEFAULT_PERMISSIONS[role] || []);
  const visibleMenu = MENU.filter((m) => allowed.has(m.id));
  const ungrouped = visibleMenu.filter((m) => !m.group);
  const groups = [...new Set(visibleMenu.filter((m) => m.group).map((m) => m.group))];
  const NavBtn = ({ m }) => (
    <button
      onClick={() => setPage(m.id)}
      aria-current={page === m.id ? 'page' : undefined}
      className={`w-full flex items-center gap-3 px-4 py-2.5 md:py-2 text-sm transition-colors ${collapsed ? 'justify-center px-0' : ''} ${page === m.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
      title={m.label}
      aria-label={collapsed ? m.label : undefined}
    >
      <Icon name={m.icon} className="w-4 h-4 shrink-0" />
      {!collapsed && <span>{m.label}</span>}
    </button>
  );
  return (
    <>
    {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} aria-hidden="true" />}
    <aside
      aria-label="Menu principal"
      className={`fixed md:sticky inset-y-0 left-0 top-0 z-40 w-60 ${collapsed ? 'md:w-14' : ''} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 bg-gray-900 text-white flex flex-col h-screen shrink-0 transition-[transform,width] duration-200`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-3 border-b border-gray-800 ${collapsed ? 'justify-center' : ''}`}
      >
        {!collapsed ? (
          <>
            <div className="bg-white rounded-md px-2 py-1.5">
              <img src="/logo-opticom-grande-color.png" alt="Opticom Service" className="h-6 object-contain" />
            </div>
            <button
              onClick={() => (mobileOpen ? onClose() : setCollapsed(true))}
              aria-label={mobileOpen ? 'Fechar menu' : 'Recolher menu'}
              className="ml-auto text-gray-400 hover:text-white p-2 shrink-0"
            >
              <Icon name={mobileOpen ? 'close' : 'chevLeft'} className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button onClick={() => setCollapsed(false)} aria-label="Expandir menu" className="text-gray-400 hover:text-white p-1">
            <Icon name="menu" className="w-5 h-5" />
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
              <p className="px-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-widest">{g}</p>
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
    </>
  );
};

export { Sidebar };
