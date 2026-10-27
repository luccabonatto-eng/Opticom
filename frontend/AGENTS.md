# Guia curto do frontend

- Leia `README.md` para localizar a funcionalidade antes de abrir código.
- Comece pelo arquivo do domínio pedido; use `rg` e siga apenas seus imports.
  Evite carregar todas as páginas ou a pasta `dist/` para uma edição localizada.
- `index.html` é apenas a entrada. Código React fica em `src/`.
- Financeiro: apresentação em `pages/financial/tabs`, modais em `modals`, DRE em
  `dre`; estado/ações compartilhados em `FinancialPage.jsx`; parsers e cálculos
  puros em arquivos próprios. Valores monetários da API são centavos inteiros.
- Preserve filtros, permissões e contratos da API ao extrair componentes.
- Use classes Tailwind completas. As cores calculadas dos regimes têm safelist
  em `tailwind.config.js`; não recoloque Tailwind/Babel via CDN.
- Verifique com `npm test` e `npm run build`. Para navegação, rode o preview na
  porta 4179 e `npm run test:smoke`; ele intercepta a API sem gravar dados reais.
- Não teste salvamentos contra a API real para validar alterações de interface.
- Se houver outro agente editando, verifique alterações concorrentes antes de
  substituir arquivos. Não restaure uma cópia antiga sobre trabalho novo.
