-- Migração: adicionar dados da Nota Fiscal de faturamento nas Ordens de Serviço
-- Guardado como JSONB pois o frontend já monta o objeto {number, series, date, value}

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS nf JSONB;
