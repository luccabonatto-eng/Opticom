const express = require('express');
const supabase = require('../../config/supabase');
const checkRole = require('../middleware/rbac');

const router = express.Router();

// GET audit logs - RBAC: apenas ADMIN
router.get('/', checkRole('ADMIN'), async (req, res) => {
  try {
    const { module, user_id } = req.query;
    // parseInt obrigatório: vindos da querystring são texto, e "10" + "50"
    // concatenava em "1050", devolvendo 1040 linhas em vez de 50
    const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
    const offset = parseInt(req.query.offset) || 0;
    let query = supabase.from('audit_logs').select('*, users(name, email)');

    if (module) query = query.eq('module', module);
    if (user_id) query = query.eq('user_id', user_id);

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET audit log by ID - RBAC: apenas ADMIN
router.get('/:id', checkRole('ADMIN'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, users(name, email)')
      .eq('id', req.params.id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Log não encontrado' });
    }
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Log não encontrado' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create audit log - RBAC: apenas ADMIN
router.post('/', checkRole('ADMIN'), async (req, res) => {
  try {
    const { user_id, module, action, detail, ip_address } = req.body;

    if (!user_id || !module || !action) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .insert([{ user_id, module, action, detail, ip_address }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
