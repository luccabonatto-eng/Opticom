-- Repete o backfill da 004 para os lançamentos criados DEPOIS dela.
-- A importação do extrato gravava status PAID/RECEIVED sem amount_paid, então
-- a conta aparecia quitada e 100% em aberto ao mesmo tempo, e sumia do caixa
-- efetivo no fluxo de caixa e no DRE.
UPDATE transactions
   SET amount_paid = amount
 WHERE status IN ('PAID', 'RECEIVED')
   AND amount_paid = 0;
