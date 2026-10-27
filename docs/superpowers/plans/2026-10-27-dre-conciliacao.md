# DRE e conciliação Implementation Plan
> **For agentic workers:** Use superpowers:executing-plans para execução nesta sessão.
**Goal:** Separar resultado de clientes e empresa e conferir banco contra lançamentos.
**Architecture:** Cálculos puros em módulos financeiros; UI em abas/componentes próprios. Classificações e conciliações usam system_settings, com compare-and-swap no endpoint existente.
**Tech Stack:** React, Vite, Node/Express, Supabase existente.
**Spec:** docs/superpowers/specs/2026-10-27-dre-conciliacao.md
## Global Constraints
- Centavos inteiros, sem rateio automático ou criação automática de baixas.
- Preservar permissões e testar com API interceptada.
## Review Focus
- Valores iguais em múltiplos movimentos: confirmação explícita e vínculo único.
- Reimportação e contas diferentes: identificação estável por conta e arquivo/movimento.
- Falha de carregamento/gravação: não mostrar sucesso nem sobrescrever dados.
- Pagamentos parciais: comparar total baixado, sinalizar limitação do histórico disponível.
- Despesas sem cliente: pendentes até classificação explícita; total geral inclui tudo.
## Tasks
- [x] Testar gravação condicional de settings; implementar conflito HTTP 409 sem overwrite.
- [x] Testar módulos puros de resultado e conciliação (conta, data efetiva, direção, duplicidade, vínculo inválido e soma líquida enganosa).
- [x] Implementar classificação geral no formulário e painel DRE geral com detalhamento, usando settings persistentes.
- [x] Implementar aba de conciliação, importação, confirmação/desfazer, sugestões e abertura do formulário existente; persistir por conta.
- [x] Verificar testes frontend/backend, build e smoke com API interceptada; revisar diff e limitações.

## Validação e limitações
Testes unitários de cálculos, parsers e gravação condicional; testes de navegador com API interceptada. Revisão independente corrigiu falha de classificação, totais falsos após erro de carga e parsing permissivo. Não foram executadas gravações na API real nem deploy. Conferência é de movimentos; saldo inicial/final e histórico individual de baixas parciais não existem no modelo atual.
