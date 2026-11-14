import test from 'node:test';
import assert from 'node:assert/strict';
import { toastKind } from '../src/utils/toast-kind.js';

test('mensagens de sucesso das telas', () => {
  for (const m of [
    'Veículo ABC1D23 cadastrado!',
    'OS OS-2026-00001 cancelada.',
    'Lançamento criado: Receita',
    'Contrato renovado: CT-1',
    'Baixa estornada — R$ 10,00 voltou para em aberto.',
    'Usuário excluído permanentemente.',
    '3 lançamento(s) baixado(s).',
    'Relatório copiado — cole no WhatsApp.',
    'Fatura Nubank paga: R$ 100,00',
    'Recebimento parcial de R$ 10,00 — restam R$ 5,00',
  ])
    assert.equal(toastKind(m), 'success', m);
});

test('erros, validações e respostas do servidor', () => {
  for (const m of [
    'Erro: Acesso negado. Role necessário: ADMIN, MANAGER',
    'Erro ao salvar saldo',
    'Acesso negado. Seu perfil não tem acesso a esta página.',
    'Saída maior que o estoque disponível',
    'Selecione um cliente',
    'Valor inválido',
    'Cliente tem OS ou contratos vinculados e não pode ser excluído. Use Inativar.',
    '2 baixado(s), 1 falharam.',
    'Lançamentos salvos, mas a classificação não foi salva. Confira no DRE geral.',
    'Não foi possível copiar',
  ])
    assert.equal(toastKind(m), 'error', m);
});
