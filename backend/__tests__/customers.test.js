const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase'); // mockado em jest.setup.js

// Mock da API
const app = express();
app.use(express.json());

const authMiddleware = require('../src/middleware/auth');
const customersRoutes = require('../src/routes/customers');

app.use('/api/customers', authMiddleware, customersRoutes);

let validToken;

afterEach(() => supabase.__reset());

// Setup: Fazer login antes de rodar testes
beforeAll(async () => {
  const authApp = express();
  authApp.use(express.json());
  const authRoutes = require('../src/routes/auth');
  authApp.use('/api/auth', authRoutes);

  // Token assinado aqui: depender de um login real exigia usuário semeado
  // no banco e fazia a suíte inteira falhar sem rede.
  validToken = jwt.sign(
    { id: '11111111-1111-1111-1111-111111111111', name: 'Teste', email: 'teste@opticom.com.br', role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

describe('Customers API', () => {
  describe('GET /api/customers', () => {
    test('should return 401 without token', async () => {
      const res = await request(app).get('/api/customers');
      expect(res.statusCode).toBe(401);
    });

    test('should return list of customers with valid token', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('should return customers with expected fields', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${validToken}`);

      if (res.body.data.length > 0) {
        const customer = res.body.data[0];
        expect(customer).toHaveProperty('id');
        expect(customer).toHaveProperty('name');
        expect(customer).toHaveProperty('doc');
        expect(customer).toHaveProperty('type');
        expect(customer).toHaveProperty('active');
      }
    });
  });

  describe('POST /api/customers', () => {
    const newCustomer = {
      type: 'PJ',
      name: 'Test Company Ltd',
      doc: `${Math.floor(Math.random() * 100000000)}.0001-00`,
      city: 'Test City',
      phone: '(17) 1234-5678',
      email: 'test@company.com',
      revenue: 1000000,
      active: true
    };

    test('should create new customer', async () => {
      supabase.__set({ rows: [{ id: 'c-1', ...newCustomer }] });
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${validToken}`)
        .send(newCustomer);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(newCustomer.name);
      expect(res.body.type).toBe(newCustomer.type);
    });

    test('should return 400 if required fields missing', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Test' }); // Missing type and doc

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/customers')
        .send(newCustomer);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/customers/:id', () => {
    let customerId;

    beforeAll(async () => {
      // Get first customer ID
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${validToken}`);

      if (res.body.data && res.body.data.length > 0) {
        customerId = res.body.data[0].id;
      }
    });

    test('should return 404 for non-existent customer', async () => {
      const res = await request(app)
        .get('/api/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(404);
    });

    test('should return customer by ID', async () => {
      if (!customerId) return;

      const res = await request(app)
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(customerId);
    });
  });

  describe('PUT /api/customers/:id', () => {
    let customerId;

    beforeAll(async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${validToken}`);

      if (res.body.data && res.body.data.length > 0) {
        customerId = res.body.data[0].id;
      }
    });

    test('should update customer', async () => {
      if (!customerId) return;

      const res = await request(app)
        .put(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ city: 'Updated City' });

      expect(res.statusCode).toBe(200);
      expect(res.body.city).toBe('Updated City');
    });

    test('should return 404 for non-existent customer', async () => {
      const res = await request(app)
        .put('/api/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ city: 'Updated' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    let customerId;

    beforeAll(async () => {
      // Create a customer to delete
      const newCustomer = {
        type: 'PJ',
        name: `Delete Test ${Date.now()}`,
        doc: `${Math.floor(Math.random() * 100000000)}.0001-00`,
        city: 'Test City',
        phone: '(17) 1234-5678',
        email: `delete${Date.now()}@test.com`,
        active: true
      };

      const createRes = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${validToken}`)
        .send(newCustomer);

      if (createRes.statusCode === 201) {
        customerId = createRes.body.id;
      }
    });

    test('should delete customer', async () => {
      if (!customerId) return;

      const res = await request(app)
        .delete(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    test('should return 404 for non-existent customer', async () => {
      const res = await request(app)
        .delete('/api/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
