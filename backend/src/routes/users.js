const express = require('express');
const bcrypt   = require('bcrypt');
const supabase = require('../../config/supabase');
const checkRole = require('../middleware/rbac');

const router = express.Router();

const ROLES = ['ADMIN', 'MANAGER', 'TECHNICIAN'];
const STATUSES = ['ACTIVE', 'INACTIVE'];

// Sem isto o sistema pode ficar sem nenhum ADMIN, e criar usuário exige ADMIN:
// ninguém conseguiria criar o próximo.
const ehUltimoAdmin = async id => {
  const { data } = await supabase.from('users').select('id').eq('role', 'ADMIN').eq('status', 'ACTIVE');
  return (data || []).length <= 1 && (data || []).some(u => u.id === id);
};

// GET all users — ADMIN/MANAGER
router.get('/', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, status, last_login, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user status/role — ADMIN only
router.put('/:id', checkRole('ADMIN'), async (req, res) => {
  try {
    const allowed = {};
    ['role', 'status', 'name'].forEach(f => {
      if (req.body.hasOwnProperty(f)) allowed[f] = req.body[f];
    });

    // Role inválido passava e o usuário era recusado em toda tela, sem explicação
    if (allowed.role !== undefined && !ROLES.includes(allowed.role)) {
      return res.status(400).json({ error: `Role inválido. Use: ${ROLES.join(', ')}` });
    }
    if (allowed.status !== undefined && !STATUSES.includes(allowed.status)) {
      return res.status(400).json({ error: `Status inválido. Use: ${STATUSES.join(', ')}` });
    }

    const perdeAdmin = (allowed.role && allowed.role !== 'ADMIN') || allowed.status === 'INACTIVE';
    if (perdeAdmin && await ehUltimoAdmin(req.params.id)) {
      return res.status(409).json({ error: 'Este é o último administrador ativo. Promova outro antes de alterá-lo.' });
    }
    if (req.body.password) {
      allowed.password_hash = await bcrypt.hash(req.body.password, 10);
      // Remove o valor em texto puro: o middleware de auditoria serializa
      // req.body e a senha acabaria gravada em audit_logs.detail
      delete req.body.password;
    }

    const { data, error } = await supabase
      .from('users')
      .update({ ...allowed, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id, name, email, role, status');

    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE permanently — ADMIN only (hard delete)
router.delete('/:id', checkRole('ADMIN'), async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existing) return res.status(404).json({ error: 'Usuário não encontrado' });

    if (req.params.id === req.user?.id) {
      return res.status(409).json({ error: 'Você não pode excluir a própria conta.' });
    }
    if (await ehUltimoAdmin(req.params.id)) {
      return res.status(409).json({ error: 'Este é o último administrador ativo. Promova outro antes de excluí-lo.' });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Usuário excluído permanentemente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
