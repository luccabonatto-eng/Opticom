-- Os 195 lançamentos baixados estavam todos sem conta bancária, e a conferência
-- do extrato casa lançamento com movimento pela conta: sem ela, nenhum entra na
-- conciliação e a diferença acusa o extrato inteiro.
-- Existe uma única conta ativa cadastrada, a mesma do extrato conciliado
-- (Itaú Ag.0615 CC 35792-8). A guarda de contagem impede que este backfill
-- escolha uma conta errada se for executado depois que houver mais de uma.
UPDATE transactions
   SET bank_account_id = (SELECT id FROM bank_accounts WHERE active ORDER BY created_at LIMIT 1)
 WHERE bank_account_id IS NULL
   AND COALESCE(amount_paid, 0) > 0
   AND (SELECT count(*) FROM bank_accounts WHERE active) = 1;
