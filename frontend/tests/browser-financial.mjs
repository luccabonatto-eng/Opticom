import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const origin='http://127.0.0.1:4179';
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const today=new Date().toISOString().slice(0,10);
const settings={}; const writes=[]; const errors=[];
const transactions=[
 {id:'r',description:'Receita cliente',type:'INCOME',amount:10000,amount_paid:10000,status:'RECEIVED',customer_id:'c',due_date:today,paid_date:today,bank_account_id:'b'},
 {id:'g',description:'Assistente financeira',type:'EXPENSE',amount:2000,amount_paid:2000,status:'PAID',due_date:today,paid_date:today,bank_account_id:'b'},
];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',async route=>{
 const req=route.request(),url=new URL(req.url()),path=url.pathname;
 if(!path.startsWith('/api/')) return url.origin===origin?route.continue():route.abort();
 let data=[];
 if(path==='/api/transactions') data=transactions;
 if(path==='/api/customers') data=[{id:'c',name:'Cliente teste'}];
 if(path==='/api/bank-accounts') data=[{id:'b',name:'Banco teste'}];
 if(path==='/api/categories') data={income:[],expense:[]};
 if(path.startsWith('/api/settings/')) {
  const key=path.split('/').at(-1);
  if(req.method()==='PUT') { const body=req.postDataJSON(); writes.push({key,...body}); settings[key]=body.value; }
  data={value:settings[key]??null};
 }
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
});
try {
 await page.goto(origin);
 await page.locator('aside').getByRole('button',{name:'Financeiro',exact:true}).click();
 await page.getByRole('button',{name:/DRE Gerencial/}).click();
 await page.getByRole('button',{name:'DRE Geral da Empresa',exact:true}).click();
 await page.getByRole('button',{name:'Marcar geral',exact:true}).waitFor();
 await page.getByRole('button',{name:'Marcar geral',exact:true}).click();
 await page.getByRole('button',{name:'Marcar geral',exact:true}).waitFor({state:'hidden'});
 assert.equal(JSON.parse(settings.financial_scopes).g,'general');
 await page.getByRole('button',{name:/Conciliação Bancária/}).click();
 await page.getByLabel('Conta da conciliação').selectOption('b');
 await page.waitForFunction(()=>!document.querySelector('[aria-label="Importar extrato para conciliação"]').disabled);
 const csv=`Data;Descrição;Valor\n${today};Receita cliente;100,00\n${today};Assistente financeira;-20,00`;
 const file={name:'extrato.csv',mimeType:'text/csv',buffer:Buffer.from(csv)};
 await page.getByLabel('Importar extrato para conciliação').setInputFiles(file);
 await page.getByLabel('Lançamento para Receita cliente').waitFor();
 await page.getByLabel('Lançamento para Receita cliente').selectOption('r');
 await page.getByRole('row').filter({has:page.getByLabel('Lançamento para Receita cliente')}).getByRole('button',{name:'Confirmar vínculo'}).click();
 await page.getByRole('button',{name:'Desfazer vínculo'}).waitFor();
 await page.getByLabel('Lançamento para Assistente financeira').selectOption('g');
 await page.getByRole('row').filter({has:page.getByLabel('Lançamento para Assistente financeira')}).getByRole('button',{name:'Confirmar vínculo'}).click();
 await page.getByText('Movimentos conciliados no período',{exact:true}).waitFor();
 await page.getByLabel('Importar extrato para conciliação').setInputFiles(file);
 await page.getByText(/0 movimentos adicionados/).waitFor();
 assert.equal(JSON.parse(settings.bank_reconciliation_b).lines.length,2);
 await page.getByRole('button',{name:'Recarregar conferência'}).click();
 await page.getByText('Movimentos conciliados no período',{exact:true}).waitFor();
 await page.screenshot({path:'/tmp/opticom-reconciliation.png',fullPage:true});
 await page.getByRole('button',{name:'Desfazer vínculo'}).first().click();
 await page.getByText('Movimentos conciliados no período',{exact:true}).waitFor({state:'hidden'});
 assert.equal(Object.keys(JSON.parse(settings.bank_reconciliation_b).links).length,1);
 assert.ok(writes.filter(x=>x.key.startsWith('bank_reconciliation')).every(x=>Object.hasOwn(x,'expectedValue')));
 assert.deepEqual(errors,[]);
 console.log('PASS: DRE general classification, bank import, confirmations, persistence, deduplication and undo. API fully intercepted.');
} catch(error) { console.error(await page.locator('main').innerText()); console.error(errors); throw error; } finally {await browser.close();}
