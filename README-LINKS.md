# Links Importantes do Projeto

Este arquivo reúne os links principais para a implantação, documentação e evidências do Smart Consulta.

## Repositório
- Repositório Git: https://github.com/HenriquePeters/ProjectSmartConsulta.git

## Ambientes publicados
- URL DEV/HML: https://smart-consulta-dev-hp-20260407.web.app
- URL PRD: https://smart-consulta-prd-hp-260407.web.app

## Documentação de implantação
- Plano de Implantação: `PLANO-DE-IMPLANTACAO.md`
- Manual do Usuário: `MANUAL-DO-USUARIO.md`
- Documentação de CI/CD: `README-CICD.md`
- Documentação de Deploy Firebase: `FIREBASE-DEPLOY.md`
- Documentação de Secrets e Variables: `GITHUB-SECRETS.md`
- Evidências de entrega: `EVIDENCIAS-ENTREGA.md`

## Arquivos de configuração de deploy
- Workflow de deploy: `.github/workflows/deploy.yml`
- Firebase config: `firebase.json`
- Firebase projetos: `.firebaserc`
- Backend deploy config: `railway.json`
- Frontend app config template: `frontend/public/app-config.js`

## Observações
- O frontend está hospedado no Firebase Hosting.
- O backend deve ser publicado em serviço separado, configurando `DEV_API_URL` e `PRD_API_URL`.
- Para a pipeline funcionar, configure os secrets e variables no GitHub conforme `GITHUB-SECRETS.md`.
