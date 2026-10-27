# Frontend modular para uso interno

Objetivo: reduzir o contexto necessário para manutenção por agentes, mantendo telas,
regras e dados do ERP de baixo tráfego, com foco em análises. O usuário autorizou
planejar e executar após a análise do HTML; decisões de implementação são nossas.

Escolha: React 18 + Vite + Tailwind 3 já presentes. HTML mínimo, módulos ES,
componentes por domínio, financeiro e configurações separados por aba, páginas
carregadas sob demanda. Sem novos serviços pagos, gerenciador de estado ou router.
Alternativas: apenas mover todo script para App.jsx não resolve o contexto grande;
reescrever em outro framework aumentaria risco e custo sem benefício para este uso.

Preservar regras financeiras, centavos, permissões e contratos da API. Não alterar
banco, backend, autenticação, consultas ou comportamento demo nesta migração.
Compilar JSX e CSS no build, não no navegador. Mapear onde editar em frontend/README.md.
Preservar o estado compartilhado das abas no controlador; extrair vistas com props
explícitas e helpers puros, sem grandes contextos globais.

Trabalhar em cópia isolada do estado local, verificar hashes antes de aplicar.
Não publicar, não fazer commit das alterações preexistentes do usuário/Claude.
