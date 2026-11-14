// As telas passam só o texto do aviso. Sucesso é o que nós escrevemos (lista
// conhecida); o resto — erro do servidor, validação, alerta — sai como erro.
const ERRO = /^erro|erro ao|não foi|não pode|falh|negado|inválid/i;
const SUCESSO =
  /!$|sucesso|cadastrad|criad[oa]s?\b|salv[oa]s?\b|atualizad|excluíd|desativad|cancelad|estornad|copiad|renovad|vinculad|ajustad|concluíd|importad|baixad|aprovad|quitad|\bpaga\b|parcial/i;

const toastKind = (msg) => (!ERRO.test(msg) && SUCESSO.test(msg) ? 'success' : 'error');

export { toastKind };
