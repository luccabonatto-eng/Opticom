const express = require('express');
const supabase = require('../../config/supabase');
const checkRole = require('../middleware/rbac');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
    const offset = parseInt(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from('technicians')
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
      .from('technicians')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Técnico não encontrado' });
    }
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Técnico não encontrado' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, phone, email, specializations, status } = req.body;

    if (!name) return res.status(400).json({ error: 'Nome obrigatório' });

    const { data, error } = await supabase
      .from('technicians')
      .insert([{ name, phone, email, specializations, status: status || 'ACTIVE' }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    // Whitelist explícito - apenas estes campos podem ser atualizados
    const allowedFields = {};
    const fieldMap = ['name', 'phone', 'email', 'specializations', 'status', 'avg_time', 'rework_percentage'];

    fieldMap.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        allowedFields[field] = req.body[field];
      }
    });

    const { data, error } = await supabase
      .from('technicians')
      .update({ ...allowedFields, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Técnico não encontrado' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('technicians')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Técnico não encontrado' });
    }

    const { error } = await supabase
      .from('technicians')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Técnico deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
