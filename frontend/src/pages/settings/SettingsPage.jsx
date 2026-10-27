import { AccountsTab } from './tabs/AccountsTab.jsx';
import { CompanyTab } from './tabs/CompanyTab.jsx';
import { DEFAULT_PERMISSIONS } from '../../config/navigation.js';
import { FinancialSettingsTab } from './tabs/FinancialSettingsTab.jsx';
import { NotificationsTab } from './tabs/NotificationsTab.jsx';
import { SlaTab } from './tabs/SlaTab.jsx';
import { TaxTab } from './tabs/TaxTab.jsx';
import { Toast } from '../../components/Toast.jsx';
import { UsersTab } from './tabs/UsersTab.jsx';
import { api } from '../../api/client.js';
import { useEffect, useState } from 'react';

const SettingsPage = ({
  taxRegime,
  setTaxRegime,
  incomeCats = [],
  setIncomeCats,
  expenseCats = [],
  setExpenseCats,
  bankAccounts = [],
  setBankAccounts,
  payMethods = [],
  setPayMethods,
  permissions = DEFAULT_PERMISSIONS,
  savePermissions,
}) => {
  const [tab, setTab] = useState('company');
  const [company, setCompany] = useState({
    name: 'Opticom Telecom',
    cnpj: '04.176.164/0001-25',
    email: 'contato@opticom.com.br',
    phone: '(17) 3212-5000',
    address: 'Rua das Telecomunicações, 100',
    city: 'São José do Rio Preto — SP',
    cep: '15000-000',
    plan: 'PROFESSIONAL',
  });
  const [users, setUsers] = useState([]);
  const [notif, setNotif] = useState({
    email: true,
    sms: false,
    lowStock: true,
    osOverdue: true,
    contractExpiring: true,
    payments: true,
  });
  const [sla, setSla] = useState({ urgent: 2, high: 8, medium: 24, low: 72 });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([api.getSetting('company'), api.getSetting('sla'), api.getSetting('notifications')]).then(
      ([c, s, n]) => {
        if (c.success && c.data?.value) {
          try {
            setCompany(JSON.parse(c.data.value));
          } catch {}
        }
        if (s.success && s.data?.value) {
          try {
            setSla(JSON.parse(s.data.value));
          } catch {}
        }
        if (n.success && n.data?.value) {
          try {
            setNotif(JSON.parse(n.data.value));
          } catch {}
        }
      },
    );
  }, []);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '', role: 'TECHNICIAN' });
  // Financial tab state — moved here from IIFE (hooks cannot be inside callbacks)
  const [newCat, setNewCat] = useState('');
  const [newCatType, setNewCatType] = useState('income');
  const [newCatClass, setNewCatClass] = useState('OUTRAS_DESPESAS');
  const [newCatClassIn, setNewCatClassIn] = useState('RECEITA_SERVICO');
  const [newBank, setNewBank] = useState({ bank: '', agency: '', account: '', type: 'Corrente' });
  const [newPay, setNewPay] = useState('');
  // Contas e Saldos tab state
  const [initBalEdit, setInitBalEdit] = useState({});
  const [savingBal, setSavingBal] = useState({});
  const [investList, setInvestList] = useState([]);
  const [investLoading, setInvestLoading] = useState(false);
  const [newInvest, setNewInvest] = useState({
    description: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    bank_account_id: '',
  });

  useEffect(() => {
    api.getUsers().then((r) => {
      if (r.success) setUsers(r.data || []);
      else setUsers([]);
    });
  }, []);

  useEffect(() => {
    if (tab !== 'accounts') return;
    setInvestLoading(true);
    api.getAllTransactions().then((r) => {
      if (r.success) {
        const txs = r.data?.data || r.data || [];
        const investCatIds = new Set(expenseCats.filter((c) => c.accounting_class === 'INVESTIMENTO').map((c) => c.id));
        setInvestList(txs.filter((t) => t.type === 'EXPENSE' && investCatIds.has(t.category_id)).slice(0, 30));
      }
      setInvestLoading(false);
    });
  }, [tab]);

  const saveInitBal = async (id) => {
    const raw = (initBalEdit[id] !== undefined ? initBalEdit[id] : '').replace(',', '.').replace(/[^0-9.]/g, '');
    const val = Math.round(parseFloat(raw || '0') * 100);
    if (isNaN(val)) {
      setToast('Valor inválido');
      return;
    }
    setSavingBal((p) => ({ ...p, [id]: true }));
    const r = await api.updateBankAccount(id, { initial_balance: val });
    setSavingBal((p) => ({ ...p, [id]: false }));
    if (r.success) {
      setBankAccounts((p) => p.map((b) => (b.id === id ? { ...b, initial_balance: val } : b)));
      setToast('Saldo inicial salvo!');
    } else {
      setToast(r.error || 'Erro ao salvar saldo');
    }
  };

  const addInvestment = async () => {
    if (!newInvest.description || !newInvest.amount || !newInvest.due_date) {
      setToast('Preencha descrição, valor e data');
      return;
    }
    const investCat = expenseCats.find((c) => c.accounting_class === 'INVESTIMENTO');
    if (!investCat) {
      setToast('Nenhuma categoria de Investimento cadastrada');
      return;
    }
    const amount = Math.round(parseFloat(newInvest.amount.replace(',', '.')) * 100);
    if (isNaN(amount) || amount <= 0) {
      setToast('Valor inválido');
      return;
    }
    const payload = {
      type: 'EXPENSE',
      description: newInvest.description,
      amount,
      due_date: newInvest.due_date,
      category_id: investCat.id,
      status: 'PENDING',
    };
    if (newInvest.bank_account_id) payload.bank_account_id = newInvest.bank_account_id;
    const r = await api.createTransaction(payload);
    if (r.success) {
      const tx = r.data?.data || r.data;
      setInvestList((p) => [tx, ...p]);
      setNewInvest({
        description: '',
        amount: '',
        due_date: new Date().toISOString().split('T')[0],
        bank_account_id: '',
      });
      setToast('Investimento registrado!');
    } else {
      setToast(r.error || 'Erro ao registrar');
    }
  };

  const saveCompany = async () => {
    await api.setSetting('company', JSON.stringify(company));
    setToast('Configurações da empresa salvas!');
  };
  const saveSla = async () => {
    await api.setSetting('sla', JSON.stringify(sla));
    setToast('SLAs atualizados!');
  };
  const saveNotif = async () => {
    await api.setSetting('notifications', JSON.stringify(notif));
    setToast('Preferências de notificação salvas!');
  };

  const invite = async () => {
    if (!inviteForm.name || !inviteForm.email || !inviteForm.password) {
      setToast('Nome, e-mail e senha são obrigatórios');
      return;
    }
    const result = await api.register(inviteForm.name, inviteForm.email, inviteForm.password, inviteForm.role);
    if (result.success) {
      setUsers((p) => [...p, { ...result.user, status: 'ACTIVE' }]);
      setInviteModal(false);
      setInviteForm({ name: '', email: '', password: '', role: 'TECHNICIAN' });
      setToast(`Usuário ${inviteForm.email} criado com sucesso!`);
    } else {
      setToast(result.error || 'Erro ao criar usuário');
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
  const [editUserModal, setEditUserModal] = useState(null); // { id, name, email, role }

  const updateUser = async () => {
    if (!editUserModal) return;
    const payload = { name: editUserModal.name, role: editUserModal.role };
    if (editUserModal.newPassword?.trim()) payload.password = editUserModal.newPassword.trim();
    const r = await api.updateUser(editUserModal.id, payload);
    if (r.success) {
      setUsers((p) =>
        p.map((u) => (u.id === editUserModal.id ? { ...u, name: editUserModal.name, role: editUserModal.role } : u)),
      );
      setEditUserModal(null);
      setToast('Usuário atualizado!');
    } else {
      setToast(r.error || 'Erro ao atualizar usuário');
    }
  };

  const deactivateUser = async (id) => {
    const result = await api.deactivateUser(id);
    if (result.success) {
      setUsers((p) => p.map((u) => (u.id === id ? { ...u, status: 'INACTIVE' } : u)));
      setToast('Usuário desativado.');
    } else setToast(result.error || 'Erro ao desativar usuário');
  };

  const deleteUserPermanent = async (id) => {
    const result = await api.deleteUser(id);
    if (result.success) {
      setUsers((p) => p.filter((u) => u.id !== id));
      setDeleteConfirm(null);
      setToast('Usuário excluído permanentemente.');
    } else {
      setDeleteConfirm(null);
      setToast(result.error || 'Erro ao excluir usuário');
    }
  };

  const ROLE_LABEL = { ADMIN: 'Administrador', MANAGER: 'Gerente', TECHNICIAN: 'Técnico' };

  return (
    <div className="p-5 space-y-4">
      <div className="flex gap-1 border-b border-gray-200">
        {[
          ['company', 'Empresa'],
          ['tax', 'Tributação'],
          ['financial', 'Financeiro'],
          ['accounts', 'Contas e Saldos'],
          ['users', 'Usuários'],
          ['notifications', 'Notificações'],
          ['sla', 'SLA'],
        ].map(([id, lbl]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'company' && <CompanyTab company={company} saveCompany={saveCompany} setCompany={setCompany} />}

      {tab === 'tax' && (
        <TaxTab localStorage={localStorage} setTaxRegime={setTaxRegime} setToast={setToast} taxRegime={taxRegime} />
      )}

      {tab === 'financial' && (
        <FinancialSettingsTab
          bankAccounts={bankAccounts}
          expenseCats={expenseCats}
          incomeCats={incomeCats}
          newBank={newBank}
          newCat={newCat}
          newCatClass={newCatClass}
          newCatClassIn={newCatClassIn}
          newCatType={newCatType}
          newPay={newPay}
          payMethods={payMethods}
          setBankAccounts={setBankAccounts}
          setExpenseCats={setExpenseCats}
          setIncomeCats={setIncomeCats}
          setNewBank={setNewBank}
          setNewCat={setNewCat}
          setNewCatClass={setNewCatClass}
          setNewCatClassIn={setNewCatClassIn}
          setNewCatType={setNewCatType}
          setNewPay={setNewPay}
          setPayMethods={setPayMethods}
          setToast={setToast}
        />
      )}

      {tab === 'accounts' && (
        <AccountsTab
          addInvestment={addInvestment}
          bankAccounts={bankAccounts}
          initBalEdit={initBalEdit}
          investList={investList}
          investLoading={investLoading}
          newInvest={newInvest}
          saveInitBal={saveInitBal}
          savingBal={savingBal}
          setInitBalEdit={setInitBalEdit}
          setNewInvest={setNewInvest}
        />
      )}

      {tab === 'users' && (
        <UsersTab
          deactivateUser={deactivateUser}
          deleteConfirm={deleteConfirm}
          deleteUserPermanent={deleteUserPermanent}
          editUserModal={editUserModal}
          invite={invite}
          inviteForm={inviteForm}
          inviteModal={inviteModal}
          permissions={permissions}
          savePermissions={savePermissions}
          setDeleteConfirm={setDeleteConfirm}
          setEditUserModal={setEditUserModal}
          setInviteForm={setInviteForm}
          setInviteModal={setInviteModal}
          updateUser={updateUser}
          users={users}
        />
      )}

      {tab === 'notifications' && <NotificationsTab notif={notif} saveNotif={saveNotif} setNotif={setNotif} />}

      {tab === 'sla' && <SlaTab saveSla={saveSla} setSla={setSla} sla={sla} />}

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export { SettingsPage };
