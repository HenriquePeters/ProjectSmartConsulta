# CI/CD do Projeto

## Estratégia adotada

O deploy foi automatizado com GitHub Actions e separação de ambientes por branch:

- `dev` → ambiente DEV/HML no Firebase Hosting
- `main` → ambiente PRD no Firebase Hosting

## Como a pipeline funciona

1. identifica o branch que recebeu push
2. instala dependências no root e em `backend`
3. executa `npm run build` para validar o frontend estático
4. escolhe o projeto Firebase correto com base no branch
5. carrega as URLs da API por variáveis do GitHub
6. gera `frontend/public/app-config.js` dinamicamente
7. publica no Firebase Hosting correspondente
8. opcionalmente deploya o backend no Railway quando os secrets estiverem configurados

## Segurança

Dados sensíveis não ficam no código versionado.

O workflow usa:

- secret: `FIREBASE_TOKEN`
- secret: `RAILWAY_TOKEN` (opcional)
- secret: `RAILWAY_PROJECT_ID` (opcional)
- variables: `FIREBASE_PROJECT_DEV`
- variables: `FIREBASE_PROJECT_PRD`
- variables: `DEV_API_URL`
- variables: `PRD_API_URL`

## Ambiente e URLs

- `DEV`: `https://smart-consulta-dev-hp-20260407.web.app`
- `PRD`: `https://smart-consulta-prd-hp-260407.web.app`

## Arquivos principais

- `.github/workflows/deploy.yml`
- `GITHUB-SECRETS.md`
- `EVIDENCIAS-ENTREGA.md`
- `railway.json` (configuração do deploy do backend)
