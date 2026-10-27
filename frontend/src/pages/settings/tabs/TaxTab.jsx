import { TAX_REGIMES } from '../../../config/tax-regimes.js';
import { fmt } from '../../../utils/format.js';

const TaxTab = ({ localStorage, setTaxRegime, setToast, taxRegime }) =>
  (() => {
    const r = TAX_REGIMES[taxRegime];
    const rateRows = [
      {
        label: 'ISS',
        val: r.iss ? (r.iss * 100).toFixed(0) + '%' : 'Incluso no DAS',
        sub: 'Imposto Sobre Serviços — alíquota municipal',
      },
      {
        label: 'PIS',
        val: r.pis ? (r.pis * 100).toFixed(2) + '%' : 'Incluso no DAS',
        sub: r.pisLabel || 'Unificado no DAS',
      },
      {
        label: 'COFINS',
        val: r.cofins ? (r.cofins * 100).toFixed(2) + '%' : 'Incluso no DAS',
        sub: r.cofinsLabel || 'Unificado no DAS',
      },
      {
        label: 'IRPJ',
        val: r.irpjLabel ? '15% + 10% adic.' : 'Incluso no DAS',
        sub: r.irpjLabel || 'Unificado no DAS',
      },
      { label: 'CSLL', val: r.csllLabel ? '9%' : 'Incluso no DAS', sub: r.csllLabel || 'Unificado no DAS' },
      ...(r.dasRate ? [{ label: 'DAS', val: (r.dasRate * 100).toFixed(1) + '%', sub: r.dasLabel }] : []),
    ];
    return (
      <div className="space-y-4">
        {/* Seletor de Regime */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Regime Tributário</h3>
            <p className="text-xs text-gray-400 mt-0.5">Define como os impostos são calculados em todo o sistema</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(TAX_REGIMES).map(([key, reg]) => (
              <button
                key={key}
                onClick={() => {
                  setTaxRegime(key);
                  localStorage.setItem('opticom_taxRegime', key);
                }}
                className={`text-left p-4 rounded-xl border-2 transition-all ${taxRegime === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${reg.dot}`} />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${reg.color}`}>{reg.label}</span>
                  {taxRegime === key && <span className="ml-auto text-blue-600 text-xs font-bold">✓ Ativo</span>}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{reg.method}</p>
                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${reg.obColor} font-medium`}>
                  {reg.obligation}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Alíquotas do Regime Ativo */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <h3 className="text-base font-semibold text-gray-800">Alíquotas Aplicáveis</h3>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.color}`}>{r.label}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {rateRows.map((row, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{row.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{row.sub}</p>
                </div>
                <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quadro Comparativo */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Comparativo entre Regimes — Q1 2026</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Impacto fiscal estimado com base na receita bruta de R$ 48.400.000
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Indicador', 'Lucro Real', 'Lucro Presumido', 'Simples Nacional'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                {
                  l: 'Total Deduções',
                  real: TAX_REGIMES.REAL.dre26.totalDed,
                  pres: TAX_REGIMES.PRESUMIDO.dre26.totalDed,
                  simp: TAX_REGIMES.SIMPLES.dre26.totalDed,
                },
                {
                  l: 'Receita Líquida',
                  real: TAX_REGIMES.REAL.dre26.rl,
                  pres: TAX_REGIMES.PRESUMIDO.dre26.rl,
                  simp: TAX_REGIMES.SIMPLES.dre26.rl,
                },
                {
                  l: 'EBITDA',
                  real: TAX_REGIMES.REAL.dre26.ebitda,
                  pres: TAX_REGIMES.PRESUMIDO.dre26.ebitda,
                  simp: TAX_REGIMES.SIMPLES.dre26.ebitda,
                },
                {
                  l: 'Total Impostos',
                  real: TAX_REGIMES.REAL.dre26.totalImp,
                  pres: TAX_REGIMES.PRESUMIDO.dre26.totalImp,
                  simp: TAX_REGIMES.SIMPLES.dre26.totalImp,
                },
                {
                  l: 'Lucro Líquido',
                  real: TAX_REGIMES.REAL.dre26.ll,
                  pres: TAX_REGIMES.PRESUMIDO.dre26.ll,
                  simp: TAX_REGIMES.SIMPLES.dre26.ll,
                },
              ].map((row, i) => (
                <tr key={i} className={`hover:bg-gray-50 ${i === 4 ? 'font-semibold bg-gray-50' : ''}`}>
                  <td className="px-4 py-3 text-gray-700">{row.l}</td>
                  {[
                    { k: 'real', v: row.real, rk: 'REAL' },
                    { k: 'pres', v: row.pres, rk: 'PRESUMIDO' },
                    { k: 'simp', v: row.simp, rk: 'SIMPLES' },
                  ].map(({ v, rk }) => (
                    <td
                      key={rk}
                      className={`px-4 py-3 text-right font-mono text-xs ${taxRegime === rk ? 'font-bold text-blue-700 bg-blue-50' : v < 0 ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      {v < 0 ? `(${fmt(Math.abs(v))})` : fmt(v)}
                      {taxRegime === rk && <span className="ml-1 text-blue-400">◄</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setToast(`Regime ${r.label} salvo e aplicado ao sistema!`)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Confirmar Regime
          </button>
        </div>
      </div>
    );
  })();

export { TaxTab };
