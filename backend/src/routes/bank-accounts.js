const express = require('express');
const supabase = require('../../config/supabase');
const checkPage = require('../middleware/page-access');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('bank_accounts').select('*').order('name');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkPage('settings'), async (req, res) => {
  try {
    const { name, bank_name, account_number, balance, initial_balance } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert([{ name, bank_name, account_number, balance: balance || 0, initial_balance: initial_balance || 0 }])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkPage('settings'), async (req, res) => {
  try {
    const allowed = {};
    ['name', 'bank_name', 'account_number', 'balance', 'initial_balance'].forEach(f => {
      if (req.body.hasOwnProperty(f)) allowed[f] = req.body[f];
    });
    const { data, error } = await supabase
      .from('bank_accounts')
      .update({ ...allowed, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Conta não encontrada' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkPage('settings'), async (req, res) => {
  try {
    const { error } = await supabase.from('bank_accounts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Conta removida' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
