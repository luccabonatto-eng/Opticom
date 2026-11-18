-- Métricas do técnico: o backend carimba início/fim do atendimento quando a OS
-- muda de etapa, e marca retrabalho quando uma OS concluída volta para trás.
-- Aplicar ANTES de publicar o backend que grava estas colunas.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reopened BOOLEAN NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
