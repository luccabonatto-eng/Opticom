const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const supabase = require('../../config/supabase');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/rbac');

const router = express.Router();

// Criar usuário — exclusivo de ADMIN autenticado.
// Antes esta rota era pública e aceitava role no corpo, permitindo que
// qualquer pessoa criasse a própria conta de administrador.
router.post('/register', authMiddleware, checkRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role = 'TECHNICIAN' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (role && !['ADMIN', 'MANAGER', 'TECHNICIAN'].includes(role)) {
      return res.status(400).json({ error: 'Role inválido' });
    }

    // Validar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Inserir usuário no banco
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password_hash: passwordHash,
          role
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message || 'Erro ao registrar usuário' });
    }

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: {
        id: data[0].id,
        name: data[0].name,
        email: data[0].email,
        role: data[0].role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !users) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Validar senha
    const passwordMatch = await bcrypt.compare(password, users.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Verificar se usuário está ativo
    if (users.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Usuário inativo' });
    }

    // Atualizar last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', users.id);

    // Gerar JWT
    const token = jwt.sign(
      {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Resposta com token no Authorization header
    res.json({
      message: 'Login bem-sucedido',
      token, // Enviado no Authorization header do frontend
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    // Tentar ler token do cookie (HttpOnly) - preferência
    let token = req.cookies && req.cookies.opticom_token;

    // Fallback: tentar ler do Authorization header (backward compatibility)
    if (!token) {
      token = req.headers.authorization?.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Verificar token SEM ignorar expiração - token deve estar válido
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
      }
      throw error;
    }

    // Reconsultar o usuário: sem isto, desativar, excluir ou rebaixar uma conta
    // não encerra a sessão — o titular renova indefinidamente com o perfil antigo.
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, status')
      .eq('id', decoded.id)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Usuário não encontrado. Faça login novamente.' });
    }
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Usuário inativo' });
    }

    // Perfil vem do banco, não do token: rebaixamento passa a valer na renovação
    const newToken = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Token renovado com sucesso',
      token: newToken // Enviado no Authorization header
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Get current user
router.get('/me', (req, res) => {
  try {
    // Tentar ler token do cookie (HttpOnly) - preferência
    let token = req.cookies && req.cookies.opticom_token;

    // Fallback: tentar ler do Authorization header
    if (!token) {
      token = req.headers.authorization?.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;
