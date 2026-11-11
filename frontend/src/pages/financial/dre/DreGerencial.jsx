import { fmt } from '../../../utils/format.js';
import { indicadoresGerenciais } from '../calculations.js';

const FIXOS = ['DESPESA_PESSOAL', 'DESPESA_ADMINISTRATIVA', 'DESPESA_COMERCIAL', 'OUTRAS_DESPESAS'];
const pct = (v) => (v == null ? '—' : `${v.toFixed(1)}%`);

// Visão de entrada do DRE: a empresa inteira no mês, separando o que varia com
// as instalações (custo do serviço) do que é estrutura (custos fixos).
const DreGerencial = ({
  HR, IR2, RR, STR, fv, vp, itemsFor, hasData, curLabel, prevLabel,
  recBruta, recBrutaP, ded, dedP, recLiq, recLiqP, csp, cspP, lb, lbP,
  totOp, totOpP, resFinLiq, resFinLiqP, ir, irP, ll, llP,
}) => {
  const ind = indicadoresGerenciais({ recLiq, mc: lb, fixos: totOp, lucro: ll });
  const cards = [
    { l: 'Receita Líquida', v: fmt(recLiq), sub: 'depois dos impostos sobre a receita', c: recLiq, p: recLiqP, cor: 'blue' },
    { l: 'Margem de Contribuição', v: fmt(lb), sub: `${pct(ind.mcPct)} da receita líquida`, c: lb, p: lbP, cor: 'green' },
    { l: 'Lucro Líquido', v: fmt(ll), sub: `margem líquida ${pct(ind.lucroPct)}`, c: ll, p: llP, cor: ll < 0 ? 'red' : 'emerald' },
    {
      l: 'Ponto de Equilíbrio',
      v: ind.equilibrio == null ? '—' : fmt(ind.equilibrio),
      sub:
        ind.equilibrio == null
          ? 'sem margem de contribuição positiva no mês'
          : ind.folga >= 0
            ? `receita ${fmt(ind.folga)} acima do necessário`
            : `faltaram ${fmt(-ind.folga)} de receita`,
      cor: ind.folga != null && ind.folga < 0 ? 'red' : 'indigo',
    },
  ];
  const CORES = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  if (!hasData)
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-12 text-center">
        <p className="text-sm font-medium text-gray-600">Nenhum lançamento encontrado em {curLabel}</p>
        <p className="text-xs text-gray-400 mt-1">Escolha outro mês em “Ref” ou lance receitas e despesas.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map((k) => {
          const { l: vl, u } = k.p === undefined ? { l: null } : vp(k.c, k.p);
          return (
            <div key={k.l} className={`border rounded-xl p-4 ${CORES[k.cor]}`}>
              <p className="text-xs text-gray-500">{k.l}</p>
              <p className="text-xl font-bold mt-1">{k.v}</p>
              <p className="text-xs text-gray-500 mt-0.5">{k.sub}</p>
              {vl && (
                <p className={`text-xs mt-1 font-medium ${vl === '—' ? 'text-gray-400' : u ? 'text-green-600' : 'text-red-500'}`}>
                  {vl} vs {prevLabel}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-bold text-gray-800">Resultado da empresa · {curLabel}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Custos variáveis = categorias de Custo do Serviço (deslocamento, diárias, alimentação, hospedagem, veículo,
            material, terceiros). Custos fixos = folha, estrutura e demais despesas. Percentuais sobre a receita líquida.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                {[
                  ['Descrição', 'text-left text-gray-600 px-4'],
                  [curLabel, 'text-right text-blue-700 px-4'],
                  ['% Rec. Líq.', 'text-right text-gray-400 px-4'],
                  ['Var%', 'text-center text-gray-400 px-3'],
                  [prevLabel, 'text-right text-gray-500 px-4'],
                ].map(([t, c]) => (
                  <th key={t} className={`py-2.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${c}`}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <HR l="Receita Bruta de Serviços" />
              {itemsFor('INCOME', 'RECEITA_SERVICO', 'RECEITA_CONTRATO', 'OUTRAS_RECEITAS').map(({ n, c, p }) => (
                <IR2 key={n} l={n} c={c} p={p} />
              ))}
              {/* base 0: sem percentual, a referência da tabela é a receita líquida */}
              <STR l="(=) Receita Bruta" c={recBruta} p={recBrutaP} base={0} />
              {(ded > 0 || dedP > 0) && (
                <>
                  <HR l="(-) Impostos sobre a Receita" />
                  {itemsFor('EXPENSE', 'IMPOSTO_RECEITA').map(({ n, c, p }) => (
                    <IR2 key={n} l={n} c={c} p={p} neg />
                  ))}
                </>
              )}
              <RR l="(=) RECEITA LÍQUIDA" c={recLiq} p={recLiqP} hl="blue" />

              <HR l="(-) Custos Variáveis das Instalações" />
              {itemsFor('EXPENSE', 'CSP').map(({ n, c, p }) => (
                <IR2 key={n} l={n} c={c} p={p} neg />
              ))}
              <STR l="Total de Custos Variáveis" c={csp} p={cspP} neg />
              <RR l="(=) MARGEM DE CONTRIBUIÇÃO" c={lb} p={lbP} hl="green" />

              <HR l="(-) Custos Fixos" />
              {itemsFor('EXPENSE', ...FIXOS).map(({ n, c, p }) => (
                <IR2 key={n} l={n} c={c} p={p} neg />
              ))}
              <STR l="Total de Custos Fixos" c={totOp} p={totOpP} neg />
              {(resFinLiq !== 0 || resFinLiqP !== 0) && <STR l="(+/-) Resultado Financeiro" c={resFinLiq} p={resFinLiqP} />}
              {(ir > 0 || irP > 0) && <STR l="(-) IR e CSLL" c={ir} p={irP} neg />}
              <RR l="(=) LUCRO LÍQUIDO" c={ll} p={llP} hl="navy" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export { DreGerencial };
