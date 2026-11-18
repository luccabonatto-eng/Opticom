const { transitionFields } = require('../src/routes/orders');

const now = new Date('2026-11-18T13:00:00Z');
const t = (status, next, extra = {}) => transitionFields({ status, ...extra }, next, now);

describe('Troca de etapa da OS', () => {
  test('iniciar atendimento carimba started_at uma vez só', () => {
    expect(t('IN_TRANSIT', 'IN_PROGRESS')).toEqual({ started_at: now.toISOString() });
    expect(t('COMPLETED', 'IN_PROGRESS', { started_at: 'x' }).started_at).toBeUndefined();
  });

  test('concluir carimba fim e data local', () => {
    expect(t('IN_PROGRESS', 'COMPLETED')).toEqual({ completed_at: now.toISOString(), completed_date: '2026-11-18' });
  });

  test('voltar de concluída é retrabalho e limpa a conclusão', () => {
    expect(t('COMPLETED', 'IN_PROGRESS', { started_at: 'x' })).toEqual({ completed_at: null, completed_date: null, reopened: true });
  });

  test('desfaturar só libera a NF, sem retrabalho', () => {
    expect(t('INVOICED', 'COMPLETED')).toEqual({ nf: null });
  });

  test('voltar para antes do início zera started_at (reagendar)', () => {
    expect(t('IN_PROGRESS', 'SCHEDULED')).toEqual({ started_at: null });
  });

  test('mesma etapa não muda nada', () => {
    expect(t('SCHEDULED', 'SCHEDULED')).toEqual({});
  });
});
