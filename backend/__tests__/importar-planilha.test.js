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

const splitCSV = (linha, sep) => {
  const cols = [];
  let atual = '', emAspas = false;
  for (const ch of linha) {
    if (ch === '"') { emAspas = !emAspas; continue; }
    if (ch === sep && !emAspas) { cols.push(atual); atual = ''; continue; }
    atual += ch;
  }
  cols.push(atual);
  return cols.map(c => c.trim());
};

const detectSep = texto => {
  const linha = (texto.split('\n')[0] || '');
  const conta = sep => splitCSV(linha, sep).length - 1;
  const [melhor] = [';', '\t', ','].map(s => [s, conta(s)]).sort((a, b) => b[1] - a[1]);
  return melhor[1] > 0 ? melhor[0] : ';';
};

const semAcento = t => (t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();

const mapearColunas = (cabecalho, sep) => {
  const h = splitCSV(cabecalho, sep).map(semAcento);
  const achar = (...termos) => h.findIndex(c => termos.some(t => c.includes(t)));
  const mapa = {
    descricao: achar('descri','histor','memo'),
    valor:     achar('valor','amount','value'),
    data:      achar('data','vencim','due'),
    categoria: achar('categ'),
    tipo:      achar('tipo','type'),
  };
  return (mapa.descricao >= 0 && mapa.valor >= 0) ? mapa : null;
};

const paraISO = d => {
  const m = (d||'').trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!m) return (d||'').trim();
  const ano = m[3].length===2 ? '20'+m[3] : m[3];
  return `${ano}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
};

const lerPlanilha = texto => {
  let linhas = texto.trim().split('\n').filter(l => l.trim());
  if (!linhas.length) return [];
  const sep = detectSep(texto);
  const mapa = mapearColunas(linhas[0], sep);
  if (mapa) linhas = linhas.slice(1);
  else if (parseMoney(splitCSV(linhas[0], sep)[1]) === 0) linhas = linhas.slice(1);
  const col = (cols, chave, posicao) => mapa ? (mapa[chave] >= 0 ? cols[mapa[chave]] : '') : cols[posicao];
  const hoje = '2026-10-25';

  return linhas.map((l, idx) => {
    const cols = splitCSV(l, sep);
    const tipoTxt = semAcento(col(cols,'tipo',-1));
    return {
      description: col(cols,'descricao',0) || `Importado ${idx+1}`,
      amount:      Math.abs(parseMoney(col(cols,'valor',1))),
      due_date:    paraISO(col(cols,'data',2)) || hoje,
      catName:     col(cols,'categoria',3) || '',
      tipo:        tipoTxt.startsWith('entrada') ? 'INCOME' : tipoTxt.startsWith('saida') ? 'EXPENSE' : null,
    };
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

  // Separado por vírgula: antes importava zero lançamentos, a linha inteira
  // virava uma coluna só e o valor saía 0.
  test('separado por vírgula, valor americano', () => {
    const r = lerPlanilha('Aluguel,1500.00,2026-05-10')[0];
    expect(r.description).toBe('Aluguel');
    expect(r.amount).toBe(150000);
    expect(r.due_date).toBe('2026-05-10');
  });

  test('separado por vírgula com campos entre aspas e decimal brasileiro', () => {
    const r = lerPlanilha('"Fatura Cliente X","1.234,56","2026-05-10"')[0];
    expect(r.description).toBe('Fatura Cliente X');
    expect(r.amount).toBe(123456);
    expect(r.due_date).toBe('2026-05-10');
  });

  test('vírgula dentro de aspas não cria coluna nova', () => {
    const r = lerPlanilha('"Serviço A, B e C";250,50;2026-05-10')[0];
    expect(r.description).toBe('Serviço A, B e C');
    expect(r.amount).toBe(25050);
  });

  test('cabeçalho separado por vírgula também é descartado', () => {
    const r = lerPlanilha('Descricao,Valor,Vencimento\nAluguel,1500.00,2026-05-10');
    expect(r).toHaveLength(1);
    expect(r[0].description).toBe('Aluguel');
  });

  test('ponto-e-vírgula continua funcionando após a mudança', () => {
    expect(lerPlanilha('Aluguel;1.500,00;2026-05-10')[0].amount).toBe(150000);
  });

  // ── formato real exportado do sistema antigo do cliente ──
  describe('arquivo do sistema antigo', () => {
    const CAB = 'tipo;descricao;valor;data de realizacao;categoria;conta;cliente;status;parcelas restantes;obs';

    test('lê pelas colunas do cabeçalho, não pela posição', () => {
      const r = lerPlanilha(CAB + '\nsaida;despesas paulo = hoppecke;-352,31;02/10/2026;infraestrutura;banco itau;;pago;;')[0];
      expect(r.description).toBe('despesas paulo = hoppecke');
      expect(r.amount).toBe(35231);
      expect(r.due_date).toBe('2026-10-02');
      expect(r.catName).toBe('infraestrutura');
      expect(r.tipo).toBe('EXPENSE');
    });

    test('valor negativo vira positivo (o sinal está no tipo)', () => {
      expect(lerPlanilha(CAB + '\nsaida;netto;-11.000,00;06/10/2026;folha de pagamento;banco itau;;pago;;')[0].amount).toBe(1100000);
    });

    test('valor alto com milhar e centavos', () => {
      expect(lerPlanilha(CAB + '\nsaida;simples nacional;-135.667,77;20/10/2026;despesas tributarias;banco itau;;pago;;')[0].amount).toBe(13566777);
    });

    test('campos entre aspas com espaço sobrando', () => {
      const r = lerPlanilha(CAB + '\nsaida;"detran ";-152,00;07/10/2026;"veiculo ";banco itau;;pago;;')[0];
      expect(r.description).toBe('detran');
      expect(r.catName).toBe('veiculo');
    });

    test('entrada vira INCOME', () => {
      expect(lerPlanilha(CAB + '\nentrada;fatura cliente;1.500,00;10/10/2026;receita;banco itau;;recebido;;')[0].tipo).toBe('INCOME');
    });

    test('data dd/mm/aaaa convertida para o formato do backend', () => {
      expect(lerPlanilha(CAB + '\nsaida;x;-10,00;02/10/2026;y;z;;pago;;')[0].due_date).toBe('2026-10-02');
    });

    test('formato antigo sem cabeçalho nomeado continua funcionando', () => {
      const r = lerPlanilha('Aluguel;1.500,00;2026-05-10;Administrativo')[0];
      expect(r.description).toBe('Aluguel');
      expect(r.amount).toBe(150000);
      expect(r.due_date).toBe('2026-05-10');
    });
  });
});
