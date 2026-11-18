// Métricas do técnico tiradas das OS em que ele atuou (responsável ou apoio).
// Tempo: started_at→completed_at, carimbados pelo backend na troca de etapa.
// Retrabalho: OS concluída que precisou voltar de etapa (reopened).
const DONE = ['COMPLETED', 'INVOICED'];

const techMetrics = (orders, techId, now = new Date()) => {
  const mine = orders.filter(
    (o) => o.assigned_technician_id === techId || (o.additional_technicians || []).includes(techId),
  );
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const done = mine.filter((o) => DONE.includes(o.status));
  const timed = done.filter((o) => o.started_at && o.completed_at);
  const everDone = mine.filter((o) => DONE.includes(o.status) || o.reopened);
  return {
    // OS antigas não têm completed_date: cai na data agendada
    monthCount: done.filter((o) => (o.completed_date || o.scheduled_date || '').startsWith(month)).length,
    avgMin: timed.length
      ? Math.round(timed.reduce((s, o) => s + (new Date(o.completed_at) - new Date(o.started_at)), 0) / timed.length / 60000)
      : null,
    rework: everDone.length ? Math.round((everDone.filter((o) => o.reopened).length / everDone.length) * 100) : 0,
  };
};

const fmtMin = (m) => (m == null ? '—' : m < 60 ? `${m}min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`);

export { techMetrics, fmtMin };
