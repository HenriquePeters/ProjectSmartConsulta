# Firebase Deploy

O frontend do Smart Consulta pode ser publicado no Firebase Hosting com dois projetos:

- `dev`
- `prod`

## Arquivos ja preparados

- `firebase.json`
- `.firebaserc`
- `frontend/public/app-config.js`
- `package.json` na raiz com scripts de deploy

## Ajustes necessarios

1. Os projetos Firebase ja foram criados:
   - `smart-consulta-dev-hp-20260407`
   - `smart-consulta-prd-hp-260407`
2. Edite `frontend/public/app-config.js` e informe as URLs reais da API:
   - `YOUR_DEV_API_URL`
   - `YOUR_PROD_API_URL`

## Comandos

Rodar API local:

```bash
npm run dev:api
```

Testar Hosting localmente:

```bash
npm run firebase:serve
```

Publicar dev:

```bash
npm run firebase:deploy:dev
```

Publicar prod:

```bash
npm run firebase:deploy:prod
```

## Importante

Firebase Hosting publica apenas o frontend estatico. O backend Express deste projeto precisa continuar hospedado separadamente em producao.
