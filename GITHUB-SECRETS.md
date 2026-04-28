# GitHub Secrets e Variables

Para a pipeline funcionar no GitHub Actions, configure estes itens no repositorio:

## Secrets

- `FIREBASE_TOKEN`

Como gerar:

```bash
firebase login:ci
```

- `RAILWAY_TOKEN` (opcional — só necessário para deploy automático do backend via Railway)
- `RAILWAY_PROJECT_ID` (opcional — ID do projeto Railway que recebe o backend)

Copie o token gerado e salve em `Settings > Secrets and variables > Actions > Secrets`.

## Variables

Salve em `Settings > Secrets and variables > Actions > Variables`:

- `FIREBASE_PROJECT_DEV=smart-consulta-dev-hp-20260407`
- `FIREBASE_PROJECT_PRD=smart-consulta-prd-hp-260407`
- `DEV_API_URL=https://sua-api-dev.com`
- `PRD_API_URL=https://sua-api-prd.com`

## Regra de deploy

- push em `dev` publica em DEV
- push em `main` publica em PRD
