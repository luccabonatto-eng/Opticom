export const fmt = c => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(c/100);
export const fmtDate = d => d ? new Date(d+'T12:00:00').toLocaleDateString('pt-BR') : '—';
