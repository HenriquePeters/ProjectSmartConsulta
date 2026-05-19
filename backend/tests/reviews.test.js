// tests/reviews.test.js
// CT14 — Avaliação do profissional após a consulta
//         (salva avaliação, exibe no perfil, impede avaliação dupla)

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
let tokenAna;
let appointmentIdAna;
let clinicaId;

beforeAll(async () => {
  await setupDatabase();
  seed = await seedDatabase();
  app = criarApp();

  // Login da Mariana (que vai avaliar Dra. Ana Ribeiro)
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'mariana.teste@smartconsult.com', password: 'Teste@123' });
  tokenAna = loginRes.body.token;

  // Clínica da Dra. Ana Ribeiro
  clinicaId = seed.clinics[1].id; // Clinica Bem Estar

  // Cria uma consulta para a Mariana (necessária para ter appointmentId)
  const apptRes = await request(app)
    .post('/api/appointments')
    .set('Authorization', `Bearer ${tokenAna}`)
    .send({
      clinicId:        clinicaId,
      doctorId:        seed.doctors[1].id,
      appointmentDate: dataFutura(5),
      appointmentTime: '09:00',
      type:            'presencial',
      paymentMethod:   'pix',
    });
  appointmentIdAna = apptRes.body.appointment?.id;
});

afterAll(async () => {
  await teardownDatabase();
});

// ─────────────────────────────────────────────────────────────
// CT14 — Avaliação do profissional
// ─────────────────────────────────────────────────────────────
describe('CT14 — Avaliação do profissional (review)', () => {
  it('deve salvar avaliação com nota e comentário', async () => {
    const res = await request(app)
      .post(`/api/clinics/${clinicaId}/reviews`)
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({
        rating:        5,
        comment:       'Excelente atendimento! A Dra. Ana foi muito atenciosa.',
        appointmentId: appointmentIdAna,
      });

    expect(res.status).toBe(201);
    expect(res.body.review).toMatchObject({
      rating:  5,
      comment: expect.stringContaining('atenciosa'),
    });
  });

  it('deve atualizar a média de avaliação da clínica após review', async () => {
    const res = await request(app).get(`/api/clinics/${clinicaId}`);

    expect(res.status).toBe(200);
    expect(res.body.clinic.avgRating).toBeGreaterThan(0);
    expect(res.body.clinic.totalRatings).toBeGreaterThanOrEqual(1);
  });

  it('deve exibir a avaliação salva no perfil da clínica', async () => {
    const res = await request(app).get(`/api/clinics/${clinicaId}`);

    expect(res.status).toBe(200);
    const reviews = res.body.clinic.reviews;
    expect(Array.isArray(reviews)).toBe(true);
    expect(reviews.length).toBeGreaterThanOrEqual(1);

    const minhaAvaliacao = reviews.find(r => r.rating === 5);
    expect(minhaAvaliacao).toBeDefined();
    expect(minhaAvaliacao.comment).toContain('atenciosa');
  });

  it('deve impedir avaliação duplicada da mesma clínica pelo mesmo usuário', async () => {
    const res = await request(app)
      .post(`/api/clinics/${clinicaId}/reviews`)
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({
        rating:  4,
        comment: 'Segunda tentativa de avaliação.',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/já avaliou/i);
  });

  it('deve rejeitar avaliação com nota 0 (fora do intervalo)', async () => {
    // Pedro avaliando a clínica — nota inválida
    const loginPedro = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pedro.teste@smartconsult.com', password: 'Teste@123' });

    const res = await request(app)
      .post(`/api/clinics/${clinicaId}/reviews`)
      .set('Authorization', `Bearer ${loginPedro.body.token}`)
      .send({ rating: 0, comment: 'Nota inválida' });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/entre 1 e 5/i);
  });

  it('deve rejeitar avaliação com nota 6 (fora do intervalo)', async () => {
    const loginPedro = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pedro.teste@smartconsult.com', password: 'Teste@123' });

    const res = await request(app)
      .post(`/api/clinics/${clinicaId}/reviews`)
      .set('Authorization', `Bearer ${loginPedro.body.token}`)
      .send({ rating: 6, comment: 'Nota inválida acima' });

    expect(res.status).toBe(422);
  });

  it('deve exigir autenticação para avaliar', async () => {
    const res = await request(app)
      .post(`/api/clinics/${clinicaId}/reviews`)
      .send({ rating: 5, comment: 'Sem token' });

    expect(res.status).toBe(401);
  });

  it('deve aceitar avaliação somente com nota (sem comentário)', async () => {
    // Usa a clínica[2] para não ter conflito de "já avaliou"
    const loginPedro = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pedro.teste@smartconsult.com', password: 'Teste@123' });

    const res = await request(app)
      .post(`/api/clinics/${seed.clinics[2].id}/reviews`)
      .set('Authorization', `Bearer ${loginPedro.body.token}`)
      .send({ rating: 4 }); // sem comentário

    expect(res.status).toBe(201);
    expect(res.body.review.rating).toBe(4);
  });
});
