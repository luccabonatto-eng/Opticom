// Relatório para colar no WhatsApp: não existe tabela nem coluna, então cada
// linha é "rótulo: valor". *Asterisco* é o negrito do WhatsApp.
const textoWhats = (titulo, linhas) => [`*${titulo}*`, ...linhas].filter((l) => l != null).join('\n');

// Abre o WhatsApp com a mensagem pronta; quem envia escolhe o contato.
// shortcut: wa.me carrega o texto na URL, então relatório muito longo não cabe
// — por isso as listas são as maiores linhas, não todas. Virar imagem ou PDF
// se pedirem o relatório inteiro.
const enviarWhats = (titulo, linhas) => {
  window.open(`https://wa.me/?text=${encodeURIComponent(textoWhats(titulo, linhas))}`, '_blank', 'noopener');
};

export { textoWhats, enviarWhats };
