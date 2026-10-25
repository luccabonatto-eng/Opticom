// Regra de leitura da planilha, copiada do frontend (index.html: parseMoney e
// parseImport). CSV exportado do Excel pt-BR quase sempre traz cabeçalho.
const parseMoney = s => {
  const t = (s || '').trim().replace(/[R$\s"']/g, '');
  if (!t || t === '-' || t === '+') return 0;
  let reais;
  if (/[,]\d{1,2}$/.test(t)) reais = parseFloat(t.replace(/\./g, '').replace(',', '.')) || 0;
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) reais = parseFloat(t.replace(/\./g, '')) || 0;
  else reais = parseFloat(t.replace(/,/g, '')) || 0;
  return Math.round(reais * 100);
};

const lerPlanilha = texto => {
  let linhas = texto.trim().split('\n').filter(l => l.trim());
  if (linhas.length && parseMoney((linhas[0].split(/[;\t]/)[1] || '')) === 0) linhas = linhas.slice(1);
  return linhas.map(l => {
    const c = l.split(/[;\t]/).map(x => x.trim().replace(/"/g, ''));
    return { description: c[0], amount: parseMoney(c[1]), due_date: c[2] || null };
  });
};

describe('importar planilha', () => {
  test('descarta a linha de cabeçalho', () => {
    const r = lerPlanilha('Descrição;Valor;Vencimento;Categoria\nAluguel;1.500,00;2026-05-10;Administrativo');
    expect(r).toHaveLength(1);
    expect(r[0].description).toBe('Aluguel');
  });

  test('sem cabeçalho, não descarta a primeira linha', () => {
    const r = lerPlanilha('Aluguel;1.500,00;2026-05-10\nEnergia;320,45;2026-05-12');
    expect(r).toHaveLength(2);
    expect(r[0].description).toBe('Aluguel');
  });

  test('valor brasileiro com milhar e centavos', () => {
    expect(lerPlanilha('Aluguel;1.500,00;2026-05-10')[0].amount).toBe(150000);
  });

  test('valor americano também funciona', () => {
    expect(lerPlanilha('Aluguel;1500.00;2026-05-10')[0].amount).toBe(150000);
  });

  test('vírgula do decimal não quebra as colunas', () => {
    const r = lerPlanilha('Fatura X;1.234,56;2026-05-10;Receita de OS')[0];
    expect(r.amount).toBe(123456);
    expect(r.due_date).toBe('2026-05-10'); // antes virava "56"
  });

  test('separador tab funciona', () => {
    expect(lerPlanilha('Aluguel\t250,50\t2026-05-10')[0].amount).toBe(25050);
  });

  test('arquivo só com cabeçalho não gera lançamento', () => {
    expect(lerPlanilha('Descrição;Valor;Vencimento')).toHaveLength(0);
  });
});
