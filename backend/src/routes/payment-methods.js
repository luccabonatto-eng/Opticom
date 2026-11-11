const express = require('express');
const supabase = require('../../config/supabase');
const checkPage = require('../middleware/page-access');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('payment_methods').select('*').order('name');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkPage('settings'), async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const { data, error } = await supabase.from('payment_methods').insert([{ name, type }]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkPage('settings'), async (req, res) => {
  try {
    const { error } = await supabase.from('payment_methods').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Método removido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
