const express = require('express');
const supabase = require('../../config/supabase');
const checkRole = require('../middleware/rbac');

const router = express.Router();

// GET all customers com paginação
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
    const offset = parseInt(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      data,
      pagination: {
        limit,
        offset,
        total: count
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Cliente não encontrado' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE customer
router.post('/', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { type, name, doc, city, phone, email, revenue, active } = req.body;

    if (!type || !name || !doc) {
      return res.status(400).json({ error: 'Tipo, nome e documento são obrigatórios' });
    }

    // Validação robusta
    if (revenue !== undefined && revenue !== null && revenue < 0) {
      return res.status(400).json({ error: 'Revenue não pode ser negativo' });
    }

    const { data, error } = await supabase
      .from('customers')
      .insert([
        {
          type,
          name,
          doc,
          city,
          phone,
          email,
          revenue: revenue || 0,
          active: active !== false
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE customer
router.put('/:id', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = {};
    const fieldMap = ['type', 'name', 'doc', 'city', 'phone', 'email', 'revenue', 'active'];
    fieldMap.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        updateData[field] = req.body[field];
      }
    });

    // Validação robusta
    if (updateData.revenue !== undefined && updateData.revenue !== null && updateData.revenue < 0) {
      return res.status(400).json({ error: 'Revenue não pode ser negativo' });
    }

    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Cliente não encontrado' });

    res.json(data[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE customer - RBAC: apenas ADMIN e MANAGER
router.delete('/:id', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se cliente existe
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
