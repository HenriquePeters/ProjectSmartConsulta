# GitHub Secrets e Variables

Para a pipeline funcionar no GitHub Actions, configure estes itens no repositório.

## Secrets

- `FIREBASE_TOKEN`
  - Gere com:

```bash
firebase login:ci
```

- `RAILWAY_TOKEN` (opcional — necessário apenas para deploy automático do backend no Railway)
- `RAILWAY_PROJECT_ID` (opcional — ID do projeto Railway que recebe o backend)

Adicione esses valores em `Settings > Secrets and variables > Actions > Secrets`.

## Variables

Adicione em `Settings > Secrets and variables > Actions > Variables`:

- `FIREBASE_PROJECT_DEV=smart-consulta-dev-hp-20260407`
- `FIREBASE_PROJECT_PRD=smart-consulta-prd-hp-260407`
- `DEV_API_URL=https://sua-api-dev.com`
- `PRD_API_URL=https://sua-api-prd.com`

> `DEV_API_URL` e `PRD_API_URL` devem apontar para as URLs públicas do backend Express em cada ambiente.

## Regra de deploy

- `dev` → ambiente de desenvolvimento/homologação no Firebase Hosting
- `main` → ambiente de produção no Firebase Hosting

A pipeline usa esses valores para gerar o arquivo de configuração do frontend e publicar o site no ambiente correto.
