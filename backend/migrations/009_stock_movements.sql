-- Histórico de movimentação por produto (Estoque).
-- Antes o ajuste gravava só a quantidade nova: não sobrava quem mexeu, quando,
-- quanto nem o motivo. Agora toda mudança de quantidade passa por
-- register_stock_movement, que altera o saldo e grava o movimento na mesma
-- transação (dois ajustes simultâneos não se sobrescrevem).

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('IN', 'OUT')),
  quantity integer NOT NULL CHECK (quantity > 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  note text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON stock_movements (product_id, created_at DESC);

CREATE OR REPLACE FUNCTION register_stock_movement(
  p_product uuid, p_type text, p_quantity integer, p_note text, p_user uuid
) RETURNS stock_movements
LANGUAGE plpgsql AS $$
DECLARE
  v_balance integer;
  v_row stock_movements;
BEGIN
  IF p_type NOT IN ('IN', 'OUT') OR p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Movimento inválido' USING ERRCODE = '22023';
  END IF;

  UPDATE products
     SET quantity = COALESCE(quantity, 0) + CASE WHEN p_type = 'IN' THEN p_quantity ELSE -p_quantity END,
         updated_at = now()
   WHERE id = p_product
  RETURNING quantity INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado' USING ERRCODE = 'P0002';
  END IF;
  -- A exceção desfaz o UPDATE acima: o saldo nunca fica negativo.
  IF v_balance < 0 THEN
    RAISE EXCEPTION 'Saída maior que o estoque disponível' USING ERRCODE = '23514';
  END IF;

  INSERT INTO stock_movements (product_id, type, quantity, balance_after, note, user_id)
  VALUES (p_product, p_type, p_quantity, v_balance, NULLIF(trim(p_note), ''), p_user)
  RETURNING * INTO v_row;
  RETURN v_row;
END $$;

-- Ponto de partida: o saldo atual de cada produto vira o primeiro registro.
INSERT INTO stock_movements (product_id, type, quantity, balance_after, note)
SELECT p.id, 'IN', p.quantity, p.quantity, 'Saldo na implantação do histórico'
  FROM products p
 WHERE p.quantity > 0
   AND NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id);

-- Faz a API do Supabase enxergar a tabela e a função novas sem esperar.
NOTIFY pgrst, 'reload schema';
