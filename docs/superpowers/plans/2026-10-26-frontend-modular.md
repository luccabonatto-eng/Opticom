# Frontend modular Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, uma revisão independente ao final.

**Goal:** reduzir o volume de código necessário para cada manutenção sem alterar o ERP.
**Architecture:** módulos React por domínio; Vite gera assets estáticos; estado das abas preservado no controlador.
**Tech Stack:** React 18, Vite 5, Tailwind 3, node:test.
**Spec:** docs/superpowers/specs/2026-10-26-frontend-modular-design.md

## Global Constraints
- Preservar alterações locais capturadas antes da migração.
- Sem alteração do backend, banco, autenticação ou consultas.
- Sem dependências pagas, publicação ou commits automáticos.
- Aplicar ao diretório original somente após verificar que os arquivos-base não mudaram.

## Review Focus
- Imports e dependências antes implícitas no escopo global.
- Estado e handlers preservados na extração de abas e modais.
- Classes Tailwind disponíveis no build e ordem do CSS preservada.
- Caminhos de assets, API e saída de deploy.
- Regras de valores em centavos e datas mantidas.

### Task 1: Build e módulos
- [x] Testar comportamento de datas e valores antes da extração (RED de módulo ausente).
- [x] Extrair declarações para src/{utils,config,components,layout,pages,mocks,api} com imports explícitos.
- [x] Dividir abas financeiras e configurações sem mudar as regras.
- [x] Adicionar main.jsx, HTML mínimo, Vite/Tailwind/PostCSS e assets públicos.
- [x] Verificar testes, build, imports e navegação com API simulada sem gravações reais.

### Task 2: Manutenção econômica e entrega
- [x] Documentar mapa de arquivos, comandos, estratégia de leitura por domínio e limites.
- [x] Revisão independente do conjunto; corrigir regressões relevantes.
- [x] Integrar ao checkout original após confirmação do término do Claude; HTML final idêntico ao snapshot, sem conflitos.

## Progress / rulings
- Execução isolada em /Users/luccabonattodepaula/Documents/Sistema Opticom/Opticom-ERP-modular; snapshot inclui alterações locais do HTML.
- Execução inline para evitar múltiplos agentes relendo todo o ERP; uma revisão final.

## Resultado validado
- 6 testes unitários frontend; build Vite; smoke Chrome cobrindo navegação,
  lazy loading, criação em centavos, filtros, DRE detalhada, CSV DFC/DRE e permissões.
- 79 testes backend no checkout original passaram, sem alterar o backend.
- Revisão independente gpt-5.6-luna/high sem regressões materiais.
- Limite de cobertura: não foram executados todos os salvamentos de baixa/lote,
  cartões, folha, importações e configurações; parsers e saldos têm testes unitários.
- Ruling: manter migração isolada porque usuário confirmou Claude ainda editando.
  Aplicar snapshot antigo sem reconciliação perderia alterações concorrentes.
- Ruling: preservar estado financeiro compartilhado no controlador; quebrar suas
  regras em novos hooks agora ampliaria risco. As vistas, modais, parsers e DRE
  já têm arquivos próprios. O controlador ainda é maior que as demais unidades.
- Ruling: sem alterações em consultas ou autenticação; ganho de cotas do backend
  não foi medido nem prometido. Economia de contexto depende da tarefa futura.
- CSV incorporado até o snapshot de 2026-10-26 às 23:38 locais; comparar hash
  de .migration/frontend-snapshot/index.html com original antes de integrar.

## Integração final
Usuário confirmou término do Claude; migração aplicada no checkout principal.
6 testes frontend, build e 101 testes backend passaram; originais guardados em
`.migration/pre-integration/`. Ver `2026-10-26-integracao-concluida.md`.
