-- Migração: status PARTIAL para baixa parcial
-- A restrição original só aceitava PENDING/PAID/RECEIVED/OVERDUE, então gravar
-- uma baixa parcial estourava erro de constraint. CANCELLED nunca existiu aqui:
-- o backend o aceitava na validação e o banco recusava depois (500 em vez de 400).

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_status_check
  CHECK (status = ANY (ARRAY['PENDING'::text, 'PARTIAL'::text, 'PAID'::text, 'RECEIVED'::text, 'OVERDUE'::text]));
