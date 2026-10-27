import { Badge } from '../../../components/Badge.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { faturaDe, soma, txAberto, txDue } from '../calculations.js';
import { fmt, fmtDate } from '../../../utils/format.js';

const CardsTab = ({
  cardFiltro,
  customers,
  ehCompraCartao,
  monthLabel,
  openEditTx,
  payMethods,
  setCardFiltro,
  setEditTxId,
  setFaturaModal,
  setNewTx,
  setNewTxModal,
  setToast,
  tab,
  transactions,
  txCatName,
  txClasse,
}) =>
  (() => {
    // Agrupa as compras por cartão + mês de competência. A fatura não é um
    // registro: é esse conjunto.
    // Cartão de despesa (corporativo, tipo PagCorp/Flash) usa a mesma
    // mecânica do cartão de crédito — gasto agora, caixa na fatura — e é
    // separado aqui só para não misturar os dois controles.
    const ehDespesa = (m) => /despesa/i.test(m.name || '');
    const abaDespesa = tab === 'expcard';
    const cartoes = payMethods.filter((m) => /cart[aã]o/i.test(m.name || '') && ehDespesa(m) === abaDespesa);
    const idsAba = new Set(cartoes.map((m) => m.id));
    const rotulo = abaDespesa ? 'Cartão de Despesa' : 'Cartão de Crédito';
    // classes completas: o Tailwind não monta nome de classe por template
    const C = abaDespesa
      ? {
          box: 'bg-indigo-50 border-indigo-200',
          chip: 'bg-indigo-600',
          tit: 'text-indigo-900',
          val: 'text-indigo-700',
          btn: 'bg-indigo-600 hover:bg-indigo-700',
        }
      : {
          box: 'bg-fuchsia-50 border-fuchsia-200',
          chip: 'bg-fuchsia-600',
          tit: 'text-fuchsia-900',
          val: 'text-fuchsia-700',
          btn: 'bg-fuchsia-600 hover:bg-fuchsia-700',
        };
    const compras = transactions.filter(
      (t) =>
        ehCompraCartao(t) &&
        idsAba.has(t.payment_method_id) &&
        (cardFiltro === 'all' || t.payment_method_id === cardFiltro),
    );
    const faturas = {};
    for (const t of compras) {
      const chave = `${t.payment_method_id}|${faturaDe(t)}`;
      if (!faturas[chave])
        faturas[chave] = {
          pmId: t.payment_method_id,
          nome: payMethods.find((m) => m.id === t.payment_method_id)?.name || 'Cartão',
          mes: faturaDe(t),
          compras: [],
          total: 0,
          aberto: 0,
        };
      faturas[chave].compras.push(t);
      faturas[chave].total += t.amount || 0;
      faturas[chave].aberto += txAberto(t);
    }
    // shortcut: o pagamento é reencontrado pela descrição que nós mesmos
    // geramos; vira frágil se alguém renomear o lançamento à mão.
    // Ligar por coluna própria quando houver migration para isso.
    const pagamentoDa = (f) =>
      transactions.find(
        (t) =>
          t.type === 'EXPENSE' &&
          txClasse(t) === 'PAGAMENTO_CARTAO' &&
          (t.description || '') === `Fatura ${f.nome} — ${monthLabel(f.mes)}`,
      );

    const lista = Object.values(faturas).sort((a, b) => b.mes.localeCompare(a.mes) || a.nome.localeCompare(b.nome));
    const emAberto = lista.filter((f) => f.aberto > 0);

    return (
      <div className="space-y-4">
        <div className={`flex items-start gap-3 border rounded-xl p-3.5 ${C.box}`}>
          <span
            className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-sm shrink-0 ${C.chip}`}
          >
            {abaDespesa ? '▬' : '▭'}
          </span>
          <div className="flex-1">
            <p className={`text-xs font-bold uppercase tracking-wide ${C.tit}`}>Gastos no {rotulo}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              O gasto já conta como despesa no DRE (com cliente e categoria), mas não sai do caixa. O caixa só é afetado
              quando a fatura é paga — por isso eles não aparecem em A Pagar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={cardFiltro}
            onChange={(e) => setCardFiltro(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="all">Todos os cartões{abaDespesa ? ' de despesa' : ' de crédito'}</option>
            {cartoes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              const cartaoPadrao = cardFiltro !== 'all' ? cardFiltro : cartoes[0]?.id || '';
              if (!cartaoPadrao) {
                setToast(
                  abaDespesa
                    ? 'Cadastre uma forma de pagamento com "cartão" e "despesa" no nome em Configurações. Ex: Cartão de Despesa PagCorp.'
                    : 'Cadastre uma forma de pagamento com "cartão" no nome em Configurações.',
                );
                return;
              }
              setEditTxId(null);
              setNewTx({
                type: 'EXPENSE',
                description: '',
                amount: '',
                due_date: new Date().toISOString().split('T')[0],
                status: 'PENDING',
                category_id: '',
                bank_account_id: '',
                payment_method_id: cartaoPadrao,
                customer_id: '',
                invoice_number: '',
                repetir: 1,
                jaPago: false,
                paid_date: '',
              });
              setNewTxModal(true);
            }}
            className={`ml-auto flex items-center gap-1.5 text-white text-sm px-4 py-2 rounded-lg ${C.btn}`}
          >
            <Icon name="plus" className="w-4 h-4" /> {abaDespesa ? 'Nova Despesa no Cartão' : 'Nova Compra no Cartão'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Faturas em aberto</p>
            <p className={`text-2xl font-bold mt-1 ${C.val}`}>{emAberto.length}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Total a pagar</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{fmt(soma(emAberto, (f) => f.aberto))}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {abaDespesa ? 'Despesas lançadas' : 'Compras lançadas'}
            </p>
            <p className="text-2xl font-bold text-gray-700 mt-1">{compras.length}</p>
          </div>
        </div>

        {lista.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl py-12 text-center">
            <p className="text-sm text-gray-500">Nenhum gasto neste tipo de cartão ainda.</p>
            <p className="text-xs text-gray-400 mt-1">
              Lance a despesa normalmente escolhendo uma forma de pagamento com{' '}
              {abaDespesa ? '"cartão" e "despesa"' : '"cartão"'} no nome.
            </p>
          </div>
        )}

        {lista.map((f) => (
          <div key={f.pmId + f.mes} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50 flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <p className="text-sm font-bold text-gray-800">{f.nome}</p>
                <p className="text-xs text-gray-500">
                  Fatura de {monthLabel(f.mes)} · {f.compras.length} {abaDespesa ? 'gasto(s)' : 'compra(s)'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Acumulado</p>
                <p className="text-lg font-bold text-gray-800">{fmt(f.total)}</p>
              </div>
              {f.aberto > 0 ? (
                <button
                  onClick={() =>
                    setFaturaModal({
                      ...f,
                      valorFatura: (f.aberto / 100).toFixed(2),
                      vencimento: new Date().toISOString().split('T')[0],
                    })
                  }
                  className={`px-4 py-2 text-white rounded-lg text-xs font-semibold ${C.btn}`}
                >
                  Pagar fatura
                </button>
              ) : (
                (() => {
                  const pg = pagamentoDa(f);
                  return (
                    <div className="text-right">
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                        ✓ Paga
                      </span>
                      {pg && (
                        <p className="text-xs text-gray-500 mt-1">
                          {fmt(pg.amount)} em {fmtDate(pg.paid_date || pg.due_date)}
                        </p>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {f.compras.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-500 w-24">{fmtDate(txDue(t))}</td>
                    <td className="px-4 py-2 text-gray-800">{t.description}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{txCatName(t)}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {t.customers?.name || customers.find((c) => c.id === t.customer_id)?.name || (
                        <span className="text-gray-300">sem cliente</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                      {fmt(t.amount)}
                    </td>
                    <td className="px-4 py-2 w-28">
                      <Badge status={t.status} />
                    </td>
                    <td className="px-4 py-2 w-10 text-right">
                      <button
                        onClick={() => openEditTx(t)}
                        title="Editar compra"
                        className="text-xs text-gray-400 hover:text-blue-600"
                      >
                        ✎
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  })();

export { CardsTab };
