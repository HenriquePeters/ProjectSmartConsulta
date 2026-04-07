# Backend Deploy

O backend agora esta preparado para deploy com PostgreSQL em Railway ou Render.

## O que foi ajustado

- suporte a `DATABASE_URL`
- suporte a SSL em producao com `DB_SSL=true`
- arquivos de deploy para Railway e Render
- health check em `/api/health`

## Variaveis obrigatorias

- `NODE_ENV=production`
- `JWT_SECRET`
- `DB_DIALECT=postgres`
- `DATABASE_URL`
- `DB_SSL=true`
- `FRONTEND_URL`
- `FRONTEND_URLS`

## Variaveis de e-mail

Se quiser envio de e-mail em producao, configure tambem:

- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_SECURE`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`

## Railway

Arquivos prontos:

- `railway.json`
- `nixpacks.toml`

Passos:

1. Crie um projeto no Railway.
2. Adicione um banco PostgreSQL.
3. Conecte este repositorio.
4. Configure as variaveis de ambiente listadas acima.
5. Use a URL publica gerada pelo Railway como `YOUR_DEV_API_URL` ou `YOUR_PROD_API_URL` em `frontend/public/app-config.js`.

## Render

Arquivo pronto:

- `render.yaml`

Passos:

1. Crie o Blueprint no Render usando `render.yaml`.
2. Preencha as variaveis `JWT_SECRET`, `FRONTEND_URL` e `FRONTEND_URLS`.
3. Depois do deploy, copie a URL publica da API.
4. Atualize `frontend/public/app-config.js` com essa URL.

## Observacao

Localmente voce pode continuar com SQLite sem mudar nada. Em producao, o recomendado e usar PostgreSQL.
