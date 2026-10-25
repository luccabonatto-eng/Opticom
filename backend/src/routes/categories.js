const express = require('express');
const supabase = require('../../config/supabase');
const checkRole = require('../middleware/rbac');

const router = express.Router();

const INCOME_CLASSES  = ['RECEITA_SERVICO','RECEITA_CONTRATO','RECEITA_FINANCEIRA','RECEITA_INVESTIMENTO','FINANCIAMENTO_ENTRADA','OUTRAS_RECEITAS'];
// PAGAMENTO_CARTAO é quitação de passivo, não despesa: a despesa já foi
// reconhecida na compra. Sai no fluxo de caixa e é ignorada no DRE, senão o
// mesmo gasto apareceria duas vezes.
const EXPENSE_CLASSES = ['CSP','DESPESA_PESSOAL','DESPESA_ADMINISTRATIVA','DESPESA_COMERCIAL','DESPESA_FINANCEIRA','IMPOSTO_RECEITA','IMPOSTO_RENDA','INVESTIMENTO','DEPRECIACAO','FINANCIAMENTO_SAIDA','PAGAMENTO_CARTAO','OUTRAS_DESPESAS'];

router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const results = {};
    if (!type || type === 'INCOME') {
      const { data, error } = await supabase.from('income_categories').select('*').order('name');
      if (error) throw error;
      results.income = data;
    }
    if (!type || type === 'EXPENSE') {
      const { data, error } = await supabase.from('expense_categories').select('*').order('name');
      if (error) throw error;
      results.expense = data;
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/income', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, description, accounting_class } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const cls = INCOME_CLASSES.includes(accounting_class) ? accounting_class : 'OUTRAS_RECEITAS';
    const { data, error } = await supabase.from('income_categories').insert([{ name, description, accounting_class: cls }]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/expense', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, description, accounting_class } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const cls = EXPENSE_CLASSES.includes(accounting_class) ? accounting_class : 'OUTRAS_DESPESAS';
    const { data, error } = await supabase.from('expense_categories').insert([{ name, description, accounting_class: cls }]).select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/income/:id', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const allowed = {};
    ['name','description','accounting_class'].forEach(f => {
      if (req.body[f] !== undefined) allowed[f] = req.body[f];
    });
    if (allowed.accounting_class && !INCOME_CLASSES.includes(allowed.accounting_class))
      return res.status(400).json({ error: 'accounting_class inválido' });
    const { data, error } = await supabase.from('income_categories').update(allowed).eq('id', req.params.id).select();
    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/expense/:id', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const allowed = {};
    ['name','description','accounting_class'].forEach(f => {
      if (req.body[f] !== undefined) allowed[f] = req.body[f];
    });
    if (allowed.accounting_class && !EXPENSE_CLASSES.includes(allowed.accounting_class))
      return res.status(400).json({ error: 'accounting_class inválido' });
    const { data, error } = await supabase.from('expense_categories').update(allowed).eq('id', req.params.id).select();
    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/income/:id', checkRole('ADMIN'), async (req, res) => {
  try {
    const { error } = await supabase.from('income_categories').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Categoria removida' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/expense/:id', checkRole('ADMIN'), async (req, res) => {
  try {
    const { error } = await supabase.from('expense_categories').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Categoria removida' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
