const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase'); // mockado em jest.setup.js

const USUARIO = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Teste', email: 'joao@opticom.com.br', role: 'ADMIN', status: 'ACTIVE',
};
const tokenAdmin = () => jwt.sign(
  { id: USUARIO.id, name: USUARIO.name, email: USUARIO.email, role: 'ADMIN' },
  process.env.JWT_SECRET, { expiresIn: '1h' }
);

afterEach(() => supabase.__reset());

// Mock da API
const app = express();
app.use(express.json());

const authRoutes = require('../src/routes/auth');
app.use('/api/auth', authRoutes);

describe('Authentication API', () => {
  describe('POST /api/auth/login', () => {
    test('should return 400 if email or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@opticom.com.br',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    test('should return 200 and token for valid credentials', async () => {
      supabase.__set({ single: { ...USUARIO, password_hash: bcrypt.hashSync('senha123', 10) } });
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao@opticom.com.br',
          password: 'senha123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('email');
      expect(res.body.user).toHaveProperty('role');
    });

    test('should return valid JWT token', async () => {
      supabase.__set({ single: { ...USUARIO, password_hash: bcrypt.hashSync('senha123', 10) } });
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao@opticom.com.br',
          password: 'senha123'
        });

      const token = res.body.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email');
      expect(decoded.email).toBe('joao@opticom.com.br');
    });
  });

  describe('POST /api/auth/register', () => {
    test('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${tokenAdmin()}`)
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('should register new user successfully', async () => {
      supabase.__set({ rows: [{ id: 'novo-id', name: 'Novo Usuário', email: 'n@o.com', role: 'TECHNICIAN' }] });
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${tokenAdmin()}`)
        .send({
          name: 'Novo Usuário',
          email: `newuser${Date.now()}@opticom.com.br`,
          password: 'TestPassword123',
          role: 'TECHNICIAN'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
    });
  });

  describe('GET /api/auth/me', () => {
    let validToken;

    beforeAll(async () => {
      // Token assinado aqui: depender de um login real exigia usuário semeado
      // no banco e fazia a suíte inteira falhar sem rede.
      validToken = jwt.sign(
        { id: '11111111-1111-1111-1111-111111111111', name: 'Teste', email: 'teste@opticom.com.br', role: 'ADMIN' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    test('should return 401 if no token provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
    });

    test('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('teste@opticom.com.br');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let validToken;

    beforeAll(async () => {
      // Token assinado aqui: depender de um login real exigia usuário semeado
      // no banco e fazia a suíte inteira falhar sem rede.
      validToken = jwt.sign(
        { id: '11111111-1111-1111-1111-111111111111', name: 'Teste', email: 'teste@opticom.com.br', role: 'ADMIN' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    test('should return new token', async () => {
      supabase.__set({ single: USUARIO });
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.token).toBeTruthy();

      // Verificar que é um JWT válido
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email');
    });

    test('should return 401 if no token provided', async () => {
      const res = await request(app).post('/api/auth/refresh');

      expect(res.statusCode).toBe(401);
    });
  });
});
