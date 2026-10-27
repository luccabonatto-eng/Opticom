import { Badge } from '../../../components/Badge.jsx';
import { DEFAULT_PERMISSIONS, MENU } from '../../../config/navigation.js';
import { Icon } from '../../../components/Icon.jsx';
import { Modal } from '../../../components/Modal.jsx';
import { api } from '../../../api/client.js';

const UsersTab = ({
  deactivateUser,
  deleteConfirm,
  deleteUserPermanent,
  editUserModal,
  invite,
  inviteForm,
  inviteModal,
  permissions,
  savePermissions,
  setDeleteConfirm,
  setEditUserModal,
  setInviteForm,
  setInviteModal,
  updateUser,
  users,
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-600">{users.filter((u) => u.status === 'ACTIVE').length} usuários ativos</p>
      <button
        onClick={() => setInviteModal(true)}
        className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        <Icon name="plus" className="w-4 h-4" /> Convidar Usuário
      </button>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {['Usuário', 'E-mail', 'Perfil', 'Último Login', 'Status', ''].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(u.name || '?')[0]}
                  </div>
                  <p className="font-medium text-gray-800">{u.name}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
              <td className="px-4 py-3">
                <Badge status={u.role} />
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {u.last_login ? new Date(u.last_login).toLocaleDateString('pt-BR') : u.lastLogin || '—'}
              </td>
              <td className="px-4 py-3">
                <Badge status={u.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditUserModal({ id: u.id, name: u.name, email: u.email, role: u.role })}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                  {u.status === 'ACTIVE' && u.id !== api.user?.id && (
                    <button onClick={() => deactivateUser(u.id)} className="text-xs text-amber-600 hover:underline">
                      Desativar
                    </button>
                  )}
                  {u.id !== api.user?.id && (
                    <button
                      onClick={() => setDeleteConfirm({ id: u.id, name: u.name })}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Excluir
                    </button>
                  )}
                  {u.id === api.user?.id && <span className="text-xs text-gray-300">você</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Excluir Usuário" size="sm">
      {deleteConfirm && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800">Esta ação é irreversível.</p>
            <p className="text-sm text-red-700 mt-1">
              O usuário <strong>{deleteConfirm.name}</strong> será excluído permanentemente do sistema, incluindo seu
              histórico de acesso.
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => deleteUserPermanent(deleteConfirm.id)}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              Confirmar Exclusão
            </button>
          </div>
        </div>
      )}
    </Modal>

    <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="Convidar Usuário" size="sm">
      <div className="space-y-4">
        {[
          { label: 'Nome', key: 'name', placeholder: 'Nome completo', type: 'text' },
          { label: 'E-mail', key: 'email', placeholder: 'email@empresa.com.br', type: 'email' },
          { label: 'Senha inicial', key: 'password', placeholder: 'Mínimo 6 caracteres', type: 'password' },
        ].map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <input
              type={f.type}
              value={inviteForm[f.key]}
              onChange={(e) => setInviteForm((p) => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
          <select
            value={inviteForm.role}
            onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="ADMIN">Administrador</option>
            <option value="MANAGER">Gerente</option>
            <option value="TECHNICIAN">Técnico</option>
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setInviteModal(false)}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={invite}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Enviar Convite
          </button>
        </div>
      </div>
    </Modal>

    <Modal open={!!editUserModal} onClose={() => setEditUserModal(null)} title="Editar Usuário" size="sm">
      {editUserModal && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              value={editUserModal.name}
              onChange={(e) => setEditUserModal((p) => ({ ...p, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              value={editUserModal.email}
              disabled
              className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado por aqui</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
            <select
              value={editUserModal.role}
              onChange={(e) => setEditUserModal((p) => ({ ...p, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="ADMIN">Administrador</option>
              <option value="MANAGER">Gerente</option>
              <option value="TECHNICIAN">Técnico</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova senha <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="password"
              value={editUserModal.newPassword || ''}
              onChange={(e) => setEditUserModal((p) => ({ ...p, newPassword: e.target.value }))}
              placeholder="Deixe em branco para não alterar"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setEditUserModal(null)}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={updateUser}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </Modal>

    {/* Matriz de Permissões */}
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Permissões por Perfil</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Defina quais módulos cada perfil pode acessar. Administrador tem acesso total.
          </p>
        </div>
        <button
          onClick={() => savePermissions && savePermissions({ ...DEFAULT_PERMISSIONS })}
          className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50"
        >
          Redefinir Padrões
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-2 text-left text-xs font-semibold text-gray-500 w-48">Módulo</th>
              <th className="pb-2 text-center text-xs font-semibold text-gray-400 w-28">
                ADMIN
                <br />
                <span className="text-xs font-normal text-gray-300">sempre total</span>
              </th>
              <th className="pb-2 text-center text-xs font-semibold text-blue-600 w-28">GERENTE</th>
              <th className="pb-2 text-center text-xs font-semibold text-green-600 w-28">TÉCNICO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MENU.map((m) => {
              const managerHas = (permissions.MANAGER || []).includes(m.id);
              const techHas = (permissions.TECHNICIAN || []).includes(m.id);
              const toggle = (role, id) => {
                const cur = permissions[role] || [];
                const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
                savePermissions && savePermissions({ ...permissions, [role]: next });
              };
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="py-2.5 text-gray-700 font-medium">{m.label}</td>
                  <td className="py-2.5 text-center">
                    <span className="text-gray-300 text-lg">✓</span>
                  </td>
                  <td className="py-2.5 text-center">
                    <button
                      onClick={() => toggle('MANAGER', m.id)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${managerHas ? 'bg-blue-500' : 'bg-gray-200'}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${managerHas ? 'left-4' : 'left-0.5'}`}
                      />
                    </button>
                  </td>
                  <td className="py-2.5 text-center">
                    <button
                      onClick={() => toggle('TECHNICIAN', m.id)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${techHas ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${techHas ? 'left-4' : 'left-0.5'}`}
                      />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Submenus do Financeiro */}
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Submenus do Financeiro</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Controle quais abas do módulo Financeiro cada perfil pode visualizar. Administrador sempre tem acesso total.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-2 text-left text-xs font-semibold text-gray-500 w-48">Submenu</th>
              <th className="pb-2 text-center text-xs font-semibold text-gray-400 w-28">
                ADMIN
                <br />
                <span className="text-xs font-normal text-gray-300">sempre total</span>
              </th>
              <th className="pb-2 text-center text-xs font-semibold text-blue-600 w-28">GERENTE</th>
              <th className="pb-2 text-center text-xs font-semibold text-green-600 w-28">TÉCNICO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              { id: 'receivable', label: 'A Receber' },
              { id: 'payable', label: 'A Pagar' },
              { id: 'cashflow', label: 'Fluxo de Caixa' },
              { id: 'dre', label: 'DRE Gerencial' },
              { id: 'payroll', label: 'Folha Salarial' },
              { id: 'approval', label: 'Aprovações do Dia' },
              { id: 'statement', label: 'Extrato Bancário' },
            ].map((s) => {
              const managerHas = (permissions.MANAGER_fin || []).includes(s.id);
              const techHas = (permissions.TECHNICIAN_fin || []).includes(s.id);
              const toggleFin = (role, id) => {
                const key = `${role}_fin`;
                const cur = permissions[key] || [];
                const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
                savePermissions && savePermissions({ ...permissions, [key]: next });
              };
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-2.5 text-gray-700 font-medium pl-2">{s.label}</td>
                  <td className="py-2.5 text-center">
                    <span className="text-gray-300 text-lg">✓</span>
                  </td>
                  <td className="py-2.5 text-center">
                    <button
                      onClick={() => toggleFin('MANAGER', s.id)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${managerHas ? 'bg-blue-500' : 'bg-gray-200'}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${managerHas ? 'left-4' : 'left-0.5'}`}
                      />
                    </button>
                  </td>
                  <td className="py-2.5 text-center">
                    <button
                      onClick={() => toggleFin('TECHNICIAN', s.id)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${techHas ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${techHas ? 'left-4' : 'left-0.5'}`}
                      />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export { UsersTab };
