require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');

const authRoutes = require('./routes/auth');
const customersRoutes = require('./routes/customers');
const contractsRoutes = require('./routes/contracts');
const ordersRoutes = require('./routes/orders');
const techniciansRoutes = require('./routes/technicians');
const vehiclesRoutes = require('./routes/vehicles');
const productsRoutes = require('./routes/products');
const transactionsRoutes = require('./routes/transactions');
const auditRoutes = require('./routes/audit');
const categoriesRoutes = require('./routes/categories');
const bankAccountsRoutes = require('./routes/bank-accounts');
const paymentMethodsRoutes = require('./routes/payment-methods');
const usersRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');

const authMiddleware = require('./middleware/auth');
const checkRole = require('./middleware/rbac');
const audit = require('./middleware/audit');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: apenas origens explícitas (CORS_ORIGIN) + localhost de desenvolvimento.
// Curingas como *.vercel.app não são aceitos: qualquer pessoa pode registrar um
// subdomínio nesses provedores e faria requisições autenticadas contra esta API.
const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()).filter(Boolean) || [];

const corsOriginFn = (origin, callback) => {
  if (!origin) return callback(null, true); // requests sem origin (curl, Postman, etc.)
  const allowed = [
    ...corsOrigins,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
  ];
  // false (e não Error) para a origem só ficar sem o header de permissão:
  // lançar virava 500 e enchia o log de erro a cada bloqueio
  return callback(null, allowed.includes(origin));
};

// Middleware
app.use(cors({
  origin: corsOriginFn,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies (para HttpOnly tokens)

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requisições por IP
  message: JSON.stringify({ error: 'Muitas requisições, tente novamente mais tarde' }),
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 tentativas por hora
  message: JSON.stringify({ error: 'Muitas tentativas de autenticação, tente novamente em 1 hora' }),
  skipSuccessfulRequests: true // Não conta requisições bem-sucedidas
});

// Aplicar rate limiting global
app.use('/api/', generalLimiter);

// Swagger Documentation — ADMIN: expõe o mapa completo da API
app.use('/api-docs', authMiddleware, checkRole('ADMIN'), swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: { persistAuthorization: true }
}));

// Routes (sem autenticação) - com rate limiting mais estrito
app.use('/api/auth', authLimiter, authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rotas protegidas (requerem autenticação)
app.use('/api/customers',       authMiddleware, audit('Clientes'),   customersRoutes);
app.use('/api/contracts',       authMiddleware, audit('Contratos'),  contractsRoutes);
app.use('/api/orders',          authMiddleware, audit('OS'),         ordersRoutes);
app.use('/api/technicians',     authMiddleware, audit('Técnicos'),   techniciansRoutes);
app.use('/api/vehicles',        authMiddleware, audit('Frota'),      vehiclesRoutes);
app.use('/api/products',        authMiddleware, audit('Estoque'),    productsRoutes);
app.use('/api/transactions',    authMiddleware, audit('Financeiro'), transactionsRoutes);
app.use('/api/audit',           authMiddleware, auditRoutes);
app.use('/api/categories',      authMiddleware, categoriesRoutes);
app.use('/api/bank-accounts',   authMiddleware, bankAccountsRoutes);
app.use('/api/payment-methods', authMiddleware, paymentMethodsRoutes);
app.use('/api/users',           authMiddleware, audit('Usuários'),   usersRoutes);
app.use('/api/settings',        authMiddleware, audit('Sistema'),    settingsRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Opticom API rodando em http://localhost:${PORT}`);
    console.log(`📊 Dashboard em http://localhost:3000`);
    console.log(`✅ Database conectado`);
  });
}

module.exports = app;
