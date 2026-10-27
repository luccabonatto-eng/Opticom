import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoney, parseStatement, lerPlanilha } from '../src/pages/financial/parsers.js';

test('valores brasileiros e OFX preservam centavos', () => {
  assert.equal(parseMoney('R$ 1.234,56'), 123456);
  assert.equal(parseMoney('-250.75'), -25075);
  assert.equal(parseMoney('1.000'), 100000);
  assert.equal(parseMoney(''), 0);
});
test('planilha reconhece cabeçalhos reordenados, aspas e saída', () => {
  assert.deepEqual(
    lerPlanilha('Tipo;Vencimento;Valor;Descrição;Categoria\nSaída;31/01/2026;"1.234,56";"Peças; instalação";Material'),
    [
      {
        description: 'Peças; instalação',
        amount: 123456,
        due_date: '2026-01-31',
        catName: 'Material',
        tipo: 'EXPENSE',
      },
    ],
  );
});
test('extrato OFX interpreta sinal, data e identificador', () => {
  const ofx =
    '<BANKTRANLIST><STMTTRN><DTPOSTED>20261001120000<TRNAMT>-250.75<FITID>abc<MEMO>Pagamento</STMTTRN></BANKTRANLIST>';
  assert.deepEqual(parseStatement(ofx, 'banco.ofx'), [
    {
      id: 'abc',
      date: '2026-10-01',
      description: 'Pagamento',
      amount: 25075,
      type: 'DEBIT',
    },
  ]);
});
