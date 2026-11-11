const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase'); // mockado em jest.setup.js

const app = express();
app.use(express.json());
app.use('/api/products', require('../src/middleware/auth'), require('../src/routes/products'));

const token = jwt.sign(
  { id: '11111111-1111-1111-1111-111111111111', name: 'Admin Teste', role: 'ADMIN' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);
const post = (body) =>
  request(app).post('/api/products/p1/movements').set('Authorization', `Bearer ${token}`).send(body);

afterEach(() => {
  supabase.__reset();
  supabase.rpc.mockClear();
});

describe('Movimentação de estoque', () => {
  test('entrada chama a função do banco com usuário e motivo', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: { id: 'm1', type: 'IN', quantity: 5, balance_after: 55 }, error: null });
    const res = await post({ type: 'IN', quantity: 5, note: 'Compra NF 123' });
    expect(res.statusCode).toBe(201);
    expect(res.body.balance_after).toBe(55);
    expect(res.body.users.name).toBe('Admin Teste');
    expect(supabase.rpc).toHaveBeenCalledWith('register_stock_movement', {
      p_product: 'p1', p_type: 'IN', p_quantity: 5, p_note: 'Compra NF 123',
      p_user: '11111111-1111-1111-1111-111111111111',
    });
  });

  test('saída maior que o saldo volta 400 com a mensagem do banco', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: null, error: { code: '23514', message: 'Saída maior que o estoque disponível' } });
    const res = await post({ type: 'OUT', quantity: 999 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/maior que o estoque/);
  });

  test.each([
    [{ type: 'X', quantity: 1 }],
    [{ type: 'IN', quantity: 0 }],
    [{ type: 'IN', quantity: 1.5 }],
    [{ type: 'OUT', quantity: '3' }],
  ])('rejeita movimento inválido %j sem tocar no banco', async (body) => {
    const res = await post(body);
    expect(res.statusCode).toBe(400);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  test('PUT não altera quantidade direto', async () => {
    const res = await request(app).put('/api/products/p1').set('Authorization', `Bearer ${token}`).send({ quantity: 10 });
    expect(res.statusCode).toBe(400);
  });

  test('lista o histórico do produto', async () => {
    supabase.__set({ rows: [{ id: 'm1', type: 'OUT', quantity: 2, balance_after: 48 }] });
    const res = await request(app).get('/api/products/p1/movements').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(supabase.from).toHaveBeenCalledWith('stock_movements');
  });
});
