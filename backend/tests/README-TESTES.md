# Smart Consult — Guia de Testes Automatizados

## Visão Geral

Os testes foram desenvolvidos com **Jest** + **Supertest** e cobrem todos os casos de teste descritos no Plano de Testes (PDF), usando **SQLite em memória** para não afetar o banco de dados real.

---

## Pré-requisitos

```bash
cd backend
npm install
```

---

## Executar os Testes

```bash
# Todos os testes (modo padrão)
npm test

# Com relatório de cobertura
npm run test:coverage

# Modo watch (re-executa ao salvar)
npm run test:watch
```

---

## Estrutura dos Arquivos de Teste

```
backend/
└── tests/
    ├── setup.js            # Configuração global (SQLite em memória, mocks de e-mail)
    ├── helpers.js          # Banco de dados, seed de dados fictícios, utilitários
    ├── auth.test.js        # CT01, CT02, CT03, CT04, CT16
    ├── clinics.test.js     # CT05, CT06, CT07
    ├── appointments.test.js # CT08, CT09, CT10, CT11, CT12, CT13
    ├── reviews.test.js     # CT14
    └── validations.test.js # Validações de campos e mensagens de erro
```

---

## Cobertura dos Casos de Teste (PDF)

| ID   | Funcionalidade                          | Arquivo de Teste         |
|------|-----------------------------------------|--------------------------|
| CT01 | Cadastro de paciente                    | `auth.test.js`           |
| CT02 | Validação de campos obrigatórios        | `auth.test.js` + `validations.test.js` |
| CT03 | Login do paciente                       | `auth.test.js`           |
| CT04 | Login inválido                          | `auth.test.js`           |
| CT05 | Busca por especialidade                 | `clinics.test.js`        |
| CT06 | Busca por cidade / clínica              | `clinics.test.js`        |
| CT07 | Visualização do perfil do profissional  | `clinics.test.js`        |
| CT08 | Agendamento de consulta                 | `appointments.test.js`   |
| CT09 | Conflito de horário                     | `appointments.test.js`   |
| CT10 | Pagamento simulado                      | `appointments.test.js`   |
| CT11 | Reagendamento de consulta               | `appointments.test.js`   |
| CT12 | Cancelamento de consulta                | `appointments.test.js`   |
| CT13 | Histórico de consultas                  | `appointments.test.js`   |
| CT14 | Avaliação do profissional               | `reviews.test.js`        |
| CT16 | Logout / proteção de rotas              | `auth.test.js`           |

---

## Dados Fictícios Utilizados

Os dados são os mesmos do PDF (Seção 5):

**Pacientes:**
- `joao.teste@smartconsult.com` / `Teste@123`
- `mariana.teste@smartconsult.com` / `Teste@123`
- `pedro.teste@smartconsult.com` / `Teste@123`

**Profissionais:**
- Dr. Carlos Mendes — Cardiologista — Clinica Saude Mais
- Dra. Ana Ribeiro — Dermatologista — Clinica Bem Estar
- Dr. Felipe Souza — Ortopedista — Centro Medico Norte

---

## Observações Importantes

- Os testes rodam **isolados do banco real** (SQLite em memória, zerado a cada suite).
- E-mails são **mockados** — nenhum e-mail é enviado durante os testes.
- O `--runInBand` garante execução sequencial, evitando conflitos de banco entre suites.
- O `--forceExit` encerra o processo ao final mesmo com conexões abertas.
