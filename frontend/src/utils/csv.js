const csvNum = (c) => ((Number(c) || 0) / 100).toFixed(2).replace('.', ',');

const csvPct = (p) => (Number(p) || 0).toFixed(1).replace('.', ',');

const baixarCSV = (nome, linhas) => {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const texto = linhas.map((l) => (l || []).map(esc).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8;' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nome });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export { csvNum, csvPct, baixarCSV };
