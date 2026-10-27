# Frontend Opticom ERP

React 18 + Vite 5 + Tailwind 3. O navegador recebe JavaScript e CSS compilados;
`index.html` contém somente a estrutura inicial. Não há serviço novo ou pacote pago.

## Executar

Na pasta `frontend`:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4179
```

O servidor de desenvolvimento mostra a URL no terminal. `node server.js` mantém
compatibilidade com a porta 3000. Abrir o HTML diretamente ou servi-lo com Python
não compila JSX; use Vite. Para produção, publique **somente `dist/`**. A configuração
Vercel aponta para esse diretório; planos e uso comercial devem ser verificados
separadamente. Esta mudança não publica nem muda o provedor.

## Onde editar (ler somente o domínio necessário)

| Pedido | Arquivo/pasta inicial |
|---|---|
| Navegação e carregamento de telas | `src/App.jsx`, `src/config/navigation.js` |
| Menu lateral e cabeçalho | `src/layout/` |
| Dashboard e indicadores | `src/pages/dashboard/` |
| Clientes, contratos, OS, estoque, técnicos, frota | `src/pages/<domínio>/` |
| A pagar / receber / aprovações / cartões / extrato / folha | `src/pages/financial/tabs/` |
| Estado, filtros e ações financeiras compartilhadas | `src/pages/financial/FinancialPage.jsx` |
| DRE: cálculos e seleção de visão | `src/pages/financial/tabs/DreTab.jsx` |
| DRE: resumo, tabela por cliente e consolidada | `src/pages/financial/dre/` |
| Novo lançamento, baixa, importação e pagamento de fatura | `src/pages/financial/modals/` |
| CSV/OFX de entrada | `src/pages/financial/parsers.js` |
| CSV de saída | `src/utils/csv.js`; montagem das linhas em `CashFlowTab.jsx` / `DreTab.jsx` |
| Valores pagos, saldos, vencimentos, somas | `src/pages/financial/calculations.js` |
| Configurações por aba | `src/pages/settings/tabs/` |
| Chamadas HTTP e autenticação existente | `src/api/client.js` |
| Componentes visuais compartilhados | `src/components/` |
| Estilos globais / arquivos estáticos | `src/app.css`, `public/` |

Comece pelo arquivo da funcionalidade e siga os imports. Não é necessário carregar
todas as páginas ou o Financeiro inteiro para alterar uma aba. Props explícitas
mostram as dependências; o estado compartilhado fica no controlador para os filtros
persistirem ao alternar abas. Páginas são carregadas sob demanda com `React.lazy`.

## Testes

`npm test`: datas de parcelas, centavos, baixas parciais, dados legados e importadores.
`npm run build`: valida imports e produz os arquivos estáticos.

Com o preview da porta 4179 aberto em outro terminal e Google Chrome instalado:

```sh
npm run test:smoke
```

Alternativa: `npx playwright install chromium` e
`PLAYWRIGHT_CHANNEL=chromium npm run test:smoke`.
O smoke intercepta todas as chamadas de API e bloqueia outros hosts. Percorre telas,
abas financeiras, DRE, configurações e modal; verifica filtros e carregamento tardio.
Usa dados de teste e **não consulta nem grava dados reais**. `SMOKE_URL` aceita somente
localhost/127.0.0.1; `SMOKE_SCREENSHOT` escolhe o arquivo da captura.

## Limites desta migração

Não muda consultas, backend, banco, regras financeiras ou autenticação. O modo de
prévia existente (login desativado/token demo) e dados fictícios ainda usados foram
preservados. `mocks/demo.js` reúne dados demonstrativos legados; padrões financeiros
ficam em `config/financial.js`. Não confundir esta organização com liberação para
produção. Otimizar consultas/caches é outra mudança, baseada no uso real.

A economia de tokens vem de ler e editar módulos menores e usar este mapa. Não há
estimativa percentual garantida, nem troca automática do modelo da conversa.
