import test from 'node:test';
import assert from 'node:assert/strict';
import { companyResult } from '../src/pages/financial/company-result.js';
import { reconcile, mergeLines } from '../src/pages/financial/reconciliation.js';
const tx = (id, amount, extra = {}) => ({ id, amount, amount_paid: amount, type: 'INCOME', bank_account_id: 'b', paid_date: '2026-10-10', due_date: '2026-09-10', ...extra });
const line = (id, amount, extra = {}) => ({ id, amount, type: 'CREDIT', date: '2026-10-10', ...extra });
const run = (lines, transactions, links = {}) => reconcile({ lines, transactions, links, accountId: 'b', from: '2026-10-01', to: '2026-10-31' });
test('empresa soma clientes, gerais e não classificados sem ratear ou duplicar', () => {
 const r = companyResult([tx('r',10000,{customer_id:'c'}),tx('d',2000,{type:'EXPENSE',customer_id:'c'}),tx('g',1000,{type:'EXPENSE'}),tx('u',500,{type:'EXPENSE'})], {g:'general'}, [], 'previsto');
 assert.equal(r.clients.result,8000); assert.equal(r.general.expense,1000); assert.equal(r.unassigned.expense,500); assert.equal(r.total.result,6500);
});
test('efetivo usa baixas parciais e exclui pagamento de fatura do DRE', () => {
 const r = companyResult([tx('r',10000,{amount_paid:3000}),tx('f',2000,{type:'EXPENSE',category_id:'card'})],{},[{id:'card',accounting_class:'PAGAMENTO_CARTAO'}],'efetivo');
 assert.equal(r.total.result,3000);
});
test('mesmo saldo não significa conciliado, precisa confirmar movimentos', () => {
 const r = run([line('l',1000)],[tx('t',1000)]);
 assert.equal(r.difference,0); assert.equal(r.complete,false); assert.equal(r.pending.length,1); assert.equal(r.unmatched.length,1);
});
test('usa data paga e conta, não vencimento; aceita vários pagamentos para um total baixado', () => {
 const r = run([line('a',400),line('b',600)],[tx('t',1000),tx('other',999,{bank_account_id:'z'})],{a:'t',b:'t'});
 assert.equal(r.complete,true); assert.equal(r.systemIn,1000);
});
test('valor alterado ou direção diferente invalida confirmação anterior', () => {
 assert.equal(run([line('a',1000)],[tx('t',900)],{a:'t'}).complete,false);
 assert.equal(run([line('a',1000)],[tx('t',1000,{type:'EXPENSE'})],{a:'t'}).complete,false);
});
test('sem data ou banco impede afirmar tudo conciliado', () => {
 assert.equal(run([line('a',1000)],[tx('t',1000),tx('x',30,{paid_date:null})],{a:'t'}).complete,false);
 assert.equal(run([line('a',1000)],[tx('t',1000),tx('x',30,{bank_account_id:null})],{a:'t'}).complete,false);
});
test('reimportar mesma linha não duplica; id bancário com valor alterado gera erro', () => {
 assert.equal(mergeLines([line('a',1000)],[line('a',1000)]).length,1);
 assert.throws(()=>mergeLines([line('a',1000)],[line('a',900)]));
});

test('arquivo para conciliação não descarta silenciosamente valor inválido', async () => {
 const {parseStatement}=await import('../src/pages/financial/parsers.js');
 assert.throws(()=>parseStatement('Data;Descrição;Valor\n27/10/2026;ok;10,00\n27/10/2026;erro;abc','test.csv',{strict:true}));
});
test('OFX usa ponto decimal e CSV respeita descrições entre aspas e débito acentuado', async () => {
 const {parseStatement}=await import('../src/pages/financial/parsers.js');
 const ofx='<STMTTRN><DTPOSTED>20261027<TRNAMT>1.000<FITID>a</STMTTRN>';
 assert.equal(parseStatement(ofx,'file.ofx')[0].amount,100);
 const csv='Data;Descrição;Valor;Tipo\n27/10/2026;"Tarifa; banco";10,00;Débito';
 const row=parseStatement(csv,'file.csv')[0]; assert.equal(row.description,'Tarifa; banco'); assert.equal(row.type,'DEBIT');
});
test('CSV estrito recusa token monetário parcial e linhas truncadas', async () => {
 const {parseStatement}=await import('../src/pages/financial/parsers.js');
 for (const body of ['27/10/2026;item;10abc','27/10/2026;item;1,23,45','truncated-row']) {
  assert.throws(()=>parseStatement(`Data;Descrição;Valor\n27/10/2026;ok;10,00\n${body}`,'test.csv',{strict:true}));
 }
});
