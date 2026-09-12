-- Migração: adicionar número da Nota Fiscal nas transações financeiras
-- Permite registrar a NF vinculada a um recebimento

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);
