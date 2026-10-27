import { useMemo, useState } from 'react';
import { useFinancialSetting } from '../hooks/useFinancialSetting.js';
import { mergeLines, reconcile, validDate } from '../reconciliation.js';
import { parseStatement } from '../parsers.js';
import { fmt, fmtDate } from '../../../utils/format.js';
import { txPago } from '../calculations.js';
import { hojeISO } from '../../../utils/dates.js';
const EMPTY = { lines: [], links: {} };
const inputClass = 'border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white';
export function ReconciliationTab({ transactions, bankAccounts, financialLoaded, openEditTx, onCreate }) {
  const [accountId, setAccountId] = useState('');
  const [from, setFrom] = useState(hojeISO().slice(0,7)+'-01');
  const [to, setTo] = useState(hojeISO());
  const [message, setMessage] = useState('');
  const [choice, setChoice] = useState({});
  const [importing, setImporting] = useState(false);
  const saved = useFinancialSetting(accountId ? `bank_reconciliation_${accountId}` : null, EMPTY);
  const validData = Array.isArray(saved.data.lines) && saved.data.links && typeof saved.data.links === 'object';
  const lines = validData ? saved.data.lines : [];
  const links = validData ? saved.data.links : {};
  const periodOK = validDate(from) && validDate(to) && from <= to;
  const report = useMemo(()=>reconcile({lines,links,transactions,accountId,from,to}),[lines,links,transactions,accountId,from,to]);
  const disabled = !saved.ready || !validData || saved.busy || importing || !financialLoaded || !periodOK;
  const save = async data => {
    const ok = await saved.save(data);
    setMessage(ok ? 'Conferência salva.' : 'Não foi possível salvar. Confira o aviso e tente novamente.');
    return ok;
  };
  const loadFile = async file => {
    if (!file) return;
    setImporting(true); setMessage('');
    try {
      const text = await file.text();
      const parsed = parseStatement(text,file.name,{strict:true});
      if (!parsed.length) throw new Error('Nenhum movimento reconhecido. Use OFX ou CSV com Data, Descrição e Valor (saídas negativas).');
      const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
      const hash = [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
      const isOFX = /<STMTTRN[>\s]/i.test(text);
      // FITID is stable across overlapping OFX downloads. CSV IDs are file-scoped.
      const incoming = parsed.map((l,i)=>({...l,id:isOFX && l.bankId ? `ofx:${l.bankId}` : `file:${hash}:${i}`, source:file.name}));
      const merged = mergeLines(lines,incoming);
      if (await saved.save({...saved.data,lines:merged,links})) {
        const dates = incoming.map(l=>l.date).sort(); setFrom(dates[0]); setTo(dates.at(-1));
        setMessage(`${merged.length-lines.length} movimentos adicionados. Confira possíveis duplicidades antes de vincular; arquivos CSV diferentes podem conter o mesmo movimento.`);
      } else setMessage('Importação não salva. Recarregue a conferência e tente novamente.');
    } catch(e) { setMessage(e.message); }
    finally { setImporting(false); }
  };
  const link = async (line,id) => {
    const t = report.scoped.find(t=>String(t.id)===String(id));
    if (!t || (t.type==='INCOME') !== (line.type==='CREDIT')) { setMessage('Selecione um lançamento da mesma conta e direção.'); return; }
    const allocated = lines.filter(l=>links[l.id]===String(id) && l.id!==line.id).reduce((s,l)=>s+l.amount,0);
    if (allocated+line.amount>txPago(t)) { setMessage('Valor acima do total baixado disponível. Corrija a baixa ou escolha outro lançamento.'); return; }
    await save({...saved.data,lines,links:{...links,[line.id]:String(id)}});
  };
  const unlink = line => { const next={...links}; delete next[line.id]; return save({...saved.data,lines,links:next}); };
  const settledIds = new Set(report.confirmed.map(l=>l.id));
  return <section className="space-y-4">
    <div className="bg-white border rounded-xl p-4"><h2 className="font-bold text-lg">Conciliação Bancária</h2><p className="text-sm text-gray-500 mt-1">Compare o extrato com o que foi efetivamente recebido e pago. Vincular não cria nem altera uma baixa.</p>
      <div className="flex flex-wrap items-end gap-3 mt-4">
        <label className="text-xs text-gray-600">Conta bancária<select aria-label="Conta da conciliação" disabled={saved.busy||importing} className={`${inputClass} block mt-1`} value={accountId} onChange={e=>{setAccountId(e.target.value);setMessage('');setChoice({});}}><option value="">Selecione a conta</option>{bankAccounts.map(b=><option key={b.id} value={b.id}>{b.name||b.bank_name||b.bank} — {b.account_number||b.account||''}</option>)}</select></label>
        <label className="text-xs text-gray-600">De<input aria-label="Conciliação de" type="date" value={from} onChange={e=>setFrom(e.target.value)} className={`${inputClass} block mt-1`}/></label>
        <label className="text-xs text-gray-600">Até<input aria-label="Conciliação até" type="date" value={to} onChange={e=>setTo(e.target.value)} className={`${inputClass} block mt-1`}/></label>
        <label className="text-xs text-gray-600">Importar extrato OFX / CSV<input aria-label="Importar extrato para conciliação" type="file" accept=".ofx,.csv" disabled={disabled} onChange={e=>{const file=e.target.files[0]; e.target.value=''; loadFile(file);}} className="block mt-1 text-xs max-w-64"/></label>
        <button disabled={saved.busy||importing||!accountId} onClick={saved.reload} className="text-sm text-blue-700 underline">Recarregar conferência</button>
      </div>
    </div>
    {!accountId && <p className="p-4 bg-blue-50 rounded-xl">Escolha a conta bancária para iniciar ou retomar uma conferência.</p>}
    {accountId && !saved.ready && !saved.error && <p>Carregando conferência…</p>}
    {(saved.error||message||!validData) && <p role="status" className="p-3 bg-amber-50 text-amber-900 rounded-lg">{saved.error || (!validData?'Conferência salva inválida. Recarregue ou contate o suporte.':message)}</p>}
    {accountId && saved.ready && validData && <>
      {!financialLoaded && <p role="alert">Os lançamentos não foram carregados. Recarregue a página antes de conciliar.</p>}
      {!periodOK && <p role="alert">Informe um período válido.</p>}
      <div className="grid md:grid-cols-4 gap-3">{[['Entradas no banco',report.bankIn],['Saídas no banco',report.bankOut],['Saldo dos movimentos no sistema',report.systemIn-report.systemOut],['Diferença dos movimentos',report.difference]].map(([label,value])=><div key={label} className="bg-white border rounded-xl p-4"><p className="text-xs text-gray-500">{label}</p><p className="font-bold text-xl">{fmt(value)}</p></div>)}</div>
      <div className={`p-4 rounded-xl ${report.complete&&financialLoaded&&periodOK?'bg-green-50 text-green-800':'bg-amber-50 text-amber-900'}`}>
        <p className="font-semibold">{report.complete&&financialLoaded&&periodOK?'Movimentos conciliados no período':`${report.pending.length} movimentos do banco pendentes • ${report.unmatched.length} lançamentos sem conciliação completa`}</p>
        <p className="text-xs mt-1">Recebido no sistema: {fmt(report.systemIn)} • Pago no sistema: {fmt(report.systemOut)}. Esta conferência cobre os movimentos importados; não comprova o saldo bancário inicial ou final.</p>
      </div>
      <p className="text-xs text-gray-500">Pagamentos parciais usam o total acumulado e a última data de baixa disponíveis no cadastro. É possível vincular vários movimentos a um lançamento; a soma precisa fechar. Baixas de períodos diferentes exigem revisão do lançamento.</p>
      <div className="overflow-x-auto bg-white border rounded-xl"><table className="w-full text-sm"><thead className="bg-gray-50"><tr>{['Data','Movimento do banco','Valor','Correspondência no sistema','Conferência'].map(x=><th key={x} className="p-3 text-left">{x}</th>)}</tr></thead><tbody>{report.selected.map(l=>{
        const candidates=report.scoped.filter(t=>(t.type==='INCOME')===(l.type==='CREDIT')).sort((a,b)=>Number(txPago(b)===l.amount)-Number(txPago(a)===l.amount)||Math.abs(Date.parse(a.paid_date)-Date.parse(l.date))-Math.abs(Date.parse(b.paid_date)-Date.parse(l.date)));
        const current=links[l.id]; const selected=choice[l.id]||'';
        const linked=transactions.find(t=>String(t.id)===String(current));
        return <tr key={l.id} className="border-t"><td className="p-3 whitespace-nowrap">{fmtDate(l.date)}</td><td className="p-3">{l.description}<p className="text-xs text-gray-400">{l.source}</p></td><td className="p-3 whitespace-nowrap">{l.type==='CREDIT'?'+':'−'}{fmt(l.amount)}</td><td className="p-3 min-w-64">{current?<><p>{linked?.description||'Lançamento excluído'}</p><p className="text-xs text-gray-500">Vinculado: {fmt(report.linkedTotals[current]||0)} / Baixado: {fmt(linked?txPago(linked):0)}</p></>:<select aria-label={`Lançamento para ${l.description}`} value={selected} onChange={e=>setChoice(c=>({...c,[l.id]:e.target.value}))} className={`${inputClass} max-w-80`}><option value="">Selecione — sugestões por valor/data</option>{candidates.map(t=><option key={t.id} value={t.id}>{fmtDate(t.paid_date)} · {t.description} · {fmt(txPago(t))}</option>)}</select>}</td><td className="p-3"><p className={`text-xs font-semibold mb-2 ${settledIds.has(l.id)?'text-green-700':'text-amber-700'}`}>{settledIds.has(l.id)?'Conciliado':current?'Vínculo com diferença — revisar':'Pendente'}</p><div className="flex flex-wrap gap-2">{current?<button disabled={disabled} onClick={()=>unlink(l)} className="text-blue-700 underline disabled:opacity-40">Desfazer vínculo</button>:<><button disabled={disabled||!selected} onClick={()=>link(l,selected)} className="text-blue-700 underline disabled:opacity-40">Confirmar vínculo</button><button disabled={disabled} onClick={()=>onCreate(l,accountId)} className="text-blue-700 underline disabled:opacity-40">Criar lançamento</button><button disabled={disabled} onClick={()=>{if(window.confirm('Remover este movimento da conferência? Use somente para duplicidades ou linhas que não pertencem a esta conta.')) save({...saved.data,links,lines:lines.filter(x=>x.id!==l.id)});}} className="text-gray-500 underline">Remover duplicidade</button></>}</div></td></tr>;
      })}</tbody></table>{!report.selected.length&&<p className="p-5 text-gray-500">Nenhum movimento importado neste período.</p>}</div>
      <div className="bg-white border rounded-xl p-4"><h3 className="font-semibold">Lançamentos a conferir no sistema ({report.unmatched.length})</h3>{report.unmatched.map(t=><div key={t.id} className="flex justify-between gap-3 border-t py-3 text-sm"><span>{fmtDate(t.paid_date)} · {t.description} · {fmt(txPago(t))}</span><button onClick={()=>openEditTx(t)} className="text-blue-700 underline">Revisar lançamento</button></div>)}{!report.unmatched.length&&<p className="text-sm text-gray-500 mt-2">Nenhum lançamento pendente nesta conta e período.</p>}</div>
      {!!report.incomplete.length&&<div className="p-4 bg-amber-50 rounded-xl"><h3 className="font-semibold">Baixas sem conta ou data definida ({report.incomplete.length})</h3><p className="text-xs mb-2">Esses lançamentos impedem confirmar a conferência completa. Defina a conta e a data corretas.</p>{report.incomplete.map(t=><div className="flex justify-between py-2 text-sm" key={t.id}><span>{t.description} · {fmt(txPago(t))}</span><button onClick={()=>openEditTx(t)} className="text-blue-700 underline">Revisar lançamento</button></div>)}</div>}
    </>}
  </section>;
}
