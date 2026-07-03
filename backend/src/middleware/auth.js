const jwt = require('jsonwebtoken');

const DEMO_TOKEN = 'demo-preview-opticom-2026';

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Modo demo: permite acesso sem login para visualização
    if (token === DEMO_TOKEN) {
      req.user = { id: 'demo', name: 'Demo', role: 'ADMIN' };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

module.exports = authMiddleware;
