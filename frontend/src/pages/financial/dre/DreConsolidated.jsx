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
  totOp,
  totOpP,
  unassignedItem,
  vp,
}) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-xs text-gray-500">Filtrar por cliente:</span>
      <select
        value={dreCustomerFilter}
        onChange={(e) => setDreCustomerFilter(e.target.value)}
        className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
      >
        <option value="all">Toda a empresa (consolidado)</option>
        {customerMetricsList
          .filter((c) => c.hasActivity)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({fmt(c.netProfit)} lucro)
            </option>
          ))}
        {unassignedItem.hasActivity && <option value="__sem_cliente__">Lançamentos gerais / sem cliente</option>}
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


    {/* KPI cards */}
    {hasData && (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
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
