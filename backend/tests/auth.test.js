// tests/auth.test.js
// CT01 — Cadastro de paciente
// CT02 — Validação de campos obrigatórios no cadastro
// CT03 — Login válido do paciente
// CT04 — Login com credenciais inválidas
// CT16 — Logout (invalidação de sessão / token)

require('./setup');
const request = require('supertest');
const express = require('express');
const { setupDatabase, teardownDatabase, seedDatabase, gerarToken } = require('./helpers');
const { sequelize, User } = require('../models');

// Monta app mínimo para os testes de auth
function criarApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('../routes/auth'));
  return app;
}

let app;
let seed;

beforeAll(async () => {
  await setupDatabase();
  seed = await seedDatabase();
  app = criarApp();
});

afterAll(async () => {
  await teardownDatabase();
});

// ─────────────────────────────────────────────────────────────
// CT01 — Cadastro de novo paciente com dados válidos
// ─────────────────────────────────────────────────────────────
describe('CT01 — Cadastro de paciente (dados válidos)', () => {
  it('deve criar conta e retornar token + dados do usuário', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Novo',
        lastName:  'Paciente',
        email:     'novo.paciente@smartconsult.com',
        password:  'Teste@123',
        phone:     '(47) 99000-0001',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/sucesso/i);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({
      firstName: 'Novo',
      lastName:  'Paciente',
      email:     'novo.paciente@smartconsult.com',
    });
    // Senha nunca deve vir na resposta
    expect(res.body.user.password).toBeUndefined();
  });

  it('deve impedir cadastro com e-mail já existente (CT01-b)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Joao',
        lastName:  'da Silva',
        email:     'joao.teste@smartconsult.com', // já cadastrado pelo seed
        password:  'Teste@123',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/já está cadastrado/i);
  });
});

// ─────────────────────────────────────────────────────────────
// CT02 — Validação de campos obrigatórios no cadastro
// ─────────────────────────────────────────────────────────────
describe('CT02 — Validação de campos obrigatórios no cadastro', () => {
  it('deve bloquear cadastro sem e-mail', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ firstName: 'Sem', lastName: 'Email', password: 'Teste@123' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: expect.stringMatching(/e-mail/i) }),
      ])
    );
  });

  it('deve bloquear cadastro sem nome', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'sem.nome@smartconsult.com', password: 'Teste@123' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: expect.stringMatching(/Nome|Sobrenome/i) }),
      ])
    );
  });

  it('deve bloquear cadastro com senha menor que 6 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ firstName: 'Fraca', lastName: 'Senha', email: 'fraca@smartconsult.com', password: '123' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: expect.stringMatching(/6 caracteres/i) }),
      ])
    );
  });

  it('deve bloquear cadastro com e-mail em formato inválido', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ firstName: 'Email', lastName: 'Invalido', email: 'nao-é-email', password: 'Teste@123' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: expect.stringMatching(/e-mail/i) }),
      ])
    );
  });
});

// ─────────────────────────────────────────────────────────────
// CT03 — Login com credenciais válidas
// ─────────────────────────────────────────────────────────────
describe('CT03 — Login do paciente (credenciais válidas)', () => {
  it('deve autenticar e retornar token JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email:    'joao.teste@smartconsult.com',
        password: 'Teste@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ email: 'joao.teste@smartconsult.com' });
    expect(res.body.user.password).toBeUndefined();
  });

  it('deve retornar dados completos do usuário no login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'mariana.teste@smartconsult.com', password: 'Teste@123' });

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('firstName');
    expect(res.body.user).toHaveProperty('lastName');
    expect(res.body.user).toHaveProperty('email');
  });
});

// ─────────────────────────────────────────────────────────────
// CT04 — Login com credenciais inválidas
// ─────────────────────────────────────────────────────────────
describe('CT04 — Login inválido', () => {
  it('deve negar acesso com senha errada', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao.teste@smartconsult.com', password: 'SenhaErrada' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/inválidos/i);
    expect(res.body.token).toBeUndefined();
  });

  it('deve negar acesso com e-mail não cadastrado', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nao.existe@smartconsult.com', password: 'Teste@123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/inválidos/i);
  });

  it('deve negar acesso sem enviar senha', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao.teste@smartconsult.com' });

    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────
// CT16 — Logout / Proteção de rotas sem token
// ─────────────────────────────────────────────────────────────
describe('CT16 — Logout e proteção de rotas autenticadas', () => {
  it('deve negar acesso a /me sem token (sessão encerrada)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Token/i);
  });

  it('deve negar acesso a /me com token inválido', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer tokeninvalido.abc.xyz');

    expect(res.status).toBe(401);
  });

  it('deve permitir acesso a /me com token válido', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao.teste@smartconsult.com', password: 'Teste@123' });

    const token = loginRes.body.token;
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('email', 'joao.teste@smartconsult.com');
  });
});
