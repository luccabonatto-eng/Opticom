-- Migração: adicionar cliente e tipo de serviço nas transações financeiras
-- Permite rastrear de qual cliente e tipo de serviço veio cada entrada/saída
-- e gerar DRE Gerencial por cliente e por tipo de serviço

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_type VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_service_type  ON transactions(service_type);
