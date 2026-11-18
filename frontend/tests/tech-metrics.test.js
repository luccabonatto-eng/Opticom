import test from 'node:test';
import assert from 'node:assert/strict';
import { techMetrics, fmtMin } from '../src/pages/technicians/metrics.js';

const now = new Date('2026-11-18T12:00:00');
const os = (extra) => ({ assigned_technician_id: 'a', additional_technicians: [], status: 'COMPLETED', ...extra });

test('conta OS do mês como responsável e como apoio', () => {
  const orders = [
    os({ completed_date: '2026-11-10' }),
    os({ assigned_technician_id: 'b', additional_technicians: ['a'], status: 'INVOICED', scheduled_date: '2026-11-02' }),
    os({ completed_date: '2026-10-30' }),
    os({ status: 'IN_PROGRESS', scheduled_date: '2026-11-05' }),
    os({ assigned_technician_id: 'b', completed_date: '2026-11-10' }),
  ];
  assert.equal(techMetrics(orders, 'a', now).monthCount, 2);
});

test('tempo médio usa só OS com início e fim', () => {
  const orders = [
    os({ started_at: '2026-11-10T10:00:00Z', completed_at: '2026-11-10T11:00:00Z' }),
    os({ started_at: '2026-11-11T10:00:00Z', completed_at: '2026-11-11T10:30:00Z' }),
    os({}),
  ];
  assert.equal(techMetrics(orders, 'a', now).avgMin, 45);
  assert.equal(techMetrics([], 'a', now).avgMin, null);
});

test('retrabalho = reabertas / já concluídas alguma vez', () => {
  const orders = [os({ reopened: true }), os({}), os({}), os({ status: 'IN_PROGRESS', reopened: true }), os({ status: 'OPEN' })];
  assert.equal(techMetrics(orders, 'a', now).rework, 50);
});

test('formata minutos', () => {
  assert.equal(fmtMin(null), '—');
  assert.equal(fmtMin(45), '45min');
  assert.equal(fmtMin(125), '2h05');
});
