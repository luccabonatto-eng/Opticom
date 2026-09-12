const express = require('express');
const supabase = require('../../config/supabase');
const checkRole = require('../middleware/rbac');

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

router.post('/', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
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
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    // Whitelist explícito - apenas estes campos podem ser atualizados
    const allowedFields = {};
    const fieldMap = ['name', 'sku', 'category', 'quantity', 'min_quantity', 'unit_cost', 'unit_price', 'description'];

    fieldMap.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        allowedFields[field] = req.body[field];
      }
    });

    // Validação robusta
    if (allowedFields.quantity !== undefined && allowedFields.quantity < 0) {
      return res.status(400).json({ error: 'Quantidade não pode ser negativa' });
    }

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

router.delete('/:id', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
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
