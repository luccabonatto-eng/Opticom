# Opticom ERP — Sistema de Gerenciamento Integrado

Sistema ERP completo para gerenciamento de contratos, ordens de serviço, clientes, técnicos, veículos, produtos e transações financeiras.

## 📁 Estrutura do Projeto

```
opticom/
├── backend/                    # API Express.js com autenticação JWT
│   ├── src/
│   │   ├── routes/            # Endpoints REST (customers, contracts, orders, etc)
│   │   ├── middleware/        # Auth (JWT), RBAC, error handling
│   │   └── utils/             # CRUD Factory, validações
│   ├── config/                # Supabase, Swagger
│   ├── __tests__/             # Testes unitários
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/                   # React SPA modular (Vite + Tailwind compilados)
│   ├── index.html             # Entrada mínima da aplicação
│   ├── src/                   # Páginas, componentes, API e regras por domínio
│   ├── public/                # Logos e favicons
│   ├── tests/                 # Testes unitários e navegação com API simulada
│   ├── .env.example
│   └── README.md
│
├── docs/                       # Documentação
│   ├── DEPLOY_AUTOMATIZADO.md # Guia paso-a-paso (Railway + Vercel)
│   ├── DEPLOY_GUIDE.md        # Instruções detalhadas
│   ├── SPRINT*.md             # Histórico de desenvolvimento
│   └── FASE*.md               # Fases implementadas
│
├── scripts/                    # Scripts úteis (setup, deploy)
│   └── setup.sh               # Instalação local
│
└── README.md                   # Este arquivo
```

## 🚀 Quick Start

### 1. Backend (Railway)

```bash
cd backend
npm install
npm start
```

Variáveis de ambiente (.env):
```
NODE_ENV=production
PORT=3001
JWT_SECRET=sua-chave-secreta-aqui
SUPABASE_URL=https://tromofnnttxwtphbxqlw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CORS_ORIGIN=http://localhost:3000
```

### 2. Frontend (Vercel)

```bash
cd frontend
npm ci
npm run dev
# Produção: npm run build (publicar frontend/dist)
```

## 🔐 Autenticação

- **Tipo:** JWT (Bearer Token)
- **Storage:** sessionStorage (limpa ao fechar navegador)
- **Expiração:** 24 horas
- **Endpoint:** `POST /auth/login`

**Credenciais de teste:**
- Email: `teste@teste.com`
- Senha: `123456`

## 📊 Módulos Implementados

| Módulo | Status | Descrição |
|--------|--------|-----------|
| **Clientes** | ✅ Completo | CRUD com filtros, status, documentação |
| **Contratos** | ✅ Completo | Contratos associados a clientes |
| **Ordens de Serviço** | ✅ Completo | OS com status, técnico, valor |
| **Técnicos** | ✅ Completo | Cadastro de técnicos e especializações |
| **Veículos** | ✅ Completo | Frota com placa, modelo, status |
| **Produtos** | ✅ Completo | Catálogo com estoque e preço |
| **Transações** | ✅ Completo | Movimentação financeira |
| **Auditoria** | ✅ Completo | Log de operações do sistema |
| **Dashboard** | ✅ Completo | KPIs, gráficos, análises |
| **Configurações** | ✅ Completo | Regime tributário, categorias, contas |

## 🔑 Roles e Permissões

- **ADMIN** - Acesso total (deletar, modificar configurações)
- **MANAGER** - Operações de CRUD completo
- **TECHNICIAN** - Leitura e criação de ordens de serviço

## 📡 API Endpoints

### Autenticação
- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login (retorna JWT)
- `POST /auth/refresh` - Renovar token
- `GET /auth/me` - Obter usuário atual

### Recursos (CRUD)
- `GET /customers` - Listar clientes
- `POST /customers` - Criar cliente
- `PUT /customers/:id` - Atualizar cliente
- `DELETE /customers/:id` - Deletar cliente (admin only)

Padrão similar para: `/contracts`, `/orders`, `/technicians`, `/vehicles`, `/products`, `/transactions`

### Auditoria
- `GET /audit` - Listar logs de auditoria

## 🛠️ Desenvolvimento

### Executar Localmente

Backend:
```bash
cd backend
npm install
npm run dev          # Com nodemon
npm test             # Testes
npm run lint         # Verificar código
```

Frontend:
```bash
cd frontend
npm ci
npm run dev
# Mapa dos módulos e testes: frontend/README.md
```

### Estrutura de Pastas do Backend

```
src/
├── routes/
│   ├── auth.js        # Autenticação
│   ├── customers.js   # Clientes
│   ├── contracts.js   # Contratos
│   ├── orders.js      # Ordens de serviço
│   ├── technicians.js # Técnicos
│   ├── vehicles.js    # Veículos
│   ├── products.js    # Produtos
│   ├── transactions.js# Transações
│   └── audit.js       # Auditoria
├── middleware/
│   ├── auth.js        # JWT verification
│   └── rbac.js        # Role-based access control
└── utils/
    └── crudFactory.js # Reusable CRUD operations (elimina 52% duplicação)
```

## 🚢 Deployment

Veja [docs/DEPLOY_AUTOMATIZADO.md](docs/DEPLOY_AUTOMATIZADO.md) para instruções completas.

**Resumo:**
1. Backend → Railway (git push)
2. Frontend → Vercel (git push)
3. Configurar variáveis de ambiente
4. Atualizar CORS_ORIGIN no backend

**URLs de produção:**
- Backend: `https://opticom-backend-production.up.railway.app`
- Frontend: `https://opticom-frontend.vercel.app`

## 📝 Testes

```bash
cd backend
npm test              # Rodar testes
npm run test:watch   # Modo watch
npm run test:coverage# Cobertura
```

## 🐛 Troubleshooting

**Problema:** "Token não fornecido" ao fazer login
- Solução: Verifique se sessionStorage está ativo
- Backend está enviando o token no response

**Problema:** Retorna para login ao clicar em outra página
- Solução: Sistema monitora sessionStorage a cada 500ms
- Se token for removido (erro 401), app retorna para login automaticamente

**Problema:** CORS error
- Solução: Configure CORS_ORIGIN no backend para a URL do frontend

## 📚 Documentação Adicional

- [Histórico de Deploy](docs/DEPLOY_AUTOMATIZADO.md)
- [Sprints Completados](docs/SPRINT1_CONCLUIDO.md)
- [Análise de Melhorias](docs/MELHORIAS_ANALISE.md)

## 👥 Autores

- **Claude Code** - Implementação completa do sistema
- **Lucca Bonatto** - Product Owner / Requisitos

## 📄 Licença

Privado - Uso interno

---

**Última atualização:** 24 de Abril de 2026
**Versão:** 1.0.0 (Produção)
