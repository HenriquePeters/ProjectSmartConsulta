# CI/CD do Projeto

## Estrategia adotada

O deploy foi automatizado com GitHub Actions usando separacao por branch:

- `dev` -> ambiente DEV no Firebase Hosting
- `main` -> ambiente PRD no Firebase Hosting

## Como a pipeline funciona

1. identifica o branch que recebeu push
2. escolhe o projeto Firebase correto
3. carrega as URLs da API por variaveis do GitHub
4. gera o `frontend/public/app-config.js` dinamicamente
5. publica no Firebase Hosting correspondente

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
