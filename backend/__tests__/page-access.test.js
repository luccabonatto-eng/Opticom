const request = require('supertest');
const express = require('express');
const db = require('../config/supabase');
const checkPage = require('../src/middleware/page-access');

const appComo = (role, ...pages) => {
  const app = express();
  app.use((req, res, next) => { req.user = { role }; next(); });
  app.post('/x', checkPage(...pages), (req, res) => res.json({ ok: true }));
  return app;
};
const salvas = (perms) => db.__set({ single: { value: JSON.stringify(perms) } });

beforeEach(() => db.__reset());

test('técnico com acesso à Frota pode cadastrar veículo', async () => {
  salvas({ TECHNICIAN: ['dashboard', 'orders', 'fleet'] });
  expect((await request(appComo('TECHNICIAN', 'fleet')).post('/x')).status).toBe(200);
});

test('técnico sem acesso à página é bloqueado', async () => {
  salvas({ TECHNICIAN: ['dashboard', 'orders'] });
  expect((await request(appComo('TECHNICIAN', 'fleet')).post('/x')).status).toBe(403);
});

test('gerente sem Financeiro nas permissões salvas é bloqueado', async () => {
  salvas({ MANAGER: ['dashboard', 'orders'] });
  expect((await request(appComo('MANAGER', 'financial')).post('/x')).status).toBe(403);
});

test('sem permissões salvas vale o padrão', async () => {
  expect((await request(appComo('MANAGER', 'fleet')).post('/x')).status).toBe(200);
  expect((await request(appComo('TECHNICIAN', 'fleet')).post('/x')).status).toBe(403);
  expect((await request(appComo('TECHNICIAN', 'orders')).post('/x')).status).toBe(200);
});

test('ADMIN sempre passa, sem consultar o banco', async () => {
  salvas({ ADMIN: [] });
  expect((await request(appComo('ADMIN', 'settings')).post('/x')).status).toBe(200);
});

test('qualquer uma das páginas basta (categoria pelo Financeiro ou Configurações)', async () => {
  salvas({ MANAGER: ['financial'] });
  expect((await request(appComo('MANAGER', 'financial', 'settings')).post('/x')).status).toBe(200);
});
