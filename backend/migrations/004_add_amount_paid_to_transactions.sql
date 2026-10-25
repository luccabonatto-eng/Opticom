-- Migração: baixa parcial em contas a receber e a pagar
-- amount      = valor previsto da conta (não muda com as baixas)
-- amount_paid = quanto já entrou ou saiu de fato, em centavos
-- Em aberto = amount - amount_paid. Status PARTIAL quando 0 < amount_paid < amount.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS amount_paid BIGINT NOT NULL DEFAULT 0;  -- mesmo tipo de amount

-- Lançamentos já quitados antes desta migração: o efetivo é o valor cheio,
-- senão fluxo de caixa e DRE passariam a mostrar zero recebido no histórico.
UPDATE transactions
   SET amount_paid = amount
 WHERE status IN ('PAID', 'RECEIVED')
   AND amount_paid = 0;
