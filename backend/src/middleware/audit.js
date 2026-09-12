const supabase = require('../../config/supabase');

const ACTIONS = { POST: 'Criou', PUT: 'Atualizou', PATCH: 'Atualizou', DELETE: 'Excluiu' };

const SENSITIVE_FIELDS = ['password', 'senha', 'password_hash', 'token', 'secret', 'apiKey', 'api_key'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const redact = value => {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) =>
      [k, SENSITIVE_FIELDS.includes(k) ? '[REDACTED]' : redact(v)]
    ));
  }
  return value;
};

const createAuditMiddleware = (module) => (req, res, next) => {
  if (req.method === 'GET') return next();
  const orig = res.json.bind(res);
  res.json = function (data) {
    // user_id é FK uuid: sessões sem usuário real (modo demo) não geram log
    if (res.statusCode >= 200 && res.statusCode < 300 && UUID_RE.test(req.user?.id || '')) {
      const action = ACTIONS[req.method] || req.method;
      const detail = JSON.stringify(redact(req.body || {})).slice(0, 300);
      supabase.from('audit_logs')
        .insert([{ user_id: req.user.id, module, action, detail, ip_address: req.ip }])
        .then(({ error }) => { if (error) console.error('Audit log falhou:', error.message); })
        .catch(err => console.error('Audit log falhou:', err.message));
    }
    return orig(data);
  };
  next();
};

module.exports = createAuditMiddleware;
