# Firebase Deploy

Este projeto usa Firebase Hosting para publicar o frontend estático em dois ambientes separados:

- `dev` → ambiente de desenvolvimento/homologação
- `prod` → ambiente de produção

## Arquivos já preparados

- `firebase.json`
- `.firebaserc`
- `frontend/public/app-config.js`
- `package.json` na raiz com scripts de deploy
- `.github/workflows/deploy.yml` para CI/CD

## Como funciona

A pipeline do GitHub Actions gera `frontend/public/app-config.js` automaticamente usando as variáveis:

- `DEV_API_URL`
- `PRD_API_URL`

Isso evita expor URLs de API no repositório e permite separar DEV/HML e PRD.

## Projetos Firebase

- `smart-consulta-dev-hp-20260407`
- `smart-consulta-prd-hp-260407`

## Comandos locais

Rodar API local:

```bash
npm run dev:api
```

Testar Hosting localmente com Firebase Emulator:

```bash
npm run firebase:serve
```

Publicar front-end manualmente (quando necessário):

```bash
npm run firebase:deploy:dev
npm run firebase:deploy:prod
```

> Atenção: para o deploy manual, verifique se `frontend/public/app-config.js` está configurado com as URLs corretas da API antes de publicar.

## Importante

Firebase Hosting publica apenas o frontend estático. O backend Express deste projeto deve estar hospedado separadamente, por exemplo em Railway, Render ou outro serviço de nuvem.
