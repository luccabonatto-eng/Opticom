-- As receitas importadas do extrato vinham sem cliente, então o DRE por
-- cliente abria vazio e o DRE geral jogava tudo em "não classificado".
-- A descrição do extrato traz o CNPJ do pagador; o vínculo é feito pela raiz
-- de 8 dígitos, que casa matriz e filial (a CLARO paga pela 0001-47 e está
-- cadastrada como 0101-00). Só receitas: uma compra DE um fornecedor que
-- também é cliente não é custo DELE.
-- Confere 21 lançamentos: 16 COPEL, 3 CLARO, 2 HOPPECKE. Os 16 restantes não
-- têm pagador identificável (boletos, resgate de aplicação, rendimentos,
-- PIX devolvido) e continuam sem cliente, de propósito.
UPDATE transactions t
   SET customer_id = c.id
  FROM customers c
 WHERE t.customer_id IS NULL
   AND t.type = 'INCOME'
   AND length(regexp_replace(c.doc, '\D', '', 'g')) >= 8
   AND position(left(regexp_replace(c.doc, '\D', '', 'g'), 8) in regexp_replace(t.description, '\D', '', 'g')) > 0;
