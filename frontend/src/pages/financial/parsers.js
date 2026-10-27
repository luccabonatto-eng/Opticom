const parseMoney = (s) => {
  const t = (s || '').trim().replace(/[R$\s"']/g, '');
  if (!t || t === '-' || t === '+') return 0;
  let reais;
  // Formato BR com centavos: termina em ,XX → vírgula é decimal (ex: 1.000,00)
  if (/[,]\d{1,2}$/.test(t)) reais = parseFloat(t.replace(/\./g, '').replace(',', '.')) || 0;
  // Formato BR sem centavos: ponto como separador de milhar (ex: 1.000 ou 10.000)
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) reais = parseFloat(t.replace(/\./g, '')) || 0;
  // Formato US ou inteiro: ponto é decimal (ou sem decimal)
  else reais = parseFloat(t.replace(/,/g, '')) || 0;
  return Math.round(reais * 100); // retorna centavos
};

const parseOFX = (text) => {
  const lines = [];
  // Suporta SGML (sem fechamento) e XML (com fechamento de tag)
  const re = /<STMTTRN[^>]*>([\s\S]*?)<\/STMTTRN>|<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const b = m[1] || m[2] || '';
    const g = (tag) => {
      const r = new RegExp(`<${tag}>([^<\r\n]+)`, 'i');
      const x = r.exec(b);
      return x ? x[1].trim() : '';
    };
    const dtRaw = g('DTPOSTED');
    const date = dtRaw.length >= 8 ? `${dtRaw.slice(0, 4)}-${dtRaw.slice(4, 6)}-${dtRaw.slice(6, 8)}` : '';
    const raw = parseMoney(g('TRNAMT'));
    if (raw === 0 && !g('FITID')) continue;
    lines.push({
      id: g('FITID') || String(lines.length),
      date,
      description: g('MEMO') || g('NAME') || '—',
      amount: Math.abs(raw),
      type: raw >= 0 ? 'CREDIT' : 'DEBIT',
    });
  }
  return lines;
};

const parseCSV = (text) => {
  // Detecta separador: ; ou tab (evita confundir , de milhar/decimal)
  const sep = text.includes(';') ? ';' : text.includes('\t') ? '\t' : ',';
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((r) => r.split(sep));
  if (rows.length === 0) return [];
  const hdr = rows[0].map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const dI = hdr.findIndex((h) => h.includes('data') || h.includes('date'));
  const nI = hdr.findIndex(
    (h) => h.includes('descri') || h.includes('histor') || h.includes('memo') || h.includes('name'),
  );
  const aI = hdr.findIndex((h) => h.includes('valor') || h.includes('amount') || h.includes('value'));
  const tI = hdr.findIndex(
    (h) =>
      h.includes('tipo') || h.includes('type') || h.includes('cr/db') || h.includes('deb') || h.includes('lancamento'),
  );
  const data = dI >= 0 || nI >= 0 ? rows.slice(1) : rows;
  return data
    .filter((r) => r.length > 1)
    .map((r, i) => {
      const clean = (s) => (s || '').trim().replace(/^["']|["']$/g, '');
      const rawAmt = parseMoney(clean(r[aI >= 0 ? aI : 2]));
      let date = clean(r[dI >= 0 ? dI : 0]);
      const dm = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
      if (dm) {
        const y = dm[3].length === 2 ? '20' + dm[3] : dm[3];
        date = `${y}-${dm[2].padStart(2, '0')}-${dm[1].padStart(2, '0')}`;
      }
      let type = rawAmt < 0 ? 'DEBIT' : 'CREDIT';
      if (tI >= 0) {
        const t = clean(r[tI]).toUpperCase();
        if (t.includes('DEB') || t === 'D') type = 'DEBIT';
        else if (t.includes('CRE') || t === 'C') type = 'CREDIT';
      }
      return { id: String(i), date, description: clean(r[nI >= 0 ? nI : 1]) || '—', amount: Math.abs(rawAmt), type };
    })
    .filter((l) => l.amount > 0);
};

const parseStatement = (text, filename) => {
  if (filename.toLowerCase().endsWith('.ofx') || text.includes('<STMTTRN>')) return parseOFX(text);
  return parseCSV(text);
};

const splitCSV = (linha, sep) => {
  const cols = [];
  let atual = '',
    emAspas = false;
  for (const ch of linha) {
    if (ch === '"') {
      emAspas = !emAspas;
      continue;
    }
    if (ch === sep && !emAspas) {
      cols.push(atual);
      atual = '';
      continue;
    }
    atual += ch;
  }
  cols.push(atual);
  return cols.map((c) => c.trim());
};

const detectSep = (texto) => {
  const linha = texto.split('\n')[0] || '';
  const conta = (sep) => splitCSV(linha, sep).length - 1;
  const [melhor] = [';', '\t', ','].map((s) => [s, conta(s)]).sort((a, b) => b[1] - a[1]);
  return melhor[1] > 0 ? melhor[0] : ';';
};

const semAcento = (t) =>
  (t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const mapearColunas = (cabecalho, sep) => {
  const h = splitCSV(cabecalho, sep).map(semAcento);
  const achar = (...termos) => h.findIndex((c) => termos.some((t) => c.includes(t)));
  const mapa = {
    descricao: achar('descri', 'histor', 'memo'),
    valor: achar('valor', 'amount', 'value'),
    data: achar('data', 'vencim', 'due'),
    categoria: achar('categ'),
    tipo: achar('tipo', 'type'),
  };
  // Sem descrição e valor reconhecíveis não é cabeçalho: usa ordem posicional
  return mapa.descricao >= 0 && mapa.valor >= 0 ? mapa : null;
};

const paraISO = (d) => {
  const m = (d || '').trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (!m) return (d || '').trim();
  const ano = m[3].length === 2 ? '20' + m[3] : m[3];
  return `${ano}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
};

const lerPlanilha = (texto) => {
  let linhas = texto
    .trim()
    .split('\n')
    .filter((l) => l.trim());
  if (!linhas.length) return [];
  const sep = detectSep(texto);
  const mapa = mapearColunas(linhas[0], sep);
  if (mapa)
    linhas = linhas.slice(1); // cabeçalho nomeado
  else if (parseMoney(splitCSV(linhas[0], sep)[1]) === 0) linhas = linhas.slice(1); // cabeçalho sem nomes
  const col = (cols, chave, posicao) => (mapa ? (mapa[chave] >= 0 ? cols[mapa[chave]] : '') : cols[posicao]);
  const hoje = new Date().toISOString().split('T')[0];

  return linhas.map((l, idx) => {
    const cols = splitCSV(l, sep);
    const tipoTxt = semAcento(col(cols, 'tipo', -1));
    return {
      description: col(cols, 'descricao', 0) || `Importado ${idx + 1}`,
      // valor vem negativo nas saídas: o sinal já está no tipo do lançamento
      amount: Math.abs(parseMoney(col(cols, 'valor', 1))),
      due_date: paraISO(col(cols, 'data', 2)) || hoje,
      catName: col(cols, 'categoria', 3) || '',
      tipo: tipoTxt.startsWith('entrada') ? 'INCOME' : tipoTxt.startsWith('saida') ? 'EXPENSE' : null,
    };
  });
};

export {
  parseMoney,
  parseOFX,
  parseCSV,
  parseStatement,
  splitCSV,
  detectSep,
  semAcento,
  mapearColunas,
  paraISO,
  lerPlanilha,
};
