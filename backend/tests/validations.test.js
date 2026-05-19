// tests/validations.test.js
// Validações de campos obrigatórios e mensagens de erro
// (cobrem os cenários de validação do CT02 e casos adicionais
//  para cada módulo: auth, agendamentos, avaliações)

require('./setup');
const request = require('supertest');
const express = require('express');
const { setupDatabase, teardownDatabase, seedDatabase, dataFutura } = require('./helpers');

function criarApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth',         require('../routes/auth'));
  app.use('/api/clinics',      require('../routes/clinics'));
  app.use('/api/appointments', require('../routes/appointments'));
  return app;
}

let app;
let seed;
let tokenValido;

beforeAll(async () => {
  await setupDatabase();
  seed = await seedDatabase();
  app = criarApp();

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'joao.teste@smartconsult.com', password: 'Teste@123' });
  tokenValido = loginRes.body.token;
});

afterAll(async () => {
  await teardownDatabase();
});

// ─────────────────────────────────────────────────────────────
// Validações no Cadastro (Auth)
// ─────────────────────────────────────────────────────────────
describe('Validações — Cadastro de usuário', () => {
  const BASE_URL = '/api/auth/register';

  it('deve retornar 422 com campo firstName vazio', async () => {
    const res = await request(app).post(BASE_URL).send({
      firstName: '',
      lastName: 'Silva',
      email: 'vazio@smartconsult.com',
      password: 'Teste@123',
    });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('deve retornar 422 com campo lastName vazio', async () => {
    const res = await request(app).post(BASE_URL).send({
      firstName: 'Teste',
      lastName: '',
      email: 'vazio2@smartconsult.com',
      password: 'Teste@123',
    });
    expect(res.status).toBe(422);
  });

  it('deve retornar 422 sem body enviado', async () => {
    const res = await request(app).post(BASE_URL).send({});
    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('deve retornar 422 com e-mail inválido', async () => {
    const res = await request(app).post(BASE_URL).send({
      firstName: 'Teste',
      lastName: 'Inválido',
      email: 'nao-eh-email',
      password: 'Teste@123',
    });
    expect(res.status).toBe(422);
  });

  it('deve retornar 422 com senha curta (menos de 6 chars)', async () => {
    const res = await request(app).post(BASE_URL).send({
      firstName: 'Teste',
      lastName: 'Curta',
      email: 'senha.curta@smartconsult.com',
      password: '123',
    });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].msg).toMatch(/6 caracteres/i);
  });

  it('deve retornar mensagem de erro clara (em português)', async () => {
    const res = await request(app).post(BASE_URL).send({
      firstName: 'Teste',
      lastName: 'Erro',
      email: 'invalido',
      password: 'Teste@123',
    });
    expect(res.status).toBe(422);
    // Mensagem deve ser em português
    expect(res.body.errors.some(e => /[àáâãéêíóôõúç]/i.test(e.msg) || /e-mail|inválido|obrigatório/i.test(e.msg))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// Validações no Login (Auth)
// ─────────────────────────────────────────────────────────────
describe('Validações — Login', () => {
  it('deve retornar 422 sem enviar nenhum campo', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(422);
  });

  it('deve retornar 401 com e-mail correto e senha errada', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'joao.teste@smartconsult.com',
      password: 'SenhaErradaMesmo',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/inválidos/i);
    expect(res.body.token).toBeUndefined();
  });

  it('deve retornar 401 para e-mail não cadastrado', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'fantasma@smartconsult.com',
      password: 'Teste@123',
    });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────
// Validações em Agendamentos
// ─────────────────────────────────────────────────────────────
describe('Validações — Agendamentos', () => {
  it('deve retornar 422 ao criar consulta sem clinicId', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenValido}`)
      .send({
        doctorId:        seed.doctors[0].id,
        appointmentDate: dataFutura(30),
        appointmentTime: '10:00',
      });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/incompletos/i);
  });

  it('deve retornar 422 ao criar consulta sem data', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenValido}`)
      .send({
        clinicId: seed.clinics[0].id,
        doctorId: seed.doctors[0].id,
        appointmentTime: '10:00',
      });
    expect(res.status).toBe(422);
  });

  it('deve retornar 422 ao criar consulta sem horário', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenValido}`)
      .send({
        clinicId:        seed.clinics[0].id,
        doctorId:        seed.doctors[0].id,
        appointmentDate: dataFutura(31),
      });
    expect(res.status).toBe(422);
  });

  it('deve retornar 404 ao agendar com médico inexistente', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenValido}`)
      .send({
        clinicId:        seed.clinics[0].id,
        doctorId:        '00000000-0000-0000-0000-000000000000',
        appointmentDate: dataFutura(32),
        appointmentTime: '10:00',
      });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/não encontrado/i);
  });

  it('deve retornar 401 ao acessar histórico sem token', async () => {
    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Token/i);
  });

  it('deve retornar 404 ao buscar consulta de outro usuário', async () => {
    // Cria consulta como Joao
    const criaRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenValido}`)
      .send({
        clinicId:        seed.clinics[0].id,
        doctorId:        seed.doctors[0].id,
        appointmentDate: dataFutura(40),
        appointmentTime: '08:30',
        type:            'presencial',
        paymentMethod:   'pix',
      });
    const idConsulta = criaRes.body.appointment?.id;

    // Tenta acessar como Mariana
    const loginMariana = await request(app)
      .post('/api/auth/login')
      .send({ email: 'mariana.teste@smartconsult.com', password: 'Teste@123' });

    const res = await request(app)
      .get(`/api/appointments/${idConsulta}`)
      .set('Authorization', `Bearer ${loginMariana.body.token}`);

    expect(res.status).toBe(404); // não pertence a Mariana
  });
});

// ─────────────────────────────────────────────────────────────
// Validações em Avaliações (Reviews)
// ─────────────────────────────────────────────────────────────
describe('Validações — Avaliações', () => {
  it('deve retornar 401 ao avaliar sem estar autenticado', async () => {
    const res = await request(app)
      .post(`/api/clinics/${seed.clinics[0].id}/reviews`)
      .send({ rating: 5, comment: 'Ótimo' });

    expect(res.status).toBe(401);
  });

  it('deve retornar 422 com nota abaixo de 1', async () => {
    const res = await request(app)
      .post(`/api/clinics/${seed.clinics[0].id}/reviews`)
      .set('Authorization', `Bearer ${tokenValido}`)
      .send({ rating: 0 });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/entre 1 e 5/i);
  });

  it('deve retornar 422 com nota acima de 5', async () => {
    const loginPedro = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pedro.teste@smartconsult.com', password: 'Teste@123' });

    const res = await request(app)
      .post(`/api/clinics/${seed.clinics[0].id}/reviews`)
      .set('Authorization', `Bearer ${loginPedro.body.token}`)
      .send({ rating: 10 });

    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────
// Validações na Busca de Disponibilidade
// ─────────────────────────────────────────────────────────────
describe('Validações — Disponibilidade de horários', () => {
  it('deve retornar 422 sem doctorId na busca de disponibilidade', async () => {
    const res = await request(app)
      .get(`/api/clinics/${seed.clinics[0].id}/availability`)
      .query({ date: '2026-05-19' });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/doctorId/i);
  });

  it('deve retornar 422 sem date na busca de disponibilidade', async () => {
    const res = await request(app)
      .get(`/api/clinics/${seed.clinics[0].id}/availability`)
      .query({ doctorId: seed.doctors[0].id });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/date/i);
  });

  it('deve retornar slots vazios para dia sem disponibilidade (domingo)', async () => {
    const res = await request(app)
      .get(`/api/clinics/${seed.clinics[0].id}/availability`)
      .query({ doctorId: seed.doctors[0].id, date: '2026-05-17' }); // domingo

    expect(res.status).toBe(200);
    expect(res.body.slots).toEqual([]); // sem disponibilidade aos domingos
  });
});
