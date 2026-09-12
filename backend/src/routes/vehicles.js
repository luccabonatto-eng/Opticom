const express = require('express');
const supabase = require('../../config/supabase');
const checkRole = require('../middleware/rbac');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
    const offset = parseInt(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from('vehicles')
      .select('*, technicians(*)', { count: 'exact' })
      .order('plate')
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
      .from('vehicles')
      .select('*, technicians(*)')
      .eq('id', req.params.id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Veículo não encontrado' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { plate, model, year, assigned_technician_id, status } = req.body;

    if (!plate || !model) return res.status(400).json({ error: 'Placa e modelo obrigatórios' });

    const { data, error } = await supabase
      .from('vehicles')
      .insert([{ plate, model, year, assigned_technician_id, status: status || 'AVAILABLE' }])
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
    const fieldMap = ['plate', 'model', 'year', 'assigned_technician_id', 'status', 'odometer', 'last_service_date', 'next_service_date'];

    fieldMap.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        allowedFields[field] = req.body[field];
      }
    });

    const { data, error } = await supabase
      .from('vehicles')
      .update({ ...allowedFields, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Veículo não encontrado' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Veículo deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET maintenance history for a vehicle
router.get('/:id/maintenance', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vehicle_maintenance')
      .select('*')
      .eq('vehicle_id', req.params.id)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST register maintenance for a vehicle
router.post('/:id/maintenance', async (req, res) => {
  try {
    const { date, type, description, km, cost, technician_name } = req.body;

    if (!date || !type) {
      return res.status(400).json({ error: 'Data e tipo são obrigatórios' });
    }

    const { data, error } = await supabase
      .from('vehicle_maintenance')
      .insert([{
        vehicle_id: req.params.id,
        date,
        type,
        description: description || null,
        km: km || null,
        cost: cost || 0,
        technician_name: technician_name || null
      }])
      .select();

    if (error) throw error;

    // Atualizar last_service_date do veículo
    await supabase
      .from('vehicles')
      .update({ last_service_date: date, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
