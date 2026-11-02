// Relatório para colar no WhatsApp: o formato é a mensagem, então o que se
// testa é o texto que sai e o que fica de fora.
import test from 'node:test';
import assert from 'node:assert/strict';
import { copiarWhats, textoWhats } from '../src/utils/whatsapp.js';
import { fmt } from '../src/utils/format.js';

test('título vem em negrito do WhatsApp e cada linha em uma linha', () => {
  assert.equal(
    textoWhats('Fluxo de Caixa · 01/10/2026 a 31/10/2026', ['Recebimentos: R$ 100,00', 'Pessoal: -R$ 50,00']),
    '*Fluxo de Caixa · 01/10/2026 a 31/10/2026*\nRecebimentos: R$ 100,00\nPessoal: -R$ 50,00',
  );
});

test('linha nula sai do relatório e a vazia continua separando blocos', () => {
  assert.equal(textoWhats('DRE', ['Receita', null, '', 'Total']), '*DRE*\nReceita\n\nTotal');
});

// fmt usa Intl, que separa "R$" do número com espaço inquebrável (U+00A0) —
// comparar com espaço comum falha sem mostrar diferença na tela.
test('saída de caixa aparece com sinal negativo, não como entrada', () => {
  assert.equal(fmt(-500000).replace(/\u00a0/g, ' '), '-R$ 5.000,00');
  assert.ok(textoWhats('DFC', [`Pessoal: ${fmt(-500000)}`]).includes('5.000,00'));
  assert.ok(!fmt(500000).startsWith('-'));
});

const comClipboard = (writeText) =>
  Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText } }, configurable: true });

test('copia o relatório montado para a área de transferência', async () => {
  let copiado = null;
  comClipboard(async (t) => {
    copiado = t;
  });
  assert.equal(await copiarWhats('DRE · Outubro 2026', ['Receita bruta: R$ 1,00']), true);
  assert.equal(copiado, '*DRE · Outubro 2026*\nReceita bruta: R$ 1,00');
});

// Sem isso a pessoa colaria o conteúdo anterior achando que era o relatório.
test('navegador que recusa a cópia devolve falso em vez de fingir que copiou', async () => {
  comClipboard(async () => {
    throw new Error('NotAllowedError');
  });
  assert.equal(await copiarWhats('DRE', ['x']), false);
});
