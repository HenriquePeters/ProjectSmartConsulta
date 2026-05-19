# Evidencias para entrega

Este arquivo organiza exatamente o que voce precisa capturar para o PDF final.

## 1. Repositorio Git

Inclua no PDF:

- link do repositorio
- print da pasta `.github/workflows`
- print do arquivo `deploy.yml`
- print do historico de commits
- link para `PLANO-DE-IMPLANTACAO.md`
- link para `MANUAL-DO-USUARIO.md`

## 2. Evidencia de seguranca

Capturas obrigatorias:

- tela de `Settings > Secrets and variables > Actions > Secrets` mostrando o secret `FIREBASE_TOKEN`
- tela de `Settings > Secrets and variables > Actions > Variables` mostrando:
  - `FIREBASE_PROJECT_DEV`
  - `FIREBASE_PROJECT_PRD`
  - `DEV_API_URL`
  - `PRD_API_URL`
- print do `backend/.env` sem segredos reais

## 3. Cenario DEV

Fluxo para gravar ou tirar prints:

1. checkout no branch `dev`
2. fazer uma alteracao pequena
3. commit e push
4. abrir `Actions` no GitHub
5. capturar a execucao da pipeline no branch `dev`
6. abrir a URL DEV
7. mostrar a aplicacao funcionando em DEV

URL DEV:

- https://smart-consulta-dev-hp-20260407.web.app

## 4. Cenario PRD

Fluxo para gravar ou tirar prints:

1. merge ou push para `main`
2. abrir `Actions` no GitHub
3. capturar a execucao da pipeline no branch `main`
4. abrir a URL PRD
5. mostrar a aplicacao funcionando em PRD

URL PRD:

- https://smart-consulta-prd-hp-260407.web.app

## 5. Evidencia extra recomendada

- print do resumo da job no GitHub Actions com:
  - branch
  - ambiente
  - projeto Firebase
  - API configurada

## 6. Estrutura do PDF

- capa
- descricao do projeto
- estrategia DEV e PRD
- pipeline configurada
- evidencias DEV
- evidencias PRD
- seguranca
- links finais
