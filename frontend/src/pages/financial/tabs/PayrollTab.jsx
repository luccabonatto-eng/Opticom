import { Icon } from '../../../components/Icon.jsx';
import { Modal } from '../../../components/Modal.jsx';
import { api } from '../../../api/client.js';
import { fmt, fmtDate } from '../../../utils/format.js';

const PayrollTab = ({
  Boolean,
  editPayForm,
  editPayModal,
  newPayModal,
  openEditPay,
  payEmpModal,
  payForm,
  payTechs,
  payroll,
  payrollRef,
  saveEditPay,
  setEditPayForm,
  setEditPayModal,
  setNewPayModal,
  setPayEmpModal,
  setPayForm,
  setPayTechs,
  setPayroll,
  setPayrollRef,
  setToast,
}) =>
  (() => {
    const PAYROLL_MONTHS = [
      ['2026-04', 'Abril 2026'],
      ['2026-03', 'Março 2026'],
      ['2026-02', 'Fevereiro 2026'],
      ['2026-01', 'Janeiro 2026'],
    ];
    // helpers de cálculo
    const bruto = (r) => r.base + r.horasExtras + r.adicNoturno + r.periculosidade + r.insalubridade + r.bonus;
    const deducEmp = (r) => r.dINSS + r.dIRRF + r.dVT + r.dPlano;
    const liquido = (r) => bruto(r) - deducEmp(r); // valor líquido depositado em conta
    const benefEmp = (r) => r.vt + r.vr + r.planoSaude; // benefícios custeados pela empresa
    const encargos = (r) => r.inssPatronal + r.fgts + r.rat + r.sistemaS;
    const provisoes = (r) => r.prov13 + r.provFerias + r.fgtsProv;
    const custoTotal = (r) => bruto(r) + benefEmp(r) + encargos(r) + provisoes(r);

    const payrollRows = payroll.filter((p) => p.ref === payrollRef);
    const payrollTechIds = new Set(payrollRows.map((p) => p.techId).filter(Boolean));
    const payrollNames = new Set(payrollRows.map((p) => (p.name || '').toLowerCase()));
    const techStubs = payTechs
      .filter((t) => !payrollTechIds.has(t.id) && !payrollNames.has((t.name || '').toLowerCase()))
      .map((t) => ({
        id: `stub-${t.id}`,
        techId: t.id,
        name: t.name || '—',
        role: t.specialization || 'Técnico de Campo',
        cpf: '',
        admDate: '',
        ref: payrollRef,
        status: 'PENDING',
        base: 0,
        horasExtras: 0,
        adicNoturno: 0,
        periculosidade: 0,
        insalubridade: 0,
        bonus: 0,
        vt: 0,
        vr: 0,
        planoSaude: 0,
        dINSS: 0,
        dIRRF: 0,
        dVT: 0,
        dPlano: 0,
        inssPatronal: 0,
        fgts: 0,
        rat: 0,
        sistemaS: 0,
        prov13: 0,
        provFerias: 0,
        fgtsProv: 0,
        _stub: true,
      }));
    const rows = [...payrollRows, ...techStubs];
    const totLiq = rows.reduce((s, r) => s + liquido(r), 0);
    const totCusto = rows.reduce((s, r) => s + custoTotal(r), 0);
    const totBruto = rows.reduce((s, r) => s + bruto(r), 0);
    const totEnc = rows.reduce((s, r) => s + encargos(r) + provisoes(r), 0);

    const payAll = () => {
      setPayroll((prev) => prev.map((p) => (p.ref === payrollRef && !p._stub ? { ...p, status: 'PAID' } : p)));
      setToast('Folha aprovada e paga!');
    };
    const openStubConfig = (t) => {
      setPayForm({
        techId: t.techId,
        name: t.name,
        role: t.role,
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
      setNewPayModal(true);
    };

    const emp = payEmpModal;
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">Folha Salarial</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {rows.length} colaborador(es) · {PAYROLL_MONTHS.find(([k]) => k === payrollRef)?.[1]}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <select
              value={payrollRef}
              onChange={(e) => setPayrollRef(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {PAYROLL_MONTHS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            <button
              onClick={() => setNewPayModal(true)}
              className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <Icon name="plus" className="w-4 h-4" /> Funcionário
            </button>
            {rows.some((r) => r.status === 'PENDING') && (
              <button
                onClick={payAll}
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"
              >
                ✓ Aprovar e Pagar Folha
              </button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
            <p className="text-xs font-medium text-cyan-600 uppercase tracking-wide">Total Bruto</p>
            <p className="text-2xl font-bold text-cyan-700 mt-1">{fmt(totBruto)}</p>
            <p className="text-xs text-cyan-500 mt-0.5">salários + extras + adicionais + bônus</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Líquido a Pagar</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{fmt(totLiq)}</p>
            <p className="text-xs text-blue-500 mt-0.5">bruto − INSS − IRRF − descontos</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Encargos + Provisões</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{fmt(totEnc)}</p>
            <p className="text-xs text-red-500 mt-0.5">INSS patronal + FGTS + RAT + Sistema S + provisões</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Custo Total Empresa</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">{fmt(totCusto)}</p>
            <p className="text-xs text-orange-500 mt-0.5">
              tudo incluído · {totBruto > 0 ? ((totCusto / totBruto) * 100).toFixed(0) : '—'}% do bruto
            </p>
          </div>
        </div>

        {/* Tabela de funcionários */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  'Funcionário',
                  'Cargo',
                  'Salário Bruto',
                  'Deduções Emp.',
                  'Líquido a Pagar',
                  'Benefícios',
                  'Encargos+Prov.',
                  'Custo Total',
                  'Status',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-sm text-gray-400">
                    Nenhum funcionário para o período selecionado
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={`hover:bg-gray-50 cursor-pointer ${r._stub ? 'opacity-60 bg-gray-50/50' : r.status === 'PAID' ? 'bg-green-50/20' : ''}`}
                  onClick={() => (r._stub ? openStubConfig(r) : setPayEmpModal(r))}
                >
                  <td className="px-3 py-3">
                    <p className="font-semibold text-gray-800">{r.name}</p>
                    <p className="text-xs text-gray-400">{r._stub ? 'sem salário configurado' : r.cpf}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{r.role}</td>
                  <td className="px-3 py-3 font-medium text-gray-800">{r._stub ? '—' : fmt(bruto(r))}</td>
                  <td className="px-3 py-3 text-red-500 font-medium">{r._stub ? '—' : `-${fmt(deducEmp(r))}`}</td>
                  <td className="px-3 py-3 font-bold text-blue-700">{r._stub ? '—' : fmt(liquido(r))}</td>
                  <td className="px-3 py-3 text-gray-600">{r._stub ? '—' : fmt(benefEmp(r))}</td>
                  <td className="px-3 py-3 text-red-400">{r._stub ? '—' : fmt(encargos(r) + provisoes(r))}</td>
                  <td className="px-3 py-3 font-bold text-orange-700">{r._stub ? '—' : fmt(custoTotal(r))}</td>
                  <td className="px-3 py-3">
                    {r._stub ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap bg-gray-100 text-gray-500">
                        Sem salário
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${r.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                      >
                        {r.status === 'PAID' ? '✓ Pago' : 'Pendente'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {r._stub ? (
                      <button
                        className="text-xs text-orange-600 hover:underline whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation();
                          openStubConfig(r);
                        }}
                      >
                        Configurar →
                      </button>
                    ) : (
                      <button
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPayEmpModal(r);
                        }}
                      >
                        Ver detalhes →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td colSpan="2" className="px-3 py-3 text-xs font-bold text-gray-600 uppercase">
                  Totais do Período
                </td>
                <td className="px-3 py-3 text-xs font-bold text-gray-800">{fmt(totBruto)}</td>
                <td className="px-3 py-3 text-xs font-bold text-red-600">
                  {fmt(rows.reduce((s, r) => s + deducEmp(r), 0))}
                </td>
                <td className="px-3 py-3 text-xs font-bold text-blue-700">{fmt(totLiq)}</td>
                <td className="px-3 py-3 text-xs font-bold text-gray-600">
                  {fmt(rows.reduce((s, r) => s + benefEmp(r), 0))}
                </td>
                <td className="px-3 py-3 text-xs font-bold text-red-500">{fmt(totEnc)}</td>
                <td className="px-3 py-3 text-xs font-bold text-orange-700">{fmt(totCusto)}</td>
                <td colSpan="2" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Modal detalhe do funcionário */}
        <Modal
          open={!!emp}
          onClose={() => setPayEmpModal(null)}
          title={emp ? `${emp.name} — Holerite Detalhado` : 'Holerite'}
          size="lg"
        >
          {emp &&
            (() => {
              const Linha = ({ l, v, cls = 'text-gray-700', bold = false, indent = false, sep = false }) => (
                <div
                  className={`flex justify-between items-center py-1.5 ${sep ? 'border-t border-gray-200 mt-1' : 'border-b border-gray-100'} ${indent ? 'pl-4' : ''}`}
                >
                  <span className={`text-xs ${bold ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{l}</span>
                  <span className={`text-xs font-semibold ${cls} ${bold ? 'text-sm' : ''}`}>{v}</span>
                </div>
              );
              const b = bruto(emp),
                ded = deducEmp(emp),
                liq = liquido(emp),
                bef = benefEmp(emp),
                enc = encargos(emp),
                prov = provisoes(emp),
                ct = custoTotal(emp);
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 pb-3 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center text-white text-lg font-bold">
                      {(emp.name || '?')[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{emp.name}</p>
                      <p className="text-xs text-gray-400">
                        {emp.role} · CPF {emp.cpf} · Admissão: {fmtDate(emp.admDate)}
                      </p>
                    </div>
                    <div className="ml-auto flex gap-2 flex-wrap">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${emp.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                      >
                        {emp.status === 'PAID' ? '✓ Pago' : 'Pendente'}
                      </span>
                      <button
                        onClick={() => openEditPay(emp)}
                        className="text-xs border border-gray-200 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-50 font-medium"
                      >
                        ✏ Editar
                      </button>
                      {emp.status === 'PENDING' && (
                        <button
                          onClick={() => {
                            setPayroll((prev) => prev.map((p) => (p.id === emp.id ? { ...p, status: 'PAID' } : p)));
                            setPayEmpModal((prev) => (prev ? { ...prev, status: 'PAID' } : null));
                            setToast(`Pagamento de ${emp.name} confirmado!`);
                          }}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 font-semibold"
                        >
                          Confirmar Pagamento
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Coluna 1: O que o funcionário RECEBE */}
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">
                        Proventos e Deduções
                      </p>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Remuneração</p>
                      <Linha l="Salário Base" v={fmt(emp.base)} />
                      {emp.horasExtras > 0 && (
                        <Linha l="Horas Extras" v={fmt(emp.horasExtras)} cls="text-green-600" indent />
                      )}
                      {emp.adicNoturno > 0 && (
                        <Linha l="Adicional Noturno" v={fmt(emp.adicNoturno)} cls="text-green-600" indent />
                      )}
                      {emp.periculosidade > 0 && (
                        <Linha l="Periculosidade (30%)" v={fmt(emp.periculosidade)} cls="text-green-600" indent />
                      )}
                      {emp.insalubridade > 0 && (
                        <Linha l="Insalubridade" v={fmt(emp.insalubridade)} cls="text-green-600" indent />
                      )}
                      {emp.bonus > 0 && <Linha l="Bônus / Comissão" v={fmt(emp.bonus)} cls="text-green-600" indent />}
                      <Linha l="(=) Total Bruto" v={fmt(b)} bold cls="text-gray-800" sep />

                      <p className="text-xs font-semibold text-gray-500 uppercase mt-3 mb-1">Deduções do Empregado</p>
                      <Linha l="(-) INSS Empregado" v={'-' + fmt(emp.dINSS)} cls="text-red-500" />
                      <Linha
                        l="(-) IRRF"
                        v={emp.dIRRF > 0 ? '-' + fmt(emp.dIRRF) : 'Isento'}
                        cls={emp.dIRRF > 0 ? 'text-red-500' : 'text-gray-400'}
                      />
                      {emp.dVT > 0 && (
                        <Linha l="(-) Desconto Vale Transporte" v={'-' + fmt(emp.dVT)} cls="text-red-400" />
                      )}
                      {emp.dPlano > 0 && (
                        <Linha l="(-) Desconto Plano Saúde" v={'-' + fmt(emp.dPlano)} cls="text-red-400" />
                      )}
                      <Linha l="(=) LÍQUIDO A RECEBER" v={fmt(liq)} bold cls="text-blue-700" sep />

                      <p className="text-xs font-semibold text-gray-500 uppercase mt-3 mb-1">
                        Benefícios (empresa paga)
                      </p>
                      {emp.vt > 0 && <Linha l="Vale Transporte" v={fmt(emp.vt)} cls="text-green-600" />}
                      {emp.vr > 0 && <Linha l="Vale Refeição" v={fmt(emp.vr)} cls="text-green-600" />}
                      {emp.planoSaude > 0 && <Linha l="Plano de Saúde" v={fmt(emp.planoSaude)} cls="text-green-600" />}
                    </div>

                    {/* Coluna 2: Custo total para a empresa */}
                    <div className="bg-orange-50 rounded-xl p-4">
                      <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-3">
                        Custo Total para a Empresa
                      </p>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Base de Cálculo</p>
                      <Linha l="Salário Bruto Total" v={fmt(b)} cls="text-gray-700" />
                      <Linha l="Benefícios Custeados" v={fmt(bef)} cls="text-gray-700" />

                      <p className="text-xs font-semibold text-gray-500 uppercase mt-3 mb-1">Encargos Patronais</p>
                      <Linha l="INSS Patronal (20%)" v={fmt(emp.inssPatronal)} cls="text-red-500" />
                      <Linha l="FGTS (8%)" v={fmt(emp.fgts)} cls="text-red-500" />
                      <Linha l="RAT — Acidente de Trabalho" v={fmt(emp.rat)} cls="text-red-400" />
                      <Linha l="Sistema S (SENAI/SESC/SEST)" v={fmt(emp.sistemaS)} cls="text-red-400" />
                      <Linha l="Subtotal Encargos" v={fmt(enc)} bold sep />

                      <p className="text-xs font-semibold text-gray-500 uppercase mt-3 mb-1">Provisões Mensais</p>
                      <Linha l="13° Salário (1/12)" v={fmt(emp.prov13)} cls="text-orange-600" />
                      <Linha l="Férias + 1/3 (1/9)" v={fmt(emp.provFerias)} cls="text-orange-600" />
                      <Linha l="FGTS sobre Provisões" v={fmt(emp.fgtsProv)} cls="text-orange-500" />
                      <Linha l="Subtotal Provisões" v={fmt(prov)} bold sep />

                      <div className="mt-3 bg-orange-100 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-orange-800">CUSTO TOTAL EMPRESA</span>
                          <span className="text-lg font-bold text-orange-800">{fmt(ct)}</span>
                        </div>
                        <p className="text-xs text-orange-600 mt-1">
                          {b > 0
                            ? `${((ct / b) * 100).toFixed(0)}% do salário bruto · Múltiplo de ${(ct / liq).toFixed(2)}x o líquido`
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resumo final */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-500">Depósito em conta</p>
                      <p className="text-base font-bold text-blue-700 mt-0.5">{fmt(liq)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-500">Benefícios</p>
                      <p className="text-base font-bold text-green-700 mt-0.5">{fmt(bef)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-orange-500">Custo total empresa</p>
                      <p className="text-base font-bold text-orange-700 mt-0.5">{fmt(ct)}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
        </Modal>

        {/* Modal novo funcionário */}
        <Modal
          open={newPayModal}
          onClose={() => {
            setNewPayModal(false);
            setPayForm({
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
          }}
          title="Cadastrar Funcionário na Folha"
          size="lg"
        >
          <div className="grid grid-cols-2 gap-4">
            {payTechs.length > 0 && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Selecionar técnico cadastrado (opcional)
                </label>
                <select
                  value={payForm.techId || ''}
                  onChange={(e) => {
                    const t = payTechs.find((x) => x.id === e.target.value);
                    if (t)
                      setPayForm((p) => ({
                        ...p,
                        techId: t.id,
                        name: t.name || '',
                        role: t.specialization || 'Técnico de Campo',
                      }));
                    else setPayForm((p) => ({ ...p, techId: '' }));
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Novo funcionário manual —</option>
                  {payTechs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.specialization ? ` · ${t.specialization}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {[
              { l: 'Nome *', k: 'name', ph: 'Nome completo' },
              { l: 'CPF', k: 'cpf', ph: '000.000.000-00' },
              { l: 'Cargo', k: 'role', ph: 'Técnico de Campo' },
              { l: 'Data de Admissão', k: 'admDate', ph: '', type: 'date' },
              { l: 'Salário Base (R$) *', k: 'base', ph: '3500.00', type: 'number' },
              { l: 'Horas Extras (R$)', k: 'horasExtras', ph: '0.00', type: 'number' },
              { l: 'Adicional Noturno', k: 'adicNoturno', ph: '0.00', type: 'number' },
              { l: 'Periculosidade', k: 'periculosidade', ph: '0.00', type: 'number' },
              { l: 'Insalubridade', k: 'insalubridade', ph: '0.00', type: 'number' },
              { l: 'Bônus / Comissão', k: 'bonus', ph: '0.00', type: 'number' },
              { l: 'Vale Transporte', k: 'vt', ph: '150.00', type: 'number' },
              { l: 'Vale Refeição', k: 'vr', ph: '220.00', type: 'number' },
              { l: 'Plano de Saúde', k: 'planoSaude', ph: '180.00', type: 'number' },
            ].map((f) => (
              <div key={f.k} className={f.k === 'name' ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label>
                <input
                  type={f.type || 'text'}
                  value={payForm[f.k] || ''}
                  onChange={(e) => setPayForm((p) => ({ ...p, [f.k]: e.target.value }))}
                  placeholder={f.ph}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <p className="col-span-2 text-xs text-gray-400">
              * INSS, IRRF e encargos patronais serão calculados automaticamente com base no salário informado.
            </p>
            <div className="col-span-2 flex gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setNewPayModal(false);
                  setPayForm({
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
                }}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!payForm.name.trim() || !payForm.base) return;
                  const n = (k, d = 0) => Math.round(parseFloat(payForm[k] || d) * 100);
                  const b = n('base'),
                    ext = n('horasExtras'),
                    an = n('adicNoturno'),
                    peri = n('periculosidade'),
                    insal = n('insalubridade'),
                    bon = n('bonus');
                  const br = b + ext + an + peri + insal + bon;
                  const vt = n('vt'),
                    vr = n('vr'),
                    ps = n('planoSaude');
                  const dINSS = Math.round(br * 0.095),
                    dIRRF = br > 400000 ? Math.round((br - 400000) * 0.075) : 0;
                  const dVT = Math.min(vt, Math.round(b * 0.06)),
                    dPlano = Math.round(ps * 0.25);
                  let techId = payForm.techId || '';
                  if (!techId && payForm.name.trim()) {
                    const tr = await api.createTechnician({
                      name: payForm.name.trim(),
                      specializations: [payForm.role],
                      phone: '',
                    });
                    if (tr.success && tr.data?.id) {
                      techId = tr.data.id;
                      setPayTechs((p) => [...p, tr.data]);
                    }
                  }
                  const entry = {
                    id: Date.now(),
                    techId,
                    name: payForm.name.trim(),
                    role: payForm.role,
                    cpf: payForm.cpf,
                    admDate: payForm.admDate,
                    ref: payrollRef,
                    status: 'PENDING',
                    base: b,
                    horasExtras: ext,
                    adicNoturno: an,
                    periculosidade: peri,
                    insalubridade: insal,
                    bonus: bon,
                    vt,
                    vr,
                    planoSaude: ps,
                    dINSS,
                    dIRRF,
                    dVT,
                    dPlano,
                    inssPatronal: Math.round(br * 0.2),
                    fgts: Math.round(br * 0.08),
                    rat: Math.round(br * 0.02),
                    sistemaS: Math.round(br * 0.058),
                    prov13: Math.round(br / 12),
                    provFerias: Math.round((br / 12) * 1.333),
                    fgtsProv: Math.round((br / 12) * 1.333 * 0.08 + (br / 12) * 0.08),
                  };
                  setPayroll((prev) => [...prev, entry]);
                  setNewPayModal(false);
                  setPayForm({
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
                  setToast(`${entry.name} adicionado à folha!`);
                }}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Cadastrar Funcionário
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal EDITAR funcionário */}
        <Modal
          open={!!editPayModal}
          onClose={() => setEditPayModal(null)}
          locked
          title={editPayModal ? `Editar — ${editPayModal.name}` : 'Editar'}
          size="lg"
        >
          {editPayModal && (
            <div className="space-y-5">
              {/* Dados pessoais */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Dados do Funcionário</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: 'Nome *', k: 'name', ph: 'Nome completo', span: 2 },
                    { l: 'Cargo', k: 'role', ph: 'Cargo' },
                    { l: 'CPF', k: 'cpf', ph: '000.000.000-00' },
                    { l: 'Data de Admissão', k: 'admDate', ph: '', type: 'date' },
                  ].map((f) => (
                    <div key={f.k} className={f.span === 2 ? 'col-span-2' : ''}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label>
                      <input
                        type={f.type || 'text'}
                        value={editPayForm[f.k] || ''}
                        onChange={(e) => setEditPayForm((p) => ({ ...p, [f.k]: e.target.value }))}
                        placeholder={f.ph}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Remuneração */}
              <div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-3">Remuneração (R$)</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: 'Salário Base *', k: 'base' },
                    { l: 'Horas Extras', k: 'horasExtras' },
                    { l: 'Adicional Noturno', k: 'adicNoturno' },
                    { l: 'Periculosidade', k: 'periculosidade' },
                    { l: 'Insalubridade', k: 'insalubridade' },
                    { l: 'Bônus / Comissão', k: 'bonus' },
                  ].map((f) => (
                    <div key={f.k}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editPayForm[f.k] || ''}
                        onChange={(e) => setEditPayForm((p) => ({ ...p, [f.k]: e.target.value }))}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefícios */}
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">
                  Benefícios (empresa paga)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: 'Vale Transporte', k: 'vt' },
                    { l: 'Vale Refeição', k: 'vr' },
                    { l: 'Plano de Saúde', k: 'planoSaude' },
                  ].map((f) => (
                    <div key={f.k}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editPayForm[f.k] || ''}
                        onChange={(e) => setEditPayForm((p) => ({ ...p, [f.k]: e.target.value }))}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Deduções do empregado */}
              <div>
                <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-3">Deduções do Empregado</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { l: 'INSS Empregado', k: 'dINSS' },
                    { l: 'IRRF', k: 'dIRRF' },
                    { l: 'Desconto VT', k: 'dVT' },
                    { l: 'Desconto Plano', k: 'dPlano' },
                  ].map((f) => (
                    <div key={f.k}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editPayForm[f.k] || ''}
                        onChange={(e) => setEditPayForm((p) => ({ ...p, [f.k]: e.target.value }))}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Encargos patronais */}
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-3">
                  Encargos Patronais e Provisões
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { l: 'INSS Patronal (20%)', k: 'inssPatronal' },
                    { l: 'FGTS (8%)', k: 'fgts' },
                    { l: 'RAT', k: 'rat' },
                    { l: 'Sistema S (5.8%)', k: 'sistemaS' },
                    { l: 'Provisão 13°', k: 'prov13' },
                    { l: 'Provisão Férias+1/3', k: 'provFerias' },
                    { l: 'FGTS s/ Provisões', k: 'fgtsProv' },
                  ].map((f) => (
                    <div key={f.k}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editPayForm[f.k] || ''}
                        onChange={(e) => setEditPayForm((p) => ({ ...p, [f.k]: e.target.value }))}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setEditPayModal(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEditPay}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  })();

export { PayrollTab };
