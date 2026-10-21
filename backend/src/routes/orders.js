const express = require('express');
const supabase = require('../../config/supabase');
const checkRole = require('../middleware/rbac');

const router = express.Router();

// GET all orders com paginação
router.get('/', async (req, res) => {
  try {
    const { status, customer_id } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
    const offset = parseInt(req.query.offset) || 0;

    let query = supabase.from('orders').select('*, customers(*), technicians(*)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (customer_id) query = query.eq('customer_id', customer_id);

    const { data, error, count } = await query
      .order('number', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({
      data,
      pagination: { limit, offset, total: count }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(*), technicians(*)')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'OS não encontrada' });
    }
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'OS não encontrada' });

    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE order
// Abrir OS é tarefa de escritório. O PUT segue liberado para qualquer autenticado
// porque o técnico atualiza status/conclusão da própria OS em campo.
router.post('/', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { customer_id, type, priority, status, assigned_technician_id, scheduled_date, substation, city, description } = req.body;
    if (!customer_id || !type) {
      return res.status(400).json({ error: 'customer_id e type são obrigatórios' });
    }

    // Número sempre pela sequence: aceitar do cliente permitia duas OS iguais
    let number;
    {
      const { data: seqData, error: seqErr } = await supabase.rpc('next_order_number');
      if (seqErr) throw seqErr;
      number = seqData;
    }

    const { difficulty, additional_technicians } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        number,
        customer_id,
        type,
        priority: priority || 'MEDIUM',
        difficulty: difficulty || 'MEDIUM',
        status: status || 'OPEN',
        assigned_technician_id: assigned_technician_id || null,
        additional_technicians: additional_technicians || [],
        scheduled_date: scheduled_date || null,
        substation: substation || null,
        city: city || null,
        description: description || null
      }])
      .select('*, customers(*), technicians(*)');

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE order
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Whitelist explícito - apenas estes campos podem ser atualizados
    const allowedFields = {};
    const fieldMap = ['type', 'priority', 'difficulty', 'status', 'assigned_technician_id', 'additional_technicians', 'scheduled_date', 'completed_date', 'substation', 'city', 'description', 'nf'];

    fieldMap.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        allowedFields[field] = req.body[field];
      }
    });

    const { data, error } = await supabase
      .from('orders')
      .update({
        ...allowedFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, customers(*), technicians(*)');

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'OS não encontrada' });

    res.json(data[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE order - RBAC: apenas ADMIN e MANAGER
router.delete('/:id', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'OS não encontrada' });
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'OS deletada com sucesso' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
