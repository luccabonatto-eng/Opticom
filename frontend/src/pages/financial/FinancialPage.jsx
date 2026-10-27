import { useFinancialSetting } from './hooks/useFinancialSetting.js';
import { ReconciliationTab } from './tabs/ReconciliationTab.jsx';
import { ApprovalTab } from './tabs/ApprovalTab.jsx';
import { EXPENSE_CATS_INITIAL_OBJS, INCOME_CATS_INITIAL_OBJS, PAYROLL_INIT } from '../../config/financial.js';
import { Badge } from '../../components/Badge.jsx';
import { BulkSettlementModal } from './modals/BulkSettlementModal.jsx';
import { CardPaymentModal } from './modals/CardPaymentModal.jsx';
import { CardsTab } from './tabs/CardsTab.jsx';
import { CashFlowTab } from './tabs/CashFlowTab.jsx';
import { DateFilter } from './components/DateFilter.jsx';
import { DreTab } from './tabs/DreTab.jsx';
import { FIN_INFO } from './info.js';
import { ImportTransactionsModal } from './modals/ImportTransactionsModal.jsx';
import { PayableTab } from './tabs/PayableTab.jsx';
import { PayrollTab } from './tabs/PayrollTab.jsx';
import { ReceivableTab } from './tabs/ReceivableTab.jsx';
import { SettlementModal } from './modals/SettlementModal.jsx';
import { StatementTab } from './tabs/StatementTab.jsx';
import { Toast } from '../../components/Toast.jsx';
import { TransactionModal } from './modals/TransactionModal.jsx';
import { TxTable } from './components/TxTable.jsx';
import { addMeses, hojeISO } from '../../utils/dates.js';
import { api } from '../../api/client.js';
import { fmt, fmtDate } from '../../utils/format.js';
import { lerPlanilha, parseStatement, semAcento } from './parsers.js';
import { monthLabel, prevMonth } from './periods.js';
import {
  casaBusca,
  porVencimento,
  txAberto,
  txDue,
  txPago,
  txStatus as calcStatus,
  txVencido as calcVencido,
} from './calculations.js';
import { useEffect, useRef, useState } from 'react';

const FinancialPage = ({ taxRegime = 'REAL', finPerms }) => {
  const savingTx = useRef(false);
  const [txBusy, setTxBusy] = useState(false);
  const scopes = useFinancialSetting('financial_scopes', {});
  const [financialLoaded, setFinancialLoaded] = useState(false);
  const [tab, setTab] = useState('receivable');
  const [statusR, setStatusR] = useState('all');
  const [statusP, setStatusP] = useState('all');
  const [catR, setCatR] = useState('all');
  const [catP, setCatP] = useState('all');
  const [custR, setCustR] = useState('all');
  const [custP, setCustP] = useState('all');
  // filtros de data por aba
  const [dateFromR, setDateFromR] = useState('');
  const [dateToR, setDateToR] = useState('');
  const [dateFromP, setDateFromP] = useState('');
  const [dateToP, setDateToP] = useState('');
  const [dateFromCF, setDateFromCF] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [dateToCF, setDateToCF] = useState(() => {
    const d = new Date();
    const e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return e.toISOString().split('T')[0];
  });
  const [drePeriod, setDrePeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [dreBase, setDreBase] = useState('previsto'); // previsto (competência) | efetivo (caixa)
  const [dreViewMode, setDreViewMode] = useState('by_customer'); // 'by_customer' ou 'consolidated'
  const [dreCustomerFilter, setDreCustomerFilter] = useState('all');
  const [dreCustSearch, setDreCustSearch] = useState('');
  const [dreCustSort, setDreCustSort] = useState('profit_desc');
  const [dreCustStatusFilter, setDreCustStatusFilter] = useState('all');
  const [dreExpandedCust, setDreExpandedCust] = useState(null);
  const [dreTimeScope, setDreTimeScope] = useState('month'); // 'month' | 'year' | 'all'
  const [infoOpen, setInfoOpen] = useState(null);
  const [budPeriod, setBudPeriod] = useState('2026-03');
  const [approvalSel, setApprovalSel] = useState(new Set());
  const [selR, setSelR] = useState(new Set());
  const [selP, setSelP] = useState(new Set());
  const [qR, setQR] = useState('');
  const [qP, setQP] = useState('');
  // Tudo vazio até o banco responder: um número de demonstração aqui é lido
  // como saldo real por quem abre a tela.
  const [transactions, setTx] = useState([]);
  const [incomeCats, setIncomeCats] = useState(INCOME_CATS_INITIAL_OBJS);
  const [expenseCats, setExpenseCats] = useState(EXPENSE_CATS_INITIAL_OBJS);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [payMethods, setPayMethods] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [toast, setToast] = useState(null);
  const [newTxModal, setNewTxModal] = useState(false);
  const [editTxId, setEditTxId] = useState(null);
  const [settleModal, setSettleModal] = useState(null); // { tx, valor, data } da baixa em andamento
  const [bulkSettleModal, setBulkSettleModal] = useState(null); // { txs, data, setSel } da baixa em lote
  const [cardFiltro, setCardFiltro] = useState('all');
  const [faturaModal, setFaturaModal] = useState(null); // { pmId, nome, mes, compras, total, valorFatura, vencimento }
  const [newTx, setNewTx] = useState({
    type: 'INCOME',
    description: '',
    amount: '',
    due_date: '',
    status: 'PENDING',
    category_id: '',
    bank_account_id: '',
    payment_method_id: '',
    customer_id: '',
    invoice_number: '',
    repetir: 1,
    jaPago: false,
    paid_date: '',
  });

  useEffect(() => {
    loadFinancialData();
  }, []);
  const loadFinancialData = async () => {
    const [txRes, catRes, baRes, pmRes, techRes, custRes] = await Promise.all([
      api.getAllTransactions(),
      api.getCategories(),
      api.getBankAccounts(),
      api.getPaymentMethods(),
      api.getAllTechnicians(),
      api.getAllCustomers(),
    ]);
    if (txRes.success) { setTx(txRes.data?.data || txRes.data || []); setFinancialLoaded(true); }
    if (catRes.success) {
      if (catRes.data?.income) setIncomeCats(catRes.data.income);
      if (catRes.data?.expense) setExpenseCats(catRes.data.expense);
    }
    if (baRes.success) setBankAccounts(baRes.data?.data || baRes.data || []);
    if (pmRes.success) setPayMethods(pmRes.data?.data || pmRes.data || []);
    if (techRes.success) setPayTechs(techRes.data?.data || techRes.data || []);
    if (custRes.success) setCustomers(custRes.data?.data || custRes.data || []);
    if (!txRes.success) setToast(`Não foi possível carregar os lançamentos: ${txRes.error || 'erro de conexão'}`);
  };
  const [importModal, setImportModal] = useState(null);
  const [importText, setImportText] = useState('');
  const [importTab, setImportTab] = useState('arquivo'); // arquivo | colar
  const [importFileName, setImportFileName] = useState('');
  const [importDragging, setImportDragging] = useState(false);
  // Folha Salarial — estados no topo (hooks não podem ficar dentro de IIFE)
  // Folha fica no banco (system_settings), não no navegador: salário e CPF não
  // podem sumir ao limpar o cache nem ficar presos a uma máquina.
  // shortcut: a folha inteira é um único registro, então duas pessoas editando
  // ao mesmo tempo — a última salva vence. Virar tabela própria quando mais de
  // uma pessoa mexer na folha.
  const [payroll, setPayroll] = useState(PAYROLL_INIT);
  const [payrollLoaded, setPayrollLoaded] = useState(false);
  const [payrollRef, setPayrollRef] = useState(() => new Date().toISOString().slice(0, 7));
  const [payTechs, setPayTechs] = useState([]);
  useEffect(() => {
    api.getSetting('payroll').then((r) => {
      let doBanco = null;
      if (r.success && r.data?.value) {
        try {
          doBanco = JSON.parse(r.data.value);
        } catch {}
      }
      if (doBanco) {
        setPayroll(doBanco);
      } else {
        // Banco vazio: aproveita a folha que ficou no navegador desta máquina.
        // O efeito de gravação abaixo a envia, migrando sem perder nada.
        try {
          const local = localStorage.getItem('opticom_payroll');
          if (local) setPayroll(JSON.parse(local));
        } catch {}
      }
      setPayrollLoaded(true);
    });
  }, []);
  // Só grava depois de carregar, senão o estado inicial sobrescreve o banco
  useEffect(() => {
    if (!payrollLoaded) return;
    api.setSetting('payroll', JSON.stringify(payroll)).then((r) => {
      if (!r.success) setToast(`Erro ao salvar a folha: ${r.error}`);
    });
  }, [payroll, payrollLoaded]);
  const [payEmpModal, setPayEmpModal] = useState(null); // funcionário selecionado para ver detalhes
  const [newPayModal, setNewPayModal] = useState(false);
  const [editPayModal, setEditPayModal] = useState(null); // funcionário em edição
  const [editPayForm, setEditPayForm] = useState({});
  const [payForm, setPayForm] = useState({
    techId: '',
    name: '',
    role: 'Técnico de Campo',
    cpf: '',
    admDate: '',
    base: '',
    horasExtras: '',
    adicNoturno: '',
    periculosidade: '',
    insalubridade: '',
    bonus: '',
    vt: '',
    vr: '',
    planoSaude: '',
  });
  // Extrato Bancário
  const [stmtLines, setStmtLines] = useState([]);
  const [stmtResults, setStmtResults] = useState({});
  const [stmtCats, setStmtCats] = useState({});
  const [stmtFileName, setStmtFileName] = useState('');
  const [stmtDragging, setStmtDragging] = useState(false);
  const [stmtBankAccountId, setStmtBankAccountId] = useState('');
  const [stmtProgresso, setStmtProgresso] = useState(null); // { feito, total } durante a importação

  // abre o modal de edição pré-preenchido com os dados atuais do funcionário
  const openEditPay = (emp) => {
    const c = (v) => (v ? (v / 100).toFixed(2) : '');
    setEditPayForm({
      name: emp.name,
      role: emp.role,
      cpf: emp.cpf || '',
      admDate: emp.admDate || '',
      base: c(emp.base),
      horasExtras: c(emp.horasExtras),
      adicNoturno: c(emp.adicNoturno),
      periculosidade: c(emp.periculosidade),
      insalubridade: c(emp.insalubridade),
      bonus: c(emp.bonus),
      vt: c(emp.vt),
      vr: c(emp.vr),
      planoSaude: c(emp.planoSaude),
      dINSS: c(emp.dINSS),
      dIRRF: c(emp.dIRRF),
      dVT: c(emp.dVT),
      dPlano: c(emp.dPlano),
      inssPatronal: c(emp.inssPatronal),
      fgts: c(emp.fgts),
      rat: c(emp.rat),
      sistemaS: c(emp.sistemaS),
      prov13: c(emp.prov13),
      provFerias: c(emp.provFerias),
      fgtsProv: c(emp.fgtsProv),
    });
    setEditPayModal(emp);
  };

  const saveEditPay = () => {
    const n = (k, d = 0) => Math.round(parseFloat(editPayForm[k] || d) * 100);
    const updated = {
      ...editPayModal,
      name: editPayForm.name.trim(),
      role: editPayForm.role,
      cpf: editPayForm.cpf,
      admDate: editPayForm.admDate,
      base: n('base'),
      horasExtras: n('horasExtras'),
      adicNoturno: n('adicNoturno'),
      periculosidade: n('periculosidade'),
      insalubridade: n('insalubridade'),
      bonus: n('bonus'),
      vt: n('vt'),
      vr: n('vr'),
      planoSaude: n('planoSaude'),
      dINSS: n('dINSS'),
      dIRRF: n('dIRRF'),
      dVT: n('dVT'),
      dPlano: n('dPlano'),
      inssPatronal: n('inssPatronal'),
      fgts: n('fgts'),
      rat: n('rat'),
      sistemaS: n('sistemaS'),
      prov13: n('prov13'),
      provFerias: n('provFerias'),
      fgtsProv: n('fgtsProv'),
    };
    setPayroll((prev) => prev.map((p) => (p.id === editPayModal.id ? updated : p)));
    setPayEmpModal(updated); // atualiza o holerite aberto com os novos dados
    setEditPayModal(null);
    setToast(`Dados de ${updated.name} atualizados!`);
  };

  // ── Extrato Bancário — parsers e matching ─────────────────────────────────
  // Converte string monetária → centavos (inteiro), igual à convenção do DB.

  const loadStmtFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = parseStatement(e.target.result, file.name);
      setStmtLines(lines);
      setStmtResults({});
      setStmtCats({});
      setStmtFileName(file.name);
    };
    reader.readAsText(file, 'utf-8');
  };
  // Linha de extrato é movimento que já aconteceu no banco: entra quitada, com
  // o efetivo preenchido. Sem amount_paid ela apareceria como 100% em aberto.
  const dadosDaLinha = (line, catId) => ({
    type: line.type === 'CREDIT' ? 'INCOME' : 'EXPENSE',
    description: line.description,
    amount: line.amount,
    amount_paid: line.amount,
    due_date: line.date,
    paid_date: line.date,
    status: line.type === 'CREDIT' ? 'RECEIVED' : 'PAID',
    category_id: catId,
    bank_account_id: stmtBankAccountId || null,
  });

  const importStmtLine = async (line) => {
    const catId = stmtCats[line.id];
    if (!catId) {
      setToast('Selecione uma categoria antes de importar');
      return;
    }
    const r = await api.createTransaction(dadosDaLinha(line, catId));
    if (r.success) {
      const tx = r.data?.data || r.data;
      setTx((p) => [tx, ...p]);
      setStmtResults((p) => ({ ...p, [line.id]: { action: 'imported' } }));
      setToast(`Lançamento criado: ${line.description.slice(0, 40)}`);
    } else {
      setToast(r.error || 'Erro ao criar lançamento');
    }
  };

  const importAllStmt = async () => {
    const pending = stmtLines.filter((l) => !stmtResults[l.id]?.action && stmtCats[l.id]);
    if (!pending.length) {
      setToast('Nenhuma linha com categoria selecionada');
      return;
    }

    // Antes cada linha disparava três atualizações de estado, e cada uma
    // recalculava a página inteira sobre a lista de lançamentos crescendo.
    // Com algumas dezenas de linhas a tela parecia travada. Agora o estado é
    // tocado uma vez no fim, e o progresso aparece a cada 5 linhas.
    setStmtProgresso({ feito: 0, total: pending.length });
    const criados = [];
    const resultados = {};
    const erros = [];

    for (let i = 0; i < pending.length; i++) {
      const line = pending[i];
      const r = await api.createTransaction(dadosDaLinha(line, stmtCats[line.id]));
      if (r.success) {
        criados.push(r.data?.data || r.data);
        resultados[line.id] = { action: 'imported' };
      } else {
        erros.push(`${line.description.slice(0, 30)}: ${r.error}`);
        resultados[line.id] = { action: 'erro', msg: r.error };
      }
      if (i % 5 === 4) setStmtProgresso({ feito: i + 1, total: pending.length });
    }

    setTx((p) => [...criados, ...p]);
    setStmtResults((p) => ({ ...p, ...resultados }));
    setStmtProgresso(null);
    setToast(
      erros.length === 0
        ? `${criados.length} lançamento(s) importado(s)!`
        : `${criados.length} importado(s), ${erros.length} falharam — ${erros[0]}`,
    );
  };
  const ignoreStmt = (id) => setStmtResults((p) => ({ ...p, [id]: { action: 'ignore' } }));

  // helper reutilizável de filtro de data

  const InfoBtn = ({ id }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setInfoOpen(id);
      }}
      className="flex-shrink-0 w-5 h-5 rounded-full bg-white/60 hover:bg-white border border-gray-300 text-gray-400 hover:text-blue-600 hover:border-blue-400 flex items-center justify-center transition-colors text-xs font-bold leading-none"
      title="Saiba mais"
    >
      ⓘ
    </button>
  );

  const InfoModal = () => {
    const info = infoOpen ? FIN_INFO[infoOpen] : null;
    if (!info) return null;
    return (
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        onClick={() => setInfoOpen(null)}
      >
        <div
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-bold text-gray-800">{info.title}</h3>
            <button
              onClick={() => setInfoOpen(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none mt-0.5"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{info.desc}</p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">Cálculo</p>
            <p className="text-sm text-blue-800 font-mono leading-relaxed">{info.calc}</p>
          </div>
        </div>
      </div>
    );
  };

  // períodos para Orçado vs Real

  // Baixa: abre o modal já com o saldo em aberto preenchido, para quitar
  // integralmente continuar sendo dois cliques.
  const settle = (id) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    // A data vinha fixa em "hoje". Quem lança o movimento do dia seguinte
    // gravava toda baixa com a data errada, e o caixa saía do lugar.
    setSettleModal({ tx, valor: (txAberto(tx) / 100).toFixed(2), data: hojeISO() });
  };

  // Desfaz a baixa por inteiro. Sem isso, errar o valor só se resolvia
  // excluindo o lançamento e perdendo o histórico.
  const estornarBaixa = async (tx) => {
    if (!window.confirm(`Estornar a baixa de "${tx.description}"? O valor volta todo para "em aberto".`)) return;
    const r = await api.updateTransaction(tx.id, { amount_paid: 0, status: 'PENDING', paid_date: null });
    if (!r.success) {
      setToast(`Erro ao estornar: ${r.error}`);
      return;
    }
    setTx((prev) =>
      prev.map((t) => (t.id !== tx.id ? t : { ...t, amount_paid: 0, status: 'PENDING', paid_date: null })),
    );
    setToast(`Baixa estornada — ${fmt(tx.amount)} voltou para em aberto.`);
  };

  const abrirBaixaLote = (ids, setSel) => {
    const txs = ids.map((id) => transactions.find((t) => t.id === id)).filter((t) => t && txAberto(t) > 0);
    if (!txs.length) {
      setToast('Nenhum dos selecionados tem saldo em aberto.');
      return;
    }
    setBulkSettleModal({ txs, data: hojeISO(), setSel });
  };

  // Baixa em lote quita integralmente — para valor parcial, uma de cada vez.
  const confirmBulkSettle = async () => {
    const { txs, data, setSel } = bulkSettleModal;
    if (!data) {
      setToast('Informe a data');
      return;
    }
    const results = await Promise.all(
      txs.map((t) =>
        api
          .updateTransaction(t.id, {
            amount_paid: t.amount,
            status: t.type === 'INCOME' ? 'RECEIVED' : 'PAID',
            paid_date: data,
          })
          .then((r) => ({ id: t.id, ok: r.success })),
      ),
    );
    const okIds = new Set(results.filter((r) => r.ok).map((r) => r.id));
    setTx((prev) =>
      prev.map((t) =>
        okIds.has(t.id)
          ? { ...t, amount_paid: t.amount, status: t.type === 'INCOME' ? 'RECEIVED' : 'PAID', paid_date: data }
          : t,
      ),
    );
    setSel(new Set());
    setBulkSettleModal(null);
    const falhas = txs.length - okIds.size;
    setToast(
      falhas === 0 ? `${okIds.size} lançamento(s) baixado(s).` : `${okIds.size} baixado(s), ${falhas} falharam.`,
    );
  };

  // Paga a fatura: um único lançamento de saída (classe PAGAMENTO_CARTAO, que o
  // DRE ignora porque a despesa já veio nas compras) e baixa das compras.
  const pagarFatura = async () => {
    const { pmId, nome, mes, compras, aberto, valorFatura, vencimento } = faturaModal;
    const valorCents = Math.round(parseFloat(String(valorFatura).replace(',', '.')) * 100);
    if (!Number.isFinite(valorCents) || valorCents <= 0) {
      setToast('Informe o valor da fatura');
      return;
    }
    if (!vencimento) {
      setToast('Informe a data de pagamento');
      return;
    }

    // A tela de Configurações não permite escolher classe contábil, então a
    // categoria de quitação é criada na primeira vez, já com a classe certa.
    let catPag = expenseCats.find((c) => c.accounting_class === 'PAGAMENTO_CARTAO');
    if (!catPag) {
      const nova = await api.createCategory('expense', {
        name: 'Pagamento de Cartão',
        accounting_class: 'PAGAMENTO_CARTAO',
      });
      if (!nova.success) {
        setToast(`Erro ao criar a categoria de quitação: ${nova.error}`);
        return;
      }
      catPag = nova.data?.data || nova.data;
      setExpenseCats((p) => [...p, catPag]);
    }

    const r = await api.createTransaction({
      type: 'EXPENSE',
      status: 'PAID',
      amount: valorCents,
      amount_paid: valorCents,
      description: `Fatura ${nome} — ${monthLabel(mes)}`,
      due_date: vencimento,
      paid_date: vencimento,
      category_id: catPag.id,
      payment_method_id: null,
    });
    if (!r.success) {
      setToast(`Erro ao lançar a fatura: ${r.error}`);
      return;
    }

    // As compras saem do "em aberto"; quem representa o caixa é o lançamento acima
    const baixas = await Promise.all(
      compras
        .filter((t) => txAberto(t) > 0)
        .map((t) =>
          api
            .updateTransaction(t.id, { amount_paid: t.amount, status: 'PAID', paid_date: vencimento })
            .then((res) => ({ id: t.id, ok: res.success })),
        ),
    );
    const okIds = new Set(baixas.filter((b) => b.ok).map((b) => b.id));
    setTx((prev) => [
      r.data,
      ...prev.map((t) =>
        okIds.has(t.id) ? { ...t, amount_paid: t.amount, status: 'PAID', paid_date: vencimento } : t,
      ),
    ]);
    setFaturaModal(null);
    const dif = valorCents - aberto;
    setToast(
      dif === 0
        ? `Fatura ${nome} paga: ${fmt(valorCents)}`
        : `Fatura paga: ${fmt(valorCents)} · divergência de ${fmt(Math.abs(dif))} ${dif > 0 ? 'a mais que o lançado' : 'a menos que o lançado'}`,
    );
  };

  const confirmSettle = async () => {
    const { tx, valor, data } = settleModal;
    const valorCents = Math.round(parseFloat(String(valor).replace(',', '.')) * 100);
    if (!Number.isFinite(valorCents) || valorCents <= 0) {
      setToast('Informe um valor válido');
      return;
    }
    if (valorCents > txAberto(tx)) {
      setToast(`Valor acima do saldo em aberto (${fmt(txAberto(tx))})`);
      return;
    }
    if (!data) {
      setToast('Informe a data do pagamento');
      return;
    }

    const novoPago = txPago(tx) + valorCents;
    const quitou = novoPago >= (tx.amount || 0);
    const novoStatus = quitou ? (tx.type === 'INCOME' ? 'RECEIVED' : 'PAID') : 'PARTIAL';

    const result = await api.updateTransaction(tx.id, { amount_paid: novoPago, status: novoStatus, paid_date: data });
    if (result.success) {
      setTx((prev) =>
        prev.map((t) => (t.id !== tx.id ? t : { ...t, amount_paid: novoPago, status: novoStatus, paid_date: data })),
      );
      setSettleModal(null);
      const verbo = tx.type === 'INCOME' ? 'Recebimento' : 'Pagamento';
      setToast(
        quitou
          ? `${verbo} quitado!`
          : `${verbo} parcial de ${fmt(valorCents)} — restam ${fmt((tx.amount || 0) - novoPago)}`,
      );
    } else {
      setToast(`Erro: ${result.error}`);
    }
  };
  const addTx = async () => {
    if (savingTx.current) return;
    savingTx.current = true; setTxBusy(true);
    try {
    if (!newTx.description) {
      setToast('Descrição é obrigatória');
      return;
    }
    if (!newTx.amount || parseFloat(newTx.amount) <= 0) {
      setToast('Informe um valor válido');
      return;
    }
    if (!newTx.due_date) {
      setToast('Data de vencimento é obrigatória');
      return;
    }
    const vezes = Math.min(Math.max(parseInt(newTx.repetir) || 1, 1), 60);
    if (newTx.jaPago && !newTx.paid_date) {
      setToast('Informe a data do pagamento');
      return;
    }
    if (!scopes.ready) { setToast('Aguarde a classificação carregar ou recarregue a página.'); return; }
    const persistScope = async (ids) => {
      if (!scopes.ready) return true;
      const next = { ...scopes.data };
      ids.forEach(id => { if (!newTx.customer_id && newTx.allocation === 'general') next[id] = 'general'; else delete next[id]; });
      return JSON.stringify(next) === JSON.stringify(scopes.data) || scopes.save(next);
    };
    const payload = {
      type: newTx.type,
      description: newTx.description,
      amount: Math.round(parseFloat(newTx.amount) * 100),
      due_date: newTx.due_date,
      category_id: newTx.category_id || null,
      bank_account_id: newTx.bank_account_id || null,
      payment_method_id: newTx.payment_method_id || null,
      customer_id: newTx.customer_id || null,
      invoice_number: newTx.type === 'INCOME' ? newTx.invoice_number || null : null,
    };
    const resetForm = () =>
      setNewTx({
        type: 'EXPENSE',
        description: '',
        amount: '',
        due_date: '',
        status: 'PENDING',
        category_id: '',
        bank_account_id: '',
        payment_method_id: '',
        customer_id: '',
        invoice_number: '',
        repetir: 1,
        jaPago: false,
        paid_date: '',
      });
    if (editTxId) {
      const original = transactions.find(t => t.id === editTxId);
      if (original && txPago(original) > 0) {
        if (!newTx.paid_date) { setToast('Informe a data da baixa.'); return; }
        payload.paid_date = newTx.paid_date;
      }
      // O status não é editável à mão: ele vem da baixa. Marcar "Pago" aqui
      // deixava amount_paid em zero — selo verde com o valor todo em aberto.
      const result = await api.updateTransaction(editTxId, payload);
      if (result.success) {
        setTx((prev) => prev.map((t) => (t.id === editTxId ? result.data : t)));
        setNewTxModal(false);
        setEditTxId(null);
        resetForm();
        const classified = await persistScope([editTxId]);
        setToast(classified ? 'Lançamento atualizado!' : 'Lançamento salvo, mas a classificação não foi salva. Confira no DRE geral.');
      } else {
        setToast(`Erro ao atualizar lançamento: ${result.error}`);
      }
    } else {
      // Uma parcela por mês a partir do vencimento informado. O valor digitado é
      // o de CADA parcela — é o que vem no boleto, e evita a ambiguidade entre
      // "repete 500 todo mês" e "3000 divididos em 6x".
      // shortcut: só periodicidade mensal; abrir semanal/quinzenal se aparecer.
      const quitado = newTx.jaPago;
      const pedidos = Array.from({ length: vezes }, (_, i) => ({
        ...payload,
        description: vezes > 1 ? `${payload.description} (${i + 1}/${vezes})` : payload.description,
        due_date: i === 0 ? payload.due_date : addMeses(payload.due_date, i),
        status: quitado ? (newTx.type === 'INCOME' ? 'RECEIVED' : 'PAID') : 'PENDING',
        amount_paid: quitado ? payload.amount : 0,
        paid_date: quitado ? newTx.paid_date : null,
      }));
      const results = await Promise.all(pedidos.map((p) => api.createTransaction(p)));
      const criados = results.filter((r) => r.success).map((r) => r.data);
      const falhas = results.length - criados.length;
      if (criados.length) setTx((prev) => [...criados, ...prev]);
      const classified = criados.length ? await persistScope(criados.map(t => t.id)) : true;
      if (falhas === results.length) {
        setToast(`Erro ao criar lançamento: ${results[0].error}`);
      } else {
        setNewTxModal(false);
        resetForm();
        setToast(
          !classified ? 'Lançamentos salvos, mas a classificação não foi salva. Confira no DRE geral.' : falhas === 0
            ? vezes > 1
              ? `${vezes} parcelas criadas!`
              : 'Lançamento criado!'
            : `${criados.length} criado(s), ${falhas} falharam.`,
        );
      }
    }
    } finally { savingTx.current = false; setTxBusy(false); }
  };
  const openEditTx = (tx) => {
    setEditTxId(tx.id);
    setNewTx({
      type: tx.type,
      description: tx.description || '',
      amount: tx.amount != null ? (tx.amount / 100).toFixed(2) : '',
      due_date: tx.due_date || '',
      status: tx.status || 'PENDING',
      category_id: tx.category_id || '',
      bank_account_id: tx.bank_account_id || '',
      payment_method_id: tx.payment_method_id || '',
      customer_id: tx.customer_id || '',
      allocation: !tx.customer_id && scopes.data[tx.id] === 'general' ? 'general' : '',
      invoice_number: tx.invoice_number || '',
      repetir: 1,
      jaPago: false,
      paid_date: tx.paid_date || '',
      hasPayment: txPago(tx) > 0,
    });
    setNewTxModal(true);
  };
  const deleteTx = async (id) => {
    if (!window.confirm('Excluir este lançamento permanentemente? Essa ação não pode ser desfeita.')) return;
    const result = await api.deleteTransaction(id);
    if (result.success) {
      setTx((prev) => prev.filter((t) => t.id !== id));
      setToast('Lançamento excluído.');
    } else {
      setToast(`Erro ao excluir: ${result.error}`);
    }
  };
  const bulkDeleteTx = async (ids, setSel) => {
    if (!ids.length) return;
    if (!window.confirm(`Excluir ${ids.length} lançamento(s) permanentemente? Essa ação não pode ser desfeita.`))
      return;
    const results = await Promise.all(ids.map((id) => api.deleteTransaction(id)));
    const okIds = ids.filter((id, i) => results[i].success);
    const failCount = ids.length - okIds.length;
    setTx((prev) => prev.filter((t) => !okIds.includes(t.id)));
    setSel(new Set());
    setToast(
      failCount === 0
        ? `${okIds.length} lançamento(s) excluído(s).`
        : `${okIds.length} excluído(s), ${failCount} falharam.`,
    );
  };

  // Separa colunas respeitando aspas: num CSV por vírgula o valor brasileiro
  // vem como "1.234,56", e a vírgula de dentro das aspas não separa coluna.

  // Qual caractere separa colunas neste arquivo. Conta só fora das aspas, senão
  // a vírgula decimal de "1.234,56" venceria a contagem.
  // shortcut: arquivo por vírgula com decimal brasileiro SEM aspas é ambíguo
  // (1.234,56 é indistinguível de duas colunas); peça ; ou aspas nesse caso.

  // Excel pt-BR costuma salvar CSV em windows-1252; lido como UTF-8 os acentos
  // viram caracteres quebrados. Relê nesse caso.
  const loadImportFile = (file) => {
    if (!file) return;
    setImportFileName(file.name);
    const ler = (encoding) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const txt = e.target.result;
        if (encoding === 'utf-8' && txt.includes('�')) return ler('windows-1252');
        setImportText(txt.trim());
      };
      reader.readAsText(file, encoding);
    };
    ler('utf-8');
  };

  // Localiza as colunas pelo nome do cabeçalho. Sistemas diferentes exportam em
  // ordens diferentes, então posição fixa só funcionaria para um formato.

  // dd/mm/aaaa (ou dd-mm-aa) para o formato que o backend exige

  // Uma única leitura, usada pela prévia e pela importação, para as duas não
  // divergirem. Status do arquivo é ignorado: tudo entra pendente, para passar
  // pela fila de Aprovações.

  const parseImport = async () => {
    const cats = importModal === 'INCOME' ? incomeCats : expenseCats;
    const rows = lerPlanilha(importText).filter((r) => r.amount > 0);
    let created = 0;
    for (const r of rows) {
      // Categoria só é vinculada quando já existe com esse nome; as demais
      // ficam em branco para classificação posterior.
      const match = cats.find((c) => semAcento(c.name || c) === semAcento(r.catName));
      const result = await api.createTransaction({
        type: r.tipo || importModal,
        status: 'PENDING',
        description: r.description,
        amount: r.amount,
        due_date: r.due_date,
        category_id: match?.id || null,
      });
      if (result.success) {
        setTx((prev) => [result.data, ...prev]);
        created++;
      }
    }
    setImportModal(null);
    setImportText('');
    setImportFileName('');
    setToast(
      created === rows.length
        ? `${created} lançamento(s) importado(s)!`
        : `${created} de ${rows.length} importado(s) — ${rows.length - created} falharam`,
    );
  };

  const projectedFlow = () => {
    const now = new Date();
    const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const from = dateFromCF || defaultFrom;
    const to = dateToCF || defaultTo;
    const days = [];
    const cur = new Date(from);
    const end = new Date(to);
    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0];
      const dd = dateStr.slice(8, 10) + '/' + dateStr.slice(5, 7);
      const ins = transactions
        .filter((t) => t.type === 'INCOME' && txDue(t) === dateStr)
        .reduce((s, t) => s + t.amount, 0);
      const outs = transactions
        .filter((t) => t.type === 'EXPENSE' && txDue(t) === dateStr)
        .reduce((s, t) => s + t.amount, 0);
      if (ins > 0 || outs > 0) days.push({ date: dd, dateStr, ins, outs, diff: ins - outs });
      cur.setDate(cur.getDate() + 1);
    }
    days.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    let running = bankAccounts.reduce((s, b) => s + (b.initial_balance || 0), 0);
    return days.map((d) => {
      running += d.diff;
      return { ...d, balance: running };
    });
  };

  const TxTableComponent = (props) => (
    <TxTable
      customers={customers}
      bankAccounts={bankAccounts}
      payMethods={payMethods}
      txCatName={txCatName}
      txStatus={txStatus}
      txDue={txDue}
      txPago={txPago}
      txAberto={txAberto}
      estornarBaixa={estornarBaixa}
      openEditTx={openEditTx}
      deleteTx={deleteTx}
      {...props}
    />
  );

  // Previsto x efetivo. amount é o valor da conta e não muda com as baixas;
  // amount_paid é quanto entrou/saiu de fato. Lançamentos criados antes da
  // baixa parcial não têm amount_paid, então quitados contam valor cheio.

  const totalIn = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const pendingIn = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + txAberto(t), 0);
  const pendingOut = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + txAberto(t), 0);

  // ── Cartão de crédito ───────────────────────────────────────────────────
  // A compra no cartão é despesa no ato (vai pro DRE, com cliente e categoria),
  // mas não é saída de caixa: o dinheiro só sai quando a fatura é paga. Por
  // isso compras de cartão ficam fora de A Pagar, das Aprovações e do fluxo de
  // caixa — quem entra no caixa é o pagamento da fatura.
  const ehCartao = (pmId) => {
    const nome = payMethods.find((m) => m.id === pmId)?.name || '';
    return /cart[aã]o/i.test(nome);
  };
  const ehCompraCartao = (t) => t.type === 'EXPENSE' && ehCartao(t.payment_method_id);
  // Fatura a que a compra pertence: competência pelo mês da compra

  const txCatName = (t) => incomeCats.concat(expenseCats).find((c) => c.id === t.category_id)?.name || t.cat || '—';
  const txClasse = (t) =>
    incomeCats.concat(expenseCats).find((c) => c.id === t.category_id)?.accounting_class ||
    (t.type === 'INCOME' ? 'OUTRAS_RECEITAS' : 'OUTRAS_DESPESAS');

  const TODAY = new Date().toISOString().split('T')[0];
  // Fixam a data de hoje; as regras em si vivem em calculations.js.
  const txVencido = (t) => calcVencido(t, TODAY);
  const txStatus = (t) => calcStatus(t, TODAY);

  const receivable = transactions
    .filter(
      (t) =>
        t.type === 'INCOME' &&
        (statusR === 'all' || txStatus(t) === statusR) &&
        (catR === 'all' || txCatName(t) === catR) &&
        (custR === 'all' || (custR === '__sem_cliente__' ? !t.customer_id : String(t.customer_id) === String(custR))) &&
        (!dateFromR || txDue(t) >= dateFromR) &&
        (!dateToR || txDue(t) <= dateToR) &&
        casaBusca(t, qR),
    )
    .sort(porVencimento);
  const payable = transactions
    .filter(
      (t) =>
        t.type === 'EXPENSE' &&
        !ehCompraCartao(t) &&
        (statusP === 'all' || txStatus(t) === statusP) &&
        (catP === 'all' || txCatName(t) === catP) &&
        (custP === 'all' || (custP === '__sem_cliente__' ? !t.customer_id : String(t.customer_id) === String(custP))) &&
        (!dateFromP || txDue(t) >= dateFromP) &&
        (!dateToP || txDue(t) <= dateToP) &&
        casaBusca(t, qP),
    )
    .sort(porVencimento);

  const approvalQueue = transactions.filter((t) => !ehCompraCartao(t) && txAberto(t) > 0 && txDue(t) <= TODAY);

  const ALL_MENU_ITEMS = [
    {
      id: 'approval',
      label: 'Aprovações do Dia',
      icon: '✓',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      badge: approvalQueue.length,
    },
    { id: 'receivable', label: 'A Receber', icon: '↑', color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'payable', label: 'A Pagar', icon: '↓', color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'cashflow', label: 'Fluxo de Caixa', icon: '~', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'dre', label: 'DRE Gerencial', icon: '≡', color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'payroll', label: 'Folha Salarial', icon: '$', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { id: 'card', label: 'Cartão de Crédito', icon: '▭', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
    { id: 'expcard', label: 'Cartão de Despesa', icon: '▬', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'reconciliation', label: 'Conciliação Bancária', icon: '✓', color: 'text-teal-600', bg: 'bg-teal-50' },
    { id: 'statement', label: 'Extrato Bancário', icon: '⇅', color: 'text-teal-600', bg: 'bg-teal-50' },
  ];
  const allowedFinSet = finPerms ? new Set(finPerms) : null;
  const MENU_ITEMS = allowedFinSet ? ALL_MENU_ITEMS.filter((m) => allowedFinSet.has(m.id)) : ALL_MENU_ITEMS;
  useEffect(() => {
    if (MENU_ITEMS.length > 0 && !MENU_ITEMS.find((m) => m.id === tab)) setTab(MENU_ITEMS[0].id);
  }, [finPerms]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Side menu */}
      <div className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col py-3">
        <div className="px-4 pb-3 border-b border-gray-100 mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Financeiro</p>
        </div>
        {MENU_ITEMS.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setTab(m.id);
              setCardFiltro('all');
            }}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors mx-2 rounded-lg ${tab === m.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <span
              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${tab === m.id ? 'bg-white/20 text-white' : m.color + ' ' + m.bg}`}
            >
              {m.icon}
            </span>
            <span className="flex-1 text-left">{m.label}</span>
            {m.badge > 0 && (
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === m.id ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}
              >
                {m.badge}
              </span>
            )}
          </button>
        ))}
        <div className="mt-auto px-4 pt-3 border-t border-gray-100 space-y-2">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-600">A Receber</p>
            <p className="text-sm font-bold text-green-700">{fmt(pendingIn)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs text-red-600">A Pagar</p>
            <p className="text-sm font-bold text-red-700">{fmt(pendingOut)}</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {tab === 'receivable' && (
          <ReceivableTab
            DateFilter={DateFilter}
            TxTable={TxTableComponent}
            abrirBaixaLote={abrirBaixaLote}
            bulkDeleteTx={bulkDeleteTx}
            catR={catR}
            custR={custR}
            customers={customers}
            dateFromR={dateFromR}
            dateToR={dateToR}
            incomeCats={incomeCats}
            qR={qR}
            receivable={receivable}
            selR={selR}
            setCatR={setCatR}
            setCustR={setCustR}
            setDateFromR={setDateFromR}
            setDateToR={setDateToR}
            setEditTxId={setEditTxId}
            setImportModal={setImportModal}
            setNewTx={setNewTx}
            setNewTxModal={setNewTxModal}
            setQR={setQR}
            setSelR={setSelR}
            setStatusR={setStatusR}
            settle={settle}
            statusR={statusR}
            txVencido={txVencido}
          />
        )}

        {tab === 'payable' && (
          <PayableTab
            DateFilter={DateFilter}
            TxTable={TxTableComponent}
            abrirBaixaLote={abrirBaixaLote}
            bulkDeleteTx={bulkDeleteTx}
            catP={catP}
            custP={custP}
            customers={customers}
            dateFromP={dateFromP}
            dateToP={dateToP}
            expenseCats={expenseCats}
            payable={payable}
            qP={qP}
            selP={selP}
            setCatP={setCatP}
            setCustP={setCustP}
            setDateFromP={setDateFromP}
            setDateToP={setDateToP}
            setEditTxId={setEditTxId}
            setImportModal={setImportModal}
            setNewTx={setNewTx}
            setNewTxModal={setNewTxModal}
            setQP={setQP}
            setSelP={setSelP}
            setStatusP={setStatusP}
            settle={settle}
            statusP={statusP}
            txVencido={txVencido}
          />
        )}

        {tab === 'cashflow' && (
          <CashFlowTab
            DateFilter={DateFilter}
            InfoBtn={InfoBtn}
            bankAccounts={bankAccounts}
            dateFromCF={dateFromCF}
            dateToCF={dateToCF}
            ehCompraCartao={ehCompraCartao}
            expenseCats={expenseCats}
            incomeCats={incomeCats}
            monthLabel={monthLabel}
            projectedFlow={projectedFlow}
            setDateFromCF={setDateFromCF}
            setDateToCF={setDateToCF}
            transactions={transactions}
          />
        )}

        {tab === 'dre' && (
          <DreTab financialLoaded={financialLoaded} scopes={scopes} openEditTx={openEditTx}
            InfoBtn={InfoBtn}
            customers={customers}
            dreBase={dreBase}
            dreCustSearch={dreCustSearch}
            dreCustSort={dreCustSort}
            dreCustStatusFilter={dreCustStatusFilter}
            dreCustomerFilter={dreCustomerFilter}
            dreExpandedCust={dreExpandedCust}
            drePeriod={drePeriod}
            dreTimeScope={dreTimeScope}
            dreViewMode={dreViewMode}
            expenseCats={expenseCats}
            incomeCats={incomeCats}
            monthLabel={monthLabel}
            prevMonth={prevMonth}
            setDreBase={setDreBase}
            setDreCustSearch={setDreCustSearch}
            setDreCustSort={setDreCustSort}
            setDreCustStatusFilter={setDreCustStatusFilter}
            setDreCustomerFilter={setDreCustomerFilter}
            setDreExpandedCust={setDreExpandedCust}
            setDrePeriod={setDrePeriod}
            setDreTimeScope={setDreTimeScope}
            setDreViewMode={setDreViewMode}
            transactions={transactions}
            txCatName={txCatName}
          />
        )}

        {tab === 'payroll' && (
          <PayrollTab
            Boolean={Boolean}
            editPayForm={editPayForm}
            editPayModal={editPayModal}
            newPayModal={newPayModal}
            openEditPay={openEditPay}
            payEmpModal={payEmpModal}
            payForm={payForm}
            payTechs={payTechs}
            payroll={payroll}
            payrollRef={payrollRef}
            saveEditPay={saveEditPay}
            setEditPayForm={setEditPayForm}
            setEditPayModal={setEditPayModal}
            setNewPayModal={setNewPayModal}
            setPayEmpModal={setPayEmpModal}
            setPayForm={setPayForm}
            setPayTechs={setPayTechs}
            setPayroll={setPayroll}
            setPayrollRef={setPayrollRef}
            setToast={setToast}
          />
        )}

        {tab === 'approval' && (
          <ApprovalTab
            Promise={Promise}
            approvalQueue={approvalQueue}
            approvalSel={approvalSel}
            bankAccounts={bankAccounts}
            payMethods={payMethods}
            setApprovalSel={setApprovalSel}
            setToast={setToast}
            setTx={setTx}
            transactions={transactions}
            txCatName={txCatName}
            txVencido={txVencido}
          />
        )}

        {(tab === 'card' || tab === 'expcard') && (
          <CardsTab
            cardFiltro={cardFiltro}
            customers={customers}
            ehCompraCartao={ehCompraCartao}
            monthLabel={monthLabel}
            openEditTx={openEditTx}
            payMethods={payMethods}
            setCardFiltro={setCardFiltro}
            setEditTxId={setEditTxId}
            setFaturaModal={setFaturaModal}
            setNewTx={setNewTx}
            setNewTxModal={setNewTxModal}
            setToast={setToast}
            tab={tab}
            transactions={transactions}
            txCatName={txCatName}
            txClasse={txClasse}
          />
        )}

        {tab === 'reconciliation' && (
          <ReconciliationTab transactions={transactions} financialLoaded={financialLoaded} bankAccounts={bankAccounts} openEditTx={openEditTx} onCreate={(line, bankId) => {
            setEditTxId(null);
            setNewTx({ type: line.type === 'CREDIT' ? 'INCOME' : 'EXPENSE', description: line.description, amount: (line.amount / 100).toFixed(2), due_date: line.date, paid_date: line.date, jaPago: true, repetir: 1, customer_id: '', allocation: '', category_id: '', payment_method_id: '', bank_account_id: bankId, invoice_number: '' });
            setNewTxModal(true);
          }} />
        )}
        {tab === 'statement' && (
          <StatementTab
            bankAccounts={bankAccounts}
            expenseCats={expenseCats}
            ignoreStmt={ignoreStmt}
            importAllStmt={importAllStmt}
            importStmtLine={importStmtLine}
            incomeCats={incomeCats}
            loadStmtFile={loadStmtFile}
            setStmtBankAccountId={setStmtBankAccountId}
            setStmtCats={setStmtCats}
            setStmtDragging={setStmtDragging}
            setStmtFileName={setStmtFileName}
            setStmtLines={setStmtLines}
            setStmtResults={setStmtResults}
            stmtBankAccountId={stmtBankAccountId}
            stmtCats={stmtCats}
            stmtDragging={stmtDragging}
            stmtFileName={stmtFileName}
            stmtLines={stmtLines}
            stmtProgresso={stmtProgresso}
            stmtResults={stmtResults}
          />
        )}

        <ImportTransactionsModal
          importDragging={importDragging}
          importFileName={importFileName}
          importModal={importModal}
          importTab={importTab}
          importText={importText}
          lerPlanilha={lerPlanilha}
          loadImportFile={loadImportFile}
          parseImport={parseImport}
          setImportDragging={setImportDragging}
          setImportFileName={setImportFileName}
          setImportModal={setImportModal}
          setImportTab={setImportTab}
          setImportText={setImportText}
        />
        {/* New Transaction Modal */}
        <TransactionModal txBusy={txBusy}
          addTx={addTx}
          bankAccounts={bankAccounts}
          customers={customers}
          editTxId={editTxId}
          expenseCats={expenseCats}
          incomeCats={incomeCats}
          newTx={newTx}
          newTxModal={newTxModal}
          payMethods={payMethods}
          setEditTxId={setEditTxId}
          setNewTx={setNewTx}
          setNewTxModal={setNewTxModal}
        />
        <SettlementModal confirmSettle={confirmSettle} setSettleModal={setSettleModal} settleModal={settleModal} />
        <BulkSettlementModal
          bulkSettleModal={bulkSettleModal}
          confirmBulkSettle={confirmBulkSettle}
          setBulkSettleModal={setBulkSettleModal}
        />
        <CardPaymentModal
          faturaModal={faturaModal}
          monthLabel={monthLabel}
          pagarFatura={pagarFatura}
          setFaturaModal={setFaturaModal}
        />
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
        <InfoModal />
      </div>
    </div>
  );
};

export { FinancialPage };
