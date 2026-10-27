const FIN_INFO = {
  // ── DFC ────────────────────────────────────────────────────────────────
  'dfc-oper': {
    title: 'Atividades Operacionais',
    calc: 'Recebimentos de Clientes − CSP − Pessoal − Administrativo/Comercial − Impostos − Outros Operacionais',
    desc: 'Mostra o caixa gerado ou consumido pelas atividades-fim da empresa (prestar serviços, pagar fornecedores, pessoal e impostos). É o indicador mais importante da saúde financeira operacional: se for positivo e recorrente, a empresa gera caixa com seu próprio negócio.',
  },
  'dfc-inv': {
    title: 'Atividades de Investimento',
    calc: 'Recebimentos de Venda de Ativos − Pagamentos de Compra de Equipamentos/Veículos',
    desc: 'Representa o caixa gasto ou recebido na aquisição e venda de ativos de longa duração (imobilizado, veículos, equipamentos). Saídas aqui são normalmente sinal de crescimento ou renovação da capacidade produtiva.',
  },
  'dfc-fin': {
    title: 'Atividades de Financiamento',
    calc: 'Empréstimos Obtidos / Aportes − Amortizações e Juros Pagos',
    desc: 'Reflete movimentações com credores e sócios: empréstimos captados, aportes de capital, pagamento de parcelas e juros. Entradas indicam captação; saídas indicam amortização de dívidas.',
  },
  'dfc-var': {
    title: 'Variação Líquida de Caixa',
    calc: 'Atividades Operacionais + Atividades de Investimento + Atividades de Financiamento',
    desc: 'É o resultado final do período: quanto o caixa aumentou ou diminuiu. Soma os três grupos de atividades. Positivo = a empresa terminou o período com mais caixa do que começou.',
  },
  'dfc-ini': {
    title: 'Saldo Inicial do Período',
    calc: 'Configurado em Configurações → Contas e Saldos → Saldo Inicial de cada conta bancária',
    desc: 'Representa o saldo total em caixa e contas bancárias no início do período analisado. É a base a partir da qual a variação líquida é somada para chegar ao saldo final.',
  },
  'dfc-fin2': {
    title: 'Saldo Final Projetado',
    calc: 'Saldo Inicial + Variação Líquida de Caixa',
    desc: 'Estimativa do saldo em caixa ao final do período, combinando o saldo de abertura com todas as movimentações registradas. Serve como projeção do quanto a empresa terá disponível no banco ao encerrar o período.',
  },
  // ── DRE KPIs ───────────────────────────────────────────────────────────
  'dre-recliq': {
    title: 'Receita Líquida',
    calc: 'Receita Bruta − Deduções (ISS, PIS, COFINS e outros impostos sobre receita)',
    desc: 'É o valor que a empresa efetivamente faturou após descontar todos os impostos incidentes sobre a receita bruta. É a base de cálculo das demais margens e a linha de partida do DRE.',
  },
  'dre-lb': {
    title: 'Lucro Bruto',
    calc: 'Receita Líquida − Custo dos Serviços Prestados (CSP)',
    desc: 'Resultado depois de deduzir apenas os custos diretamente ligados à execução do serviço (mão de obra técnica, peças e materiais aplicados, subcontratados). Mede a eficiência operacional bruta antes das despesas estruturais.',
  },
  'dre-ebit': {
    title: 'EBIT — Resultado Operacional',
    calc: 'Lucro Bruto − Despesas Operacionais (Pessoal + Administrativo + Comercial)',
    desc: 'Earnings Before Interest and Taxes — lucro antes do resultado financeiro e do imposto de renda. Representa o resultado gerado exclusivamente pela operação, sem interferência de como a empresa é financiada ou da alíquota tributária.',
  },
  'dre-ebitda': {
    title: 'EBITDA',
    calc: 'EBIT + Depreciação e Amortização (D&A)',
    desc: 'Earnings Before Interest, Taxes, Depreciation and Amortization. Elimina o efeito não-caixa da depreciação e amortização, aproximando o resultado operacional ao caixa gerado pela operação. Muito usado para comparar empresas e avaliar capacidade de pagamento de dívidas.',
  },
  'dre-ll': {
    title: 'Lucro Líquido',
    calc: 'LAIR (Lucro Antes do IR) − IRPJ e CSLL',
    desc: 'O resultado final do exercício — o que sobra para os sócios após todas as deduções: custos, despesas operacionais, resultado financeiro e impostos sobre o lucro. Se positivo, pode ser distribuído como dividendos ou reinvestido.',
  },
  // ── DRE Margens ────────────────────────────────────────────────────────
  'mg-bruta': {
    title: 'Margem Bruta',
    calc: 'Lucro Bruto ÷ Receita Líquida × 100',
    desc: 'Percentual da receita que sobra após pagar os custos diretos do serviço. Uma margem bruta alta indica eficiência na execução. Em empresas de serviços, valores entre 40–70% são comuns; abaixo de 30% pode indicar custo de execução elevado.',
  },
  'mg-oper': {
    title: 'Margem Operacional',
    calc: 'EBIT ÷ Receita Líquida × 100',
    desc: 'Percentual da receita que se converte em resultado operacional, já descontadas todas as despesas estruturais (pessoal, administrativo, comercial). Indica o quanto a operação é lucrativa antes de considerar juros e impostos.',
  },
  'mg-liq': {
    title: 'Margem Líquida',
    calc: 'Lucro Líquido ÷ Receita Líquida × 100',
    desc: 'Percentual final que sobra para os sócios de cada R$ faturado. É a margem mais completa pois considera todos os custos, despesas, resultado financeiro e impostos sobre o lucro. Em empresas de serviços B2B, margens entre 8–20% são consideradas saudáveis.',
  },
};

export { FIN_INFO };
