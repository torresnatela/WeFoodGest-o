# WeFood Gestão

Sistema de gestão da WeFood Alimentos: loja de sorvetes/lanches e, no futuro, toda a rede. Esta é a base do projeto — autenticação básica e infraestrutura de dados. Features de negócio (estoque, vendas, caixa do dia) vêm depois.

## Stack

- **Monorepo**: npm workspaces (`apps/*`, `packages/*`)
- **App**: Next.js (App Router, JavaScript) em `apps/web` — as Route Handlers **são** o backend Node, sem servidor separado
- **Banco**: PostgreSQL 17 (Docker localmente, [Neon](https://neon.tech) em produção), acessado via `pg` puro (sem ORM) em `packages/database`
- **Migrations**: [node-pg-migrate](https://github.com/salsita/node-pg-migrate)
- **Testes**: Jest, TDD, sem mocks — sempre contra um Postgres real
- **Deploy**: Vercel

## Requisitos

- Node 24 (veja `.nvmrc`)
- Docker

## Rodando localmente

```bash
# 1. Suba o Postgres local (porta 5435)
npm run services:up

# 2. Instale as dependências (raiz, workspaces)
npm install

# 3. Rode as migrations (cria users/sessions e semeia o admin)
npm run migrations:up

# 4. Suba o app em desenvolvimento
npm run dev
```

Acesse http://localhost:3010/login com:

- **Email**: `admin@admin.com.br`
- **Senha**: `WeFood123456`

## Testes

```bash
npm test
```

Sobe o Next.js (`next dev`) e o Jest juntos via `concurrently`. Os testes de integração batem no servidor real e no Postgres real — cada suíte roda `tests/orchestrator.js` para limpar as tabelas (`DROP SCHEMA public CASCADE`) e reaplicar as migrations antes de começar, então rodar os testes localmente também reseta os dados de desenvolvimento.

## Estrutura

```
apps/web/          Next.js: páginas, Route Handlers, models de domínio
packages/database/  Cliente Postgres (`pg`) e migrations
docker-compose.yml   Postgres 17 local (porta 5435)
```

## Scripts úteis (raiz)

| Script | O que faz |
| --- | --- |
| `npm run dev` | Sobe o Next.js em http://localhost:3010 |
| `npm test` | Roda a suíte completa (Next + Jest) |
| `npm run lint` | ESLint |
| `npm run services:up` / `services:down` | Sobe/derruba o Postgres local |
| `npm run migrations:up` / `migrations:down` | Aplica/reverte migrations |
| `npm run migrations:create` | Cria um novo arquivo de migration |

## Produção (Vercel)

Na criação do projeto na Vercel:

- **Root Directory**: `apps/web` (mantenha marcado *Include source files outside of the Root Directory*, necessário para o workspace `packages/database`)
- **Framework**: Next.js (já declarado em `apps/web/vercel.json`)
- **Build Command**: não mexa — `apps/web/vercel.json` já define `npm run migrations:up:deploy && npm run build`

### Variável de ambiente

Só uma precisa ser configurada na Vercel:

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | Connection string do Neon, com `?sslmode=require` — marque *Production* e *Preview* |

Nunca é commitada. O `apps/web/.env` versionado no repo só tem os defaults do Docker local (sem segredos reais) e **não** atrapalha em produção: tanto o Next.js quanto o `node-pg-migrate` dão precedência à variável já presente no ambiente.

### Migrations a cada deploy

O build da Vercel roda `npm run migrations:up:deploy` antes do `next build`. Esse script chama o `node-pg-migrate` direto (sem o `dotenv -e ../../apps/web/.env` do `migrations:up` local), então ele usa o `DATABASE_URL` do ambiente da Vercel.

Se uma migration falhar, o build falha e o deploy **não** é promovido — a versão anterior continua no ar.
