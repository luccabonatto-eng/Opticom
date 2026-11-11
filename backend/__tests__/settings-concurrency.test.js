const request = require('supertest');
const express = require('express');
const db = require('../config/supabase');
const app = express();
app.use(express.json());
app.use((req, res, next) => { req.user = { role: 'ADMIN' }; next(); });
app.use('/settings', require('../src/routes/settings'));
beforeEach(() => { db.__reset(); jest.clearAllMocks(); });
test('stale conditional write returns conflict instead of overwriting', async () => {
  const res = await request(app).put('/settings/financial_scopes').send({ value: '{}', expectedValue: 'old' });
  expect(res.status).toBe(409);
  expect(db.upsert).not.toHaveBeenCalled();
});
test('conditional write filters by previous value and returns saved data', async () => {
  db.__set({ rows: [{ key: 'financial_scopes', value: '{"a":"general"}' }] });
  const res = await request(app).put('/settings/financial_scopes').send({ value: '{"a":"general"}', expectedValue: '{}' });
  expect(res.status).toBe(200);
  expect(db.eq).toHaveBeenCalledWith('value', '{}');
});
test('new setting uses insert, never upsert over a concurrent creation', async () => {
 db.insert.mockImplementationOnce(() => ({ select: async () => ({ data:null, error:{code:'23505'} }) }));
 const res=await request(app).put('/settings/bank_reconciliation_b').send({value:'{}',expectedValue:null});
 expect(res.status).toBe(409); expect(db.upsert).not.toHaveBeenCalled();
});
test('read-only profile cannot save a conference', async () => {
 const readOnly=express(); readOnly.use(express.json());
 readOnly.use((req,res,next)=>{req.user={role:'TECHNICIAN'};next();});
 readOnly.use('/settings',require('../src/routes/settings'));
 const res=await request(readOnly).put('/settings/bank_reconciliation_b').send({value:'{}',expectedValue:null});
 expect(res.status).toBe(403);
});
test('only ADMIN can change profile permissions', async () => {
 const manager=express(); manager.use(express.json());
 manager.use((req,res,next)=>{req.user={role:'MANAGER'};next();});
 manager.use('/settings',require('../src/routes/settings'));
 const res=await request(manager).put('/settings/permissions').send({value:'{}'});
 expect(res.status).toBe(403); expect(db.upsert).not.toHaveBeenCalled();
 const ok=await request(app).put('/settings/permissions').send({value:'{}'});
 expect(ok.status).toBe(200);
});
