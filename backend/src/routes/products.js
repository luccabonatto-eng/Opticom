const express = require('express');
const supabase = require('../../config/supabase');
const checkPage = require('../middleware/page-access');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
    const offset = parseInt(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({
      data,
      pagination: { limit, offset, total: count }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Histórico de movimentação do produto, mais recente primeiro
router.get('/:id/movements', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*, users(name)')
      .eq('product_id', req.params.id)
      .order('created_at', { ascending: false })
      .range(0, 499);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Entrada ou saída: o banco ajusta o saldo e grava o movimento juntos
const MOVEMENT_ERRORS = { P0002: 404, '23514': 400, '22023': 400 };
router.post('/:id/movements', checkPage('inventory'), async (req, res) => {
  try {
    const { type, quantity, note } = req.body;
    if (!['IN', 'OUT'].includes(type)) return res.status(400).json({ error: 'Tipo deve ser IN (entrada) ou OUT (saída)' });
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser um número inteiro maior que zero' });
    }
    const { data, error } = await supabase.rpc('register_stock_movement', {
      p_product: req.params.id,
      p_type: type,
      p_quantity: quantity,
      p_note: note || null,
      p_user: req.user?.id || null,
    });
    if (error) {
      const status = MOVEMENT_ERRORS[error.code];
      if (status) return res.status(status).json({ error: error.message });
      throw error;
    }
    res.status(201).json({ ...data, users: { name: req.user?.name || null } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkPage('inventory'), async (req, res) => {
  try {
    const { name, sku, category, quantity, min_quantity, unit_cost, unit_price, description } = req.body;

    if (!name || !sku) return res.status(400).json({ error: 'Nome e SKU obrigatórios' });

    if (quantity !== undefined && quantity !== null && quantity < 0) {
      return res.status(400).json({ error: 'Quantidade não pode ser negativa' });
    }
    if (unit_cost !== undefined && unit_cost !== null && unit_cost < 0) {
      return res.status(400).json({ error: 'Custo unitário não pode ser negativo' });
    }
    if (unit_price !== undefined && unit_price !== null && unit_price < 0) {
      return res.status(400).json({ error: 'Preço unitário não pode ser negativo' });
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{ name, sku, category, quantity: quantity || 0, min_quantity: min_quantity || 0, unit_cost, unit_price, description }])
      .select();

    if (error) throw error;

    // Estoque inicial entra no histórico como primeira entrada
    if (data[0].quantity > 0) {
      const { error: movError } = await supabase.from('stock_movements').insert([{
        product_id: data[0].id,
        type: 'IN',
        quantity: data[0].quantity,
        balance_after: data[0].quantity,
        note: 'Estoque inicial',
        user_id: req.user?.id || null,
      }]);
      // shortcut: produto fica criado mesmo se o registro falhar; mover para uma função no banco se isso ocorrer
      if (movError) console.error('Histórico do estoque inicial falhou:', movError.message);
    }
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkPage('inventory'), async (req, res) => {
  try {
    // Whitelist explícito - apenas estes campos podem ser atualizados
    const allowedFields = {};
    // Quantidade só muda por /:id/movements, para o histórico ficar completo
    if (req.body.hasOwnProperty('quantity')) {
      return res.status(400).json({ error: 'Use entrada/saída de estoque para alterar a quantidade' });
    }
    const fieldMap = ['name', 'sku', 'category', 'min_quantity', 'unit_cost', 'unit_price', 'description'];

    fieldMap.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        allowedFields[field] = req.body[field];
      }
    });

    // Validação robusta
    if (allowedFields.unit_cost !== undefined && allowedFields.unit_cost < 0) {
      return res.status(400).json({ error: 'Custo unitário não pode ser negativo' });
    }

    if (allowedFields.unit_price !== undefined && allowedFields.unit_price < 0) {
      return res.status(400).json({ error: 'Preço unitário não pode ser negativo' });
    }

    const { data, error } = await supabase
      .from('products')
      .update({ ...allowedFields, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkPage('inventory'), async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
