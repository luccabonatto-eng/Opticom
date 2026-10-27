const express = require('express');
const supabase = require('../../config/supabase');
const checkRole = require('../middleware/rbac');

const router = express.Router();

// GET a specific setting
router.get('/:key', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('key', req.params.key)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update a setting — ADMIN/MANAGER
router.put('/:key', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'value é obrigatório' });

    // Compare-and-swap: a stale browser must not replace another user's work.
    if (Object.prototype.hasOwnProperty.call(req.body, 'expectedValue')) {
      const { expectedValue } = req.body;
      if (expectedValue !== null && typeof expectedValue !== 'string') {
        return res.status(400).json({ error: 'expectedValue deve ser texto ou null' });
      }
      const record = { key: req.params.key, value: String(value), updated_at: new Date().toISOString() };
      const query = expectedValue === null
        ? supabase.from('system_settings').insert(record)
        : supabase.from('system_settings').update(record).eq('key', req.params.key).eq('value', expectedValue);
      const { data, error } = await query.select();
      if (error?.code === '23505' || (!error && !data?.length)) {
        return res.status(409).json({ error: 'Outro usuário alterou esta conferência. Recarregue antes de salvar.' });
      }
      if (error) throw error;
      return res.json(data[0]);
    }

    const { data, error } = await supabase
      .from('system_settings')
      .upsert({ key: req.params.key, value: String(value), updated_at: new Date().toISOString() })
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
