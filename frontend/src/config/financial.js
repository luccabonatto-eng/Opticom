const CLASSES_DESPESA = [
  ['CSP', 'Custo do Serviço (CSP)'],
  ['DESPESA_PESSOAL', 'Pessoal e Folha'],
  ['DESPESA_ADMINISTRATIVA', 'Administrativa'],
  ['DESPESA_COMERCIAL', 'Comercial'],
  ['DESPESA_FINANCEIRA', 'Financeira (juros, tarifas)'],
  ['IMPOSTO_RECEITA', 'Impostos sobre Receita'],
  ['IMPOSTO_RENDA', 'IRPJ / CSLL'],
  ['DEPRECIACAO', 'Depreciação e Amortização'],
  ['INVESTIMENTO', 'Investimento (imobilizado)'],
  ['FINANCIAMENTO_SAIDA', 'Amortização de Empréstimo'],
  ['PAGAMENTO_CARTAO', 'Pagamento de Fatura de Cartão'],
  ['OUTRAS_DESPESAS', 'Outras Despesas'],
];

const CLASSES_RECEITA = [
  ['RECEITA_SERVICO', 'Receita de Serviço'],
  ['RECEITA_CONTRATO', 'Receita de Contrato'],
  ['RECEITA_FINANCEIRA', 'Receita Financeira'],
  ['RECEITA_INVESTIMENTO', 'Venda de Ativo'],
  ['FINANCIAMENTO_ENTRADA', 'Empréstimo / Aporte'],
  ['OUTRAS_RECEITAS', 'Outras Receitas'],
];

const INCOME_CATS_INIT = [
  'Receita de Contratos',
  'Receita de OS',
  'Multas e Juros',
  'Adiantamentos',
  'Outros Recebimentos',
];

const EXPENSE_CATS_INIT = [
  'Pessoal',
  'Material',
  'Combustível',
  'Administrativo',
  'Manutenção',
  'Telecomunicações',
  'Impostos',
  'Outros',
  'Veículo',
  'Hospedagem',
  'Alimentação',
  'Material Operacional',
  'Ferramentas',
  'Material Escritório',
  'Documentação',
  'Outros Gastos',
  'Folha de Pagamento',
  'Imposto',
  'Conta de Luz',
  'Conta de Água',
  'Conta de Internet',
  'Barracão',
];

const DEFAULT_ACCOUNTING_CLASSES = {
  // Receitas
  'Receita de Contratos': 'RECEITA_CONTRATO',
  'Receita de OS': 'RECEITA_SERVICO',
  'Multas e Juros': 'RECEITA_FINANCEIRA',
  Adiantamentos: 'OUTRAS_RECEITAS',
  'Outros Recebimentos': 'OUTRAS_RECEITAS',
  // Custos Diretos dos Serviços Prestados (CSP)
  Material: 'CSP',
  'Material Operacional': 'CSP',
  Ferramentas: 'CSP',
  Manutenção: 'CSP',
  Combustível: 'CSP',
  Veículo: 'CSP',
  Hospedagem: 'CSP',
  Alimentação: 'CSP',
  // Despesas Operacionais — Pessoal
  Pessoal: 'DESPESA_PESSOAL',
  'Folha de Pagamento': 'DESPESA_PESSOAL',
  // Despesas Operacionais — G&A (Administrativo)
  Administrativo: 'DESPESA_ADMINISTRATIVA',
  'Material Escritório': 'DESPESA_ADMINISTRATIVA',
  'Conta de Luz': 'DESPESA_ADMINISTRATIVA',
  'Conta de Água': 'DESPESA_ADMINISTRATIVA',
  'Conta de Internet': 'DESPESA_ADMINISTRATIVA',
  Barracão: 'DESPESA_ADMINISTRATIVA',
  Telecomunicações: 'DESPESA_ADMINISTRATIVA',
  Documentação: 'DESPESA_ADMINISTRATIVA',
  // Outras Despesas
  'Outros Gastos': 'OUTRAS_DESPESAS',
  Outros: 'OUTRAS_DESPESAS',
  // Impostos sobre Receita
  Impostos: 'IMPOSTO_RECEITA',
  Imposto: 'IMPOSTO_RECEITA',
};

const INCOME_CATS_INITIAL_OBJS = INCOME_CATS_INIT.map((n) => ({
  id: n,
  name: n,
  accounting_class: DEFAULT_ACCOUNTING_CLASSES[n] || 'OUTRAS_RECEITAS',
}));

const EXPENSE_CATS_INITIAL_OBJS = EXPENSE_CATS_INIT.map((n) => ({
  id: n,
  name: n,
  accounting_class: DEFAULT_ACCOUNTING_CLASSES[n] || 'OUTRAS_DESPESAS',
}));

const BANK_ACCOUNTS_INIT = [
  { id: 1, bank: 'Bradesco', agency: '0001-9', account: '12345-6', type: 'Corrente', balance: 8500000, active: true },
  { id: 2, bank: 'Itaú', agency: '0042-7', account: '98765-4', type: 'Corrente', balance: 4000000, active: true },
  { id: 3, bank: 'Caixa', agency: '0071-3', account: '00123-0', type: 'Poupança', balance: 150000, active: false },
];

const PAYMENT_METHODS_INIT = [
  { id: 1, name: 'PIX', active: true },
  { id: 2, name: 'Boleto Bancário', active: true },
  { id: 3, name: 'TED / DOC', active: true },
  { id: 4, name: 'Cartão de Crédito', active: false },
  { id: 5, name: 'Cheque', active: false },
  { id: 6, name: 'Dinheiro / Espécie', active: false },
];


export {
  CLASSES_DESPESA,
  CLASSES_RECEITA,
  INCOME_CATS_INIT,
  EXPENSE_CATS_INIT,
  DEFAULT_ACCOUNTING_CLASSES,
  INCOME_CATS_INITIAL_OBJS,
  EXPENSE_CATS_INITIAL_OBJS,
  BANK_ACCOUNTS_INIT,
  PAYMENT_METHODS_INIT,
};
