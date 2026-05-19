# Plano de Implantação

## 1. Visão geral

- Nome do projeto: Smart Consulta
- Objetivo: permitir que pacientes encontrem clínicas, agendem consultas médicas, cancelem atendimentos e deixem avaliações.
- Público-alvo: usuários que necessitam agendar consultas médicas em clínicas parceiras.
- Funcionalidades principais:
  - cadastro e login de usuários
  - busca por clínicas e especialidades
  - visualização de horários disponíveis
  - agendamento e cancelamento de consultas
  - avaliações de clínicas

## 2. Arquitetura

- Frontend: SPA estática hospedada no Firebase Hosting (`frontend/public`).
- Backend: API Express + Sequelize hospedada em nuvem separada (Railway, Render ou equivalente).
- Banco de dados: PostgreSQL em produção ou SQLite local para desenvolvimento.
- Autenticação: JWT no backend.
- Storage: arquivos estáticos no Firebase Hosting e uploads no backend local/serviço de arquivos.

## 3. Ambientes

### Ambientes disponibilizados
- DEV/HML:
  - frontend: `https://smart-consulta-dev-hp-20260407.web.app`
  - backend: configurado via `DEV_API_URL`
- PRD:
  - frontend: `https://smart-consulta-prd-hp-260407.web.app`
  - backend: configurado via `PRD_API_URL`

### Diferenças entre ambientes
- `dev` branch publica no ambiente DEV/HML.
- `main` branch publica no ambiente PRD.
- Cada ambiente usa URL distinta de API para separar produção e homologação.
- O frontend é igual em ambos os ambientes, mas `app-config.js` é gerado com a URL correta da API para cada host.

## 4. Configuração

### Variáveis de ambiente necessárias
- `JWT_SECRET` (backend)
- `EMAIL_USER` e `EMAIL_PASS` (opcional para envio de e-mail)
- `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` (se PostgreSQL for usado)
- `FIREBASE_TOKEN` (GitHub Actions)
- `FIREBASE_PROJECT_DEV` (GitHub Actions)
- `FIREBASE_PROJECT_PRD` (GitHub Actions)
- `DEV_API_URL` (GitHub Actions)
- `PRD_API_URL` (GitHub Actions)

### Arquivos de configuração
- `firebase.json` — configura o hosting do frontend.
- `.firebaserc` — mapeia projetos Firebase dev e prod.
- `.github/workflows/deploy.yml` — define a pipeline de CI/CD.
- `frontend/public/app-config.js` — arquivo de configuração do frontend gerado durante o deploy.

## 5. Deploy

### Fluxo de publicação
1. Fazer commit e push em `dev` para publicar no ambiente DEV/HML.
2. Fazer merge ou push em `main` para publicar no ambiente PRD.
3. O GitHub Actions executa `.github/workflows/deploy.yml`.
4. O workflow instala dependências, valida o build, escolhe o projeto Firebase e publica o frontend.
5. Se os secrets `RAILWAY_TOKEN` e `RAILWAY_PROJECT_ID` estiverem presentes, o backend também é enviado para Railway.

### Passos manuais
- `npm run dev:api` — inicia o backend local.
- `npm run firebase:serve` — testa o frontend localmente com o emulador do Firebase.
- `npm run firebase:deploy:dev` — publica o frontend no projeto dev.
- `npm run firebase:deploy:prod` — publica o frontend no projeto prod.

## 6. Dados

### Carga inicial
- O backend inclui `backend/seed.js` para popular dados iniciais.
- O script cria clínicas, médicos, especialidades e um usuário de teste.
- Usuário de teste disponível:
  - email: `joao@example.com`
  - senha: `senha123`

### Estratégia de dados de demonstração
- A carga inicial fornece dados reais de fluxo principal sem expor informações pessoais reais.
- O seed pode ser executado localmente com `npm run seed` a partir da pasta raiz.

## 7. Segurança

- Segredos não estão armazenados no repositório.
- A pipeline usa GitHub Secrets para `FIREBASE_TOKEN` e Railway.
- O backend usa JWT para autenticação e Helmet para headers de segurança.
- Rate limiting e validação de entrada são aplicados para proteger as rotas.

## 8. Backup e continuidade

- Em produção, o armazenamento de banco de dados é gerenciado pela plataforma de nuvem (por exemplo, Railway/PostgreSQL).
- Plano de recuperação:
  - manter `backend/seed.js` atualizado para restaurar dados de demonstração rapidamente.
  - exportar a base de dados regularmente se o provedor permitir.
  - em caso de falha, recriar o ambiente e reexecutar o seed.

## 9. Validação

### Critérios objetivos
- Frontend acessível na URL correta.
- Login de usuário funcional.
- Agendamento de consulta funcionando.
- Histórico de consultas visível.
- Avaliação de clínica gravada.

### Testes pós-deploy
- Verificar acesso ao frontend.
- Verificar chamadas à API no ambiente correspondente.
- Confirmar que `app-config.js` aponta para `DEV_API_URL` ou `PRD_API_URL` conforme o host.
- Comparar fluxo com regras de negócio: cadastro, login, agendamento e avaliação.

## 10. Monitoramento

Pontos de observação:
- eventos de deploy no GitHub Actions
- logs do Firebase Hosting
- logs do backend no Railway ou serviço de nuvem
- erros de autenticação e de requisição
- disponibilidade do endpoint da API

## 11. Entregáveis

- Link do repositório Git
- URLs DEV/HML e PRD do frontend
- evidência da pipeline e deploy
- documentação técnica de variáveis e configurações
- manual de usuário para acesso e uso
