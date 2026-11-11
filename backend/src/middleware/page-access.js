const supabase = require('../../config/supabase');

// Mesmo padrão de frontend/src/config/navigation.js — vale enquanto o ADMIN não salvar permissões.
const DEFAULT_PERMISSIONS = {
  MANAGER: ['dashboard', 'orders', 'financial', 'inventory', 'fleet', 'customers', 'technicians'],
  TECHNICIAN: ['dashboard', 'orders'],
};

// Quem tem acesso à página (Configurações → Usuários) tem acesso completo a ela.
// ADMIN sempre passa. Lê do banco a cada escrita para a mudança valer na hora.
const checkPage = (...pages) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  if (req.user.role === 'ADMIN') return next();
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'permissions')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    const perms = data?.value ? JSON.parse(data.value) : {};
    const allowed = perms[req.user.role] || DEFAULT_PERMISSIONS[req.user.role] || [];
    if (pages.some((p) => allowed.includes(p))) return next();
    return res.status(403).json({ error: 'Acesso negado. Seu perfil não tem acesso a esta página.' });
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

module.exports = checkPage;
