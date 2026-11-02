// Relatório para colar no WhatsApp: não existe tabela nem coluna, então cada
// linha é "rótulo: valor". *Asterisco* é o negrito do WhatsApp.
const textoWhats = (titulo, linhas) => [`*${titulo}*`, ...linhas].filter((l) => l != null).join('\n');

// Copia para a área de transferência; quem envia cola na conversa. Devolve se
// deu certo para quem chamou avisar — navegador antigo ou sem permissão não
// copia, e um erro silencioso aqui faria a pessoa colar o conteúdo anterior.
const copiarWhats = async (titulo, linhas) => {
  try {
    await navigator.clipboard.writeText(textoWhats(titulo, linhas));
    return true;
  } catch {
    return false;
  }
};

export { textoWhats, copiarWhats };
