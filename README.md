# 🏥 Smart Consulta — Backend Completo

> Revolucionando Agendamentos Médicos

## 📁 Estrutura do Projeto

```
smart-consulta/
├── backend/
│   ├── models/
│   │   └── index.js          ← Modelos do banco (User, Clinic, Doctor, Appointment, Review...)
│   ├── routes/
│   │   ├── auth.js           ← Login, registro, perfil, senha
│   │   ├── clinics.js        ← Clínicas, médicos, disponibilidade, avaliações
│   │   └── appointments.js   ← Agendamentos, cancelamento, histórico
│   ├── middleware/
│   │   └── auth.js           ← Verificação JWT
│   ├── services/
│   │   ├── emailService.js   ← E-mails automáticos (Nodemailer)
│   │   └── reminderService.js← Lembretes automáticos (cron job)
│   ├── database/             ← Criado automaticamente (SQLite)
│   ├── uploads/              ← Criado automaticamente
│   ├── server.js             ← Servidor Express principal
│   ├── seed.js               ← Popular banco com dados iniciais
│   ├── package.json
│   └── .env.example          ← Copie para .env e configure
└── frontend/
    └── public/
        └── index.html        ← Frontend completo (SPA)
```

---

## 🚀 Como rodar

### 1. Pré-requisitos
- **Node.js** 18+ instalado → https://nodejs.org
- **npm** (vem com o Node.js)

### 2. Instalar dependências

```bash
cd backend
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Abra o arquivo `.env` e configure:

```env
# Obrigatório — troque em produção!
JWT_SECRET=coloque_uma_string_longa_e_aleatoria_aqui

# E-mail (opcional para rodar localmente)
EMAIL_USER=seuemail@gmail.com
EMAIL_PASS=sua_senha_de_app_gmail
```

Se quiser usar ambientes separados, copie também:

```bash
cp .env.development.example .env.development
cp .env.production.example .env.production
```

> Para o deploy em Firebase Hosting, o pipeline usa as variáveis `DEV_API_URL` e `PRD_API_URL` para gerar `frontend/public/app-config.js` automaticamente.

> **Dica para Gmail:** Use uma "Senha de App" gerada em:
> Conta Google → Segurança → Verificação em 2 etapas → Senhas de app

### 4. Popular o banco com dados iniciais

```bash
npm run seed
```

Isso cria:
- 6 clínicas parceiras (Joinville/SC)
- 7 médicos com disponibilidade
- 8 especialidades
- Usuário de teste: `joao@example.com` / `senha123`

### 5. Iniciar o servidor

```bash
# Produção
npm start

# Desenvolvimento (reinicia ao salvar)
npm run dev
```

O servidor sobe em **http://localhost:3000** 🎉

---

## 📡 API — Endpoints

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Fazer login |
| GET | `/api/auth/me` | Dados do usuário logado |
| PUT | `/api/auth/profile` | Atualizar perfil |
| PUT | `/api/auth/change-password` | Alterar senha |
| POST | `/api/auth/forgot-password` | Recuperar senha |

### Clínicas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/clinics` | Listar clínicas (busca, filtros, paginação) |
| GET | `/api/clinics/:id` | Detalhes + médicos + avaliações |
| GET | `/api/clinics/:id/availability?doctorId=&date=` | Horários disponíveis |
| POST | `/api/clinics/:id/reviews` | Avaliar clínica (requer login) |

### Agendamentos
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/appointments` | Criar agendamento |
| GET | `/api/appointments` | Histórico do usuário |
| GET | `/api/appointments/stats` | Estatísticas do usuário |
| GET | `/api/appointments/:id` | Detalhes de uma consulta |
| DELETE | `/api/appointments/:id` | Cancelar consulta |

---

## 🗄️ Banco de Dados

Por padrão usa **SQLite** (arquivo local, zero configuração).

Para usar **PostgreSQL** em produção, altere no `.env`:

```env
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_consulta
DB_USER=postgres
DB_PASS=sua_senha
```

---

## 📧 E-mails automáticos

O sistema envia automaticamente:

| Evento | Template |
|--------|----------|
| Cadastro | Boas-vindas |
| Agendamento | Confirmação com detalhes |
| 24h antes | Lembrete de consulta |
| 2h antes | Lembrete de consulta |
| Cancelamento | Confirmação + taxa aplicada |
| Recuperar senha | Link de redefinição |

---

## 🔒 Segurança implementada

- ✅ Senhas com **bcrypt** (12 rounds)
- ✅ Autenticação via **JWT** (7 dias)
- ✅ **Helmet.js** — headers de segurança HTTP
- ✅ **Rate limiting** — 100 req/15min (10 para login)
- ✅ Validação de inputs com **express-validator**
- ✅ **CORS** configurado por origem
- ✅ Proteção contra brute-force no login

---

## 🌐 Deploy (produção)

### Opção 1 — Railway (recomendado, gratuito)
1. Crie conta em https://railway.app
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente
4. Deploy automático!

### Opção 2 — VPS (DigitalOcean, Contabo)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar com PM2
pm2 start server.js --name smart-consulta
pm2 save
pm2 startup
```

### Opção 3 — Heroku
```bash
heroku create smart-consulta
heroku config:set JWT_SECRET=sua_chave
git push heroku main
```

---

## 📝 Licença
Smart Consulta © 2026 — Todos os direitos reservados.
