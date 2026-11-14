-- O Supabase liga RLS em tabelas novas; sem política o backend (chave anon)
-- não lê nem grava o histórico. Mesmo acesso das demais tabelas: o site não
-- fala com o banco direto, só via backend, que exige login e checa a página.
CREATE POLICY "backend acessa historico de estoque" ON stock_movements
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
