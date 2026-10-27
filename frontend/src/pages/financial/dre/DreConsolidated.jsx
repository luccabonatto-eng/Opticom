import { fmt } from '../../../utils/format.js';

const DreConsolidated = ({
  HR,
  IR2,
  InfoBtn,
  RR,
  STR,
  SubHR,
  av,
  csp,
  cspP,
  curLabel,
  customerMetricsList,
  dAdm,
  dAdmP,
  dCom,
  dComP,
  dFin,
  dFinP,
  dOut,
  dOutP,
  dPes,
  dPesP,
  da,
  daP,
  ded,
  dedP,
  dreCustomerFilter,
  ebit,
  ebitP,
  ebitda,
  ebitdaP,
  fv,
  getCustName,
  hasData,
  ir,
  irP,
  itemsFor,
  lair,
  lairP,
  lb,
  lbP,
  ll,
  llP,
  prevLabel,
  rFin,
  rFinP,
  recBruta,
  recBrutaP,
  recLiq,
  recLiqP,
  resFinLiq,
  resFinLiqP,
  setDreCustomerFilter,
  setDreViewMode,
  totOp,
  totOpP,
  unassignedItem,
  vp,
}) => (
  <div className="space-y-4">
    {/* Banner de Filtro Individual por Cliente */}
    <div className="bg-white rounded-xl border border-gray-200 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
          📊
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Demonstrativo Formal — Padrão CPC 26
            </p>
            {dreCustomerFilter !== 'all' && (
              <span className="text-[11px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                Filtro Individual Ativo
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Regime de Competência · Comparativo Mensal ({curLabel} × {prevLabel}) · Valores em R$
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Filtrar por Cliente:</span>
        <select
          value={dreCustomerFilter}
          onChange={(e) => setDreCustomerFilter(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
        >
          <option value="all">🏢 Toda a Empresa (Consolidado)</option>
          {customerMetricsList
            .filter((c) => c.hasActivity)
            .map((c) => (
              <option key={c.id} value={c.id}>
                👤 {c.name} ({fmt(c.netProfit)} lucro)
              </option>
            ))}
          {unassignedItem.hasActivity && <option value="__sem_cliente__">🏛️ Lançamentos Gerais / Sem Cliente</option>}
        </select>
        {dreCustomerFilter !== 'all' && (
          <button
            onClick={() => setDreCustomerFilter('all')}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg font-medium"
          >
            ✕ Limpar
          </button>
        )}
      </div>
    </div>

    {/* Banner Explicativo quando um cliente específico está filtrado */}
    {dreCustomerFilter !== 'all' && (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👤</span>
          <div>
            <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Visualizando DRE individual de</p>
            <p className="text-sm font-extrabold text-gray-900">{getCustName(dreCustomerFilter)}</p>
            <p className="text-xs text-gray-500">
              Todas as linhas abaixo (receitas, custos diretos e despesas) refletem exclusivamente os lançamentos deste
              cliente.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDreViewMode('by_customer')}
            className="text-xs font-semibold px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Ver Comparativo de Clientes →
          </button>
          <button
            onClick={() => setDreCustomerFilter('all')}
            className="text-xs font-semibold px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            ✕ Voltar para Consolidado
          </button>
        </div>
      </div>
    )}

    {/* KPI cards */}
    {hasData && (
      <div className="grid grid-cols-5 gap-3">
        {[
          {
            l: 'Receita Líquida',
            c: recLiq,
            p: recLiqP,
            info: 'dre-recliq',
            bg: 'bg-blue-50',
            bdr: 'border-blue-200',
            tc: 'text-blue-700',
          },
          {
            l: 'Lucro Bruto',
            c: lb,
            p: lbP,
            info: 'dre-lb',
            bg: 'bg-green-50',
            bdr: 'border-green-200',
            tc: 'text-green-700',
            mg: recLiq > 0 ? av(lb, recLiq) : '—',
          },
          {
            l: 'EBIT',
            c: ebit,
            p: ebitP,
            info: 'dre-ebit',
            bg: 'bg-indigo-50',
            bdr: 'border-indigo-200',
            tc: 'text-indigo-700',
            mg: recLiq > 0 ? av(ebit, recLiq) : '—',
          },
          {
            l: 'EBITDA',
            c: ebitda,
            p: ebitdaP,
            info: 'dre-ebitda',
            bg: 'bg-teal-50',
            bdr: 'border-teal-200',
            tc: 'text-teal-700',
            mg: recLiq > 0 ? av(ebitda, recLiq) : '—',
          },
          {
            l: 'Lucro Líquido',
            c: ll,
            p: llP,
            info: 'dre-ll',
            bg: 'bg-emerald-50',
            bdr: 'border-emerald-200',
            tc: 'text-emerald-700',
            mg: recLiq > 0 ? av(ll, recLiq) : '—',
          },
        ].map((k, i) => {
          const { l: vl, u } = vp(k.c, k.p);
          return (
            <div key={i} className={`${k.bg} border ${k.bdr} rounded-xl p-3`}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <p className="text-xs text-gray-500">{k.l}</p>
                <InfoBtn id={k.info} />
              </div>
              <p className={`text-base font-bold ${k.tc}`}>{fv(k.c)}</p>
              {k.mg && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Margem: <span className={`font-semibold ${k.tc}`}>{k.mg}</span>
                </p>
              )}
              <p
                className={`text-xs mt-1 font-medium ${vl === '—' ? 'text-gray-400' : u ? 'text-green-600' : 'text-red-500'}`}
              >
                {vl} vs {prevLabel}
              </p>
            </div>
          );
        })}
      </div>
    )}

    {/* ── Margens ───────────────────────────────────────── */}
    {hasData && (
      <div className="grid grid-cols-3 gap-4">
        {[
          { l: 'Margem Bruta', formula: 'Lucro Bruto / Receita Líquida', info: 'mg-bruta', c: lb, p: lbP },
          { l: 'Margem Operacional', formula: 'EBIT / Receita Líquida', info: 'mg-oper', c: ebit, p: ebitP },
          { l: 'Margem Líquida', formula: 'Lucro Líquido / Receita Líquida', info: 'mg-liq', c: ll, p: llP },
        ].map(({ l, formula, info, c, p }) => {
          const pct = recLiq > 0 ? (c / recLiq) * 100 : null;
          const pctP = recLiqP > 0 ? (p / recLiqP) * 100 : null;
          const diff = pct !== null && pctP !== null ? pct - pctP : null;
          const good = pct === null ? false : pct >= 0;
          const bar = pct === null ? 0 : Math.min(Math.abs(pct), 100);
          return (
            <div
              key={l}
              className={`rounded-xl border p-4 ${good ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{l}</p>
                    <InfoBtn id={info} />
                  </div>
                  <p
                    className={`text-2xl font-bold mt-0.5 ${pct === null ? 'text-gray-300' : good ? 'text-gray-800' : 'text-red-700'}`}
                  >
                    {pct === null ? '—' : `${pct.toFixed(1)}%`}
                  </p>
                </div>
                {pct !== null && (
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg mt-0.5 ${good ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {good ? '▲ Positiva' : '▼ Negativa'}
                  </span>
                )}
              </div>
              {/* barra de progresso */}
              <div className="h-1.5 rounded-full bg-gray-100 mb-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${good ? 'bg-green-400' : 'bg-red-400'}`}
                  style={{ width: `${bar}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{formula}</p>
              {diff !== null && (
                <p
                  className={`text-xs font-medium mt-1 ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}
                >
                  {diff > 0 ? `▲ +${diff.toFixed(1)} p.p.` : diff < 0 ? `▼ ${diff.toFixed(1)} p.p.` : '= sem variação'}{' '}
                  vs {prevLabel}
                  {pctP !== null && <span className="text-gray-400 font-normal"> (era {pctP.toFixed(1)}%)</span>}
                </p>
              )}
            </div>
          );
        })}
      </div>
    )}

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex flex-wrap gap-3 items-center bg-gray-50">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-800">
            DRE — Demonstração do Resultado {dreCustomerFilter !== 'all' ? `· ${getCustName(dreCustomerFilter)}` : ''}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {curLabel} × {prevLabel} · Regime de Competência · CPC 26 · Valores em R$
          </p>
        </div>
      </div>
      {!hasData ? (
        <div className="px-5 py-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm font-medium text-gray-600">
            Nenhum lançamento encontrado em {curLabel} {dreCustomerFilter !== 'all' ? 'para este cliente' : ''}
          </p>
          <p className="text-xs text-gray-400 mt-1">Adicione receitas e despesas vinculadas para gerar os números</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Descrição
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-blue-700 uppercase tracking-wide whitespace-nowrap">
                  {curLabel}
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  AV%
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  Var%
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {prevLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* RECEITA BRUTA */}
              <HR l="Receita Bruta de Serviços" />
              {itemsFor('INCOME', 'RECEITA_SERVICO', 'RECEITA_CONTRATO', 'OUTRAS_RECEITAS').map(({ n, c, p }) => (
                <IR2 key={n} l={n} c={c} p={p} />
              ))}
              {recBruta === 0 && (
                <tr className="border-t border-gray-100">
                  <td colSpan="5" className="px-4 py-2 text-xs text-gray-400 pl-8">
                    Nenhuma receita neste período
                  </td>
                </tr>
              )}
              <STR l="(=) Receita Bruta Total" c={recBruta} p={recBrutaP} base={recBruta} />

              {/* DEDUÇÕES */}
              {(ded > 0 || dedP > 0) && (
                <>
                  <HR l="(-) Deduções da Receita Bruta (Impostos sobre Receita)" />
                  {itemsFor('EXPENSE', 'IMPOSTO_RECEITA').map(({ n, c, p }) => (
                    <IR2 key={n} l={n} c={c} p={p} neg />
                  ))}
                  <STR l="Total Deduções" c={ded} p={dedP} base={recBruta} neg />
                </>
              )}

              {/* RECEITA LÍQUIDA */}
              <RR l="(=) RECEITA LÍQUIDA DE SERVIÇOS" c={recLiq} p={recLiqP} base={recLiq} hl="blue" />

              {/* CSP */}
              {(csp > 0 || cspP > 0) && (
                <>
                  <HR l="(-) Custo dos Serviços Prestados (CSP)" />
                  {itemsFor('EXPENSE', 'CSP').map(({ n, c, p }) => (
                    <IR2 key={n} l={n} c={c} p={p} neg />
                  ))}
                  <STR l="Total CSP" c={csp} p={cspP} neg />
                </>
              )}

              {/* LUCRO BRUTO */}
              <RR l="(=) LUCRO BRUTO" c={lb} p={lbP} hl="green" />

              {/* DESPESAS OPERACIONAIS */}
              {(totOp > 0 || totOpP > 0) && (
                <>
                  <HR l="(-) Despesas Operacionais" />
                  {(dPes > 0 || dPesP > 0) && (
                    <>
                      <SubHR l="Despesas com Pessoal" />
                      {itemsFor('EXPENSE', 'DESPESA_PESSOAL').map(({ n, c, p }) => (
                        <IR2 key={n} l={n} c={c} p={p} ind={2} neg />
                      ))}
                      <STR l="Subtotal Pessoal" c={dPes} p={dPesP} neg />
                    </>
                  )}
                  {(dAdm > 0 || dAdmP > 0) && (
                    <>
                      <SubHR l="Despesas Gerais e Administrativas (G&A)" />
                      {itemsFor('EXPENSE', 'DESPESA_ADMINISTRATIVA').map(({ n, c, p }) => (
                        <IR2 key={n} l={n} c={c} p={p} ind={2} neg />
                      ))}
                      <STR l="Subtotal G&A" c={dAdm} p={dAdmP} neg />
                    </>
                  )}
                  {(dCom > 0 || dComP > 0) && (
                    <>
                      <SubHR l="Despesas Comerciais" />
                      {itemsFor('EXPENSE', 'DESPESA_COMERCIAL').map(({ n, c, p }) => (
                        <IR2 key={n} l={n} c={c} p={p} ind={2} neg />
                      ))}
                      <STR l="Subtotal Comercial" c={dCom} p={dComP} neg />
                    </>
                  )}
                  {(dOut > 0 || dOutP > 0) && (
                    <>
                      <SubHR l="Outras Despesas Operacionais" />
                      {itemsFor('EXPENSE', 'OUTRAS_DESPESAS').map(({ n, c, p }) => (
                        <IR2 key={n} l={n} c={c} p={p} ind={2} neg />
                      ))}
                      <STR l="Subtotal Outras Despesas" c={dOut} p={dOutP} neg />
                    </>
                  )}
                  <STR l="(=) Total Despesas Operacionais" c={totOp} p={totOpP} neg />
                </>
              )}

              {/* EBIT */}
              <RR l="(=) EBIT — Resultado Operacional" c={ebit} p={ebitP} hl="green" />

              {/* EBITDA */}
              {(da > 0 || daP > 0) && (
                <>
                  <HR l="EBITDA — Ajuste D&A" />
                  {itemsFor('EXPENSE', 'DEPRECIACAO').map(({ n, c, p }) => (
                    <IR2 key={n} l={`(+) D&A add-back — ${n}`} c={c} p={p} />
                  ))}
                  <RR l="(=) EBITDA" c={ebitda} p={ebitdaP} hl="blue" />
                </>
              )}

              {/* RESULTADO FINANCEIRO */}
              {(rFin > 0 || dFin > 0 || rFinP > 0 || dFinP > 0) && (
                <>
                  <HR l="(+/-) Resultado Financeiro" />
                  {(rFin > 0 || rFinP > 0) && <IR2 l="(+) Receitas Financeiras (CDB/Aplicações)" c={rFin} p={rFinP} />}
                  {itemsFor('EXPENSE', 'DESPESA_FINANCEIRA').map(({ n, c, p }) => (
                    <IR2 key={n} l={n} c={c} p={p} neg />
                  ))}
                  <STR l="Resultado Financeiro Líquido" c={resFinLiq} p={resFinLiqP} neg={resFinLiq < 0} />
                </>
              )}

              {/* LAIR */}
              <RR l="(=) LAIR — Lucro Antes do IR e CSLL" c={lair} p={lairP} hl="green" />

              {/* IR / CSLL */}
              {(ir > 0 || irP > 0) && (
                <>
                  <HR l="(-) Impostos sobre o Lucro (IR e CSLL)" />
                  {itemsFor('EXPENSE', 'IMPOSTO_RENDA').map(({ n, c, p }) => (
                    <IR2 key={n} l={n} c={c} p={p} neg />
                  ))}
                  <STR l="Total IR e CSLL" c={ir} p={irP} neg />
                </>
              )}

              {/* LUCRO LÍQUIDO */}
              <tr className={`border-t-2 ${ll >= 0 ? 'bg-blue-700' : 'bg-red-700'}`}>
                <td className="px-4 py-3.5 text-sm font-bold text-white">(=) LUCRO LÍQUIDO DO EXERCÍCIO</td>
                <td className="px-4 py-3.5 text-sm font-bold text-white text-right">{fv(ll)}</td>
                <td className={`px-4 py-3.5 text-xs text-right ${ll >= 0 ? 'text-blue-200' : 'text-red-200'}`}>
                  {recLiq > 0 ? av(ll, recLiq) : '—'}
                </td>
                <td
                  className={`px-3 py-3.5 text-xs font-bold text-center ${vp(ll, llP).u ? 'text-green-300' : 'text-red-300'}`}
                >
                  {vp(ll, llP).l}
                </td>
                <td
                  className={`px-4 py-3.5 text-sm font-semibold text-right ${ll >= 0 ? 'text-blue-200' : 'text-red-200'}`}
                >
                  {fv(llP)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

export { DreConsolidated };
