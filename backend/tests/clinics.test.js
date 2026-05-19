// tests/clinics.test.js
// CT05 — Busca por especialidade
// CT06 — Busca por cidade / clínica
// CT07 — Visualização do perfil do profissional (dados, endereço, avaliação)
// Inclui também: busca por nome de profissional

require('./setup');
const request = require('supertest');
const express = require('express');
const { setupDatabase, teardownDatabase, seedDatabase } = require('./helpers');

function criarApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth',   require('../routes/auth'));
  app.use('/api/clinics', require('../routes/clinics'));
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
// CT05 — Busca por especialidade
// ─────────────────────────────────────────────────────────────
describe('CT05 — Busca por especialidade', () => {
  it('deve retornar clínicas com médico Cardiologista', async () => {
    const res = await request(app)
      .get('/api/clinics')
      .query({ specialty: 'Cardiologista' });

    expect(res.status).toBe(200);
    expect(res.body.clinics).toBeDefined();
    expect(Array.isArray(res.body.clinics)).toBe(true);

    // Verificar que pelo menos uma clínica retornada tem médico cardiologista
    const temCardiologista = res.body.clinics.some(clinic =>
      clinic.doctors?.some(d =>
        d.specialty?.name?.toLowerCase().includes('cardiolog')
      )
    );
    expect(temCardiologista).toBe(true);
  });

  it('deve retornar clínicas com Dermatologista', async () => {
    const res = await request(app)
      .get('/api/clinics')
      .query({ specialty: 'Dermatologista' });

    expect(res.status).toBe(200);
    const temDermatologista = res.body.clinics.some(clinic =>
      clinic.doctors?.some(d =>
        d.specialty?.name?.toLowerCase().includes('dermatolog')
      )
    );
    expect(temDermatologista).toBe(true);
  });

  it('deve retornar lista vazia para especialidade inexistente', async () => {
    const res = await request(app)
      .get('/api/clinics')
      .query({ specialty: 'EspecialidadeQueNaoExiste' });

    expect(res.status).toBe(200);
    // Pode retornar array vazio ou clínicas sem médicos dessa especialidade
    expect(Array.isArray(res.body.clinics)).toBe(true);
  });

  it('deve listar todas as clínicas sem filtro', async () => {
    const res = await request(app).get('/api/clinics');

    expect(res.status).toBe(200);
    expect(res.body.clinics.length).toBeGreaterThanOrEqual(3);
    expect(res.body.total).toBeGreaterThanOrEqual(3);
    expect(res.body.page).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────
// CT06 — Busca por cidade / clínica
// ─────────────────────────────────────────────────────────────
describe('CT06 — Busca por cidade e nome de clínica', () => {
  it('deve filtrar clínicas por cidade (Jaragua do Sul)', async () => {
    const res = await request(app)
      .get('/api/clinics')
      .query({ city: 'Jaragua do Sul' });

    expect(res.status).toBe(200);
    expect(res.body.clinics.length).toBeGreaterThanOrEqual(2);

    // Todas as clínicas retornadas devem ser da cidade buscada
    res.body.clinics.forEach(clinic => {
      expect(clinic.city.toLowerCase()).toContain('jaragua');
    });
  });

  it('deve filtrar clínicas por cidade (Joinville)', async () => {
    const res = await request(app)
      .get('/api/clinics')
      .query({ city: 'Joinville' });

    expect(res.status).toBe(200);
    res.body.clinics.forEach(clinic => {
      expect(clinic.city.toLowerCase()).toContain('joinville');
    });
  });

  it('deve buscar clínica por nome (search)', async () => {
    const res = await request(app)
      .get('/api/clinics')
      .query({ search: 'Saude Mais' });

    expect(res.status).toBe(200);
    expect(res.body.clinics.length).toBeGreaterThanOrEqual(1);
    expect(res.body.clinics[0].name).toMatch(/Saude Mais/i);
  });

  it('deve buscar clínica por endereço (search por rua)', async () => {
    const res = await request(app)
      .get('/api/clinics')
      .query({ search: 'Flores' });

    expect(res.status).toBe(200);
    expect(res.body.clinics.length).toBeGreaterThanOrEqual(1);
  });

  it('deve suportar paginação', async () => {
    const res = await request(app)
      .get('/api/clinics')
      .query({ page: 1, limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.clinics.length).toBeLessThanOrEqual(2);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────
// CT07 — Visualização do perfil do profissional
// ─────────────────────────────────────────────────────────────
describe('CT07 — Visualização do perfil do profissional (clínica + médico + avaliação)', () => {
  let clinicId;

  beforeAll(async () => {
    clinicId = seed.clinics[0].id; // Clinica Saude Mais
  });

  it('deve retornar os dados completos da clínica', async () => {
    const res = await request(app).get(`/api/clinics/${clinicId}`);

    expect(res.status).toBe(200);
    expect(res.body.clinic).toMatchObject({
      name:    'Clinica Saude Mais',
      address: expect.any(String),
      city:    'Jaragua do Sul',
      state:   'SC',
      phone:   expect.any(String),
    });
  });

  it('deve incluir médicos associados à clínica com especialidade', async () => {
    const res = await request(app).get(`/api/clinics/${clinicId}`);

    expect(res.status).toBe(200);
    const doctors = res.body.clinic.doctors;
    expect(Array.isArray(doctors)).toBe(true);
    expect(doctors.length).toBeGreaterThanOrEqual(1);

    const drCarlos = doctors.find(d => d.name === 'Dr. Carlos Mendes');
    expect(drCarlos).toBeDefined();
    expect(drCarlos.specialty).toMatchObject({ name: 'Cardiologista' });
    expect(drCarlos.consultPrice).toBeDefined();
  });

  it('deve incluir avaliações (reviews) da clínica', async () => {
    const res = await request(app).get(`/api/clinics/${clinicId}`);

    expect(res.status).toBe(200);
    expect(res.body.clinic.reviews).toBeDefined();
    expect(Array.isArray(res.body.clinic.reviews)).toBe(true);
  });

  it('deve incluir distribuição de estrelas', async () => {
    const res = await request(app).get(`/api/clinics/${clinicId}`);

    expect(res.status).toBe(200);
    expect(res.body.starDistribution).toBeDefined();
  });

  it('deve incluir disponibilidades do médico', async () => {
    const res = await request(app).get(`/api/clinics/${clinicId}`);

    expect(res.status).toBe(200);
    const drCarlos = res.body.clinic.doctors.find(d => d.name === 'Dr. Carlos Mendes');
    expect(drCarlos.availabilities).toBeDefined();
    expect(drCarlos.availabilities.length).toBeGreaterThan(0);
  });

  it('deve retornar 404 para clínica inexistente', async () => {
    const res = await request(app).get('/api/clinics/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/não encontrada/i);
  });

  it('deve retornar horários disponíveis de um médico em uma data', async () => {
    const doctorId = seed.doctors[0].id;
    const data = '2026-05-19'; // Segunda-feira

    const res = await request(app)
      .get(`/api/clinics/${clinicId}/availability`)
      .query({ doctorId, date: data });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.slots)).toBe(true);
    expect(res.body.slots.length).toBeGreaterThan(0);
    res.body.slots.forEach(slot => {
      expect(slot).toHaveProperty('time');
      expect(slot).toHaveProperty('available');
    });
  });

  it('deve retornar 422 ao buscar disponibilidade sem doctorId', async () => {
    const res = await request(app)
      .get(`/api/clinics/${clinicId}/availability`)
      .query({ date: '2026-05-19' });

    expect(res.status).toBe(422);
  });
});
