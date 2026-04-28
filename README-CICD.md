# CI/CD do Projeto

## Estrategia adotada

O deploy foi automatizado com GitHub Actions usando separacao por branch:

- `dev` -> ambiente DEV no Firebase Hosting
- `main` -> ambiente PRD no Firebase Hosting

## Como a pipeline funciona

1. identifica o branch que recebeu push
2. instala dependências em `backend` e no workspace
3. executa `npm run build` para tornar o build explícito
4. escolhe o projeto Firebase correto
5. carrega as URLs da API por variáveis do GitHub
6. gera o `frontend/public/app-config.js` dinamicamente
7. publica no Firebase Hosting correspondente
8. opcionalmente deploya o backend no Railway quando os secrets estiverem presentes

## Seguranca

Dados sensiveis nao ficam no codigo versionado.

O workflow usa:

- secret: `FIREBASE_TOKEN`
- variables: `FIREBASE_PROJECT_DEV`
- variables: `FIREBASE_PROJECT_PRD`
- variables: `DEV_API_URL`
- variables: `PRD_API_URL`

## Arquivos principais

- `.github/workflows/deploy.yml`
- `GITHUB-SECRETS.md`
- `EVIDENCIAS-ENTREGA.md`
- `railway.json` (backend deploy config)
