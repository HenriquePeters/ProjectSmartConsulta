// tests/appointments.test.js
// CT08 — Agendar consulta com data e horário disponível
// CT09 — Conflito de horário (impede horário duplicado)
// CT10 — Pagamento simulado da consulta
// CT11 — Reagendar consulta
// CT12 — Cancelar consulta
// CT13 — Histórico de consultas do paciente

require('./setup');
const request = require('supertest');
const express = require('express');
const { setupDatabase, teardownDatabase, seedDatabase, gerarToken, dataFutura } = require('./helpers');
const { Appointment } = require('../models');

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
let tokenJoao;
let tokenMariana;

// Dados do agendamento principal (CT08)
const DADOS_CONSULTA = {
  appointmentDate: dataFutura(7),  // semana que vem
  appointmentTime: '14:30',
  type:            'presencial',
  paymentMethod:   'pix',
};

let appointmentId; // guardado entre testes

beforeAll(async () => {
  await setupDatabase();
  seed = await seedDatabase();
  app = criarApp();

  // Faz login para obter tokens reais
  const loginJoao = await request(app)
    .post('/api/auth/login')
    .send({ email: 'joao.teste@smartconsult.com', password: 'Teste@123' });
  tokenJoao = loginJoao.body.token;

  const loginMariana = await request(app)
    .post('/api/auth/login')
    .send({ email: 'mariana.teste@smartconsult.com', password: 'Teste@123' });
  tokenMariana = loginMariana.body.token;
});

afterAll(async () => {
  await teardownDatabase();
});

// ─────────────────────────────────────────────────────────────
// CT08 — Agendar consulta com data e horário disponível
// ─────────────────────────────────────────────────────────────
describe('CT08 — Agendamento de consulta', () => {
  it('deve criar consulta com sucesso para horário disponível', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`)
      .send({
        clinicId:        seed.clinics[0].id,
        doctorId:        seed.doctors[0].id,
        appointmentDate: DADOS_CONSULTA.appointmentDate,
        appointmentTime: DADOS_CONSULTA.appointmentTime,
        type:            DADOS_CONSULTA.type,
        paymentMethod:   DADOS_CONSULTA.paymentMethod,
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/sucesso/i);
    expect(res.body.appointment).toMatchObject({
      appointmentDate: DADOS_CONSULTA.appointmentDate,
      appointmentTime: DADOS_CONSULTA.appointmentTime,
      status:          'confirmed',
      paymentStatus:   'paid',
      type:            'presencial',
    });
    expect(res.body.appointment.basePrice).toBe('180.00');
    expect(res.body.appointment.convenienceFee).toBe('5.00');

    // Guarda ID para os próximos testes
    appointmentId = res.body.appointment.id;
    expect(appointmentId).toBeDefined();
  });

  it('deve exibir dados do médico e da clínica na resposta', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`)
      .send({
        clinicId:        seed.clinics[0].id,
        doctorId:        seed.doctors[0].id,
        appointmentDate: dataFutura(14),
        appointmentTime: '10:00',
        type:            'presencial',
        paymentMethod:   'cartao',
      });

    expect(res.status).toBe(201);
    expect(res.body.appointment.doctor).toMatchObject({ name: 'Dr. Carlos Mendes' });
    expect(res.body.appointment.clinic).toMatchObject({ name: 'Clinica Saude Mais' });
  });

  it('deve exigir autenticação para agendar consulta', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({
        clinicId:        seed.clinics[0].id,
        doctorId:        seed.doctors[0].id,
        appointmentDate: dataFutura(8),
        appointmentTime: '09:00',
      });

    expect(res.status).toBe(401);
  });

  it('deve retornar 422 quando dados obrigatórios estão faltando', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`)
      .send({ clinicId: seed.clinics[0].id }); // sem doctorId, date, time

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/incompletos/i);
  });
});

// ─────────────────────────────────────────────────────────────
// CT09 — Conflito de horário (impede duplicata)
// ─────────────────────────────────────────────────────────────
describe('CT09 — Conflito de horário', () => {
  it('deve impedir segundo agendamento no mesmo horário com o mesmo médico', async () => {
    // Primeiro agendamento (referência para conflito)
    const data = dataFutura(9);
    await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`)
      .send({
        clinicId:        seed.clinics[0].id,
        doctorId:        seed.doctors[0].id,
        appointmentDate: data,
        appointmentTime: '11:00',
        type:            'presencial',
        paymentMethod:   'pix',
      });

    // Segundo agendamento tentando o mesmo slot (outro paciente)
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenMariana}`)
      .send({
        clinicId:        seed.clinics[0].id,
        doctorId:        seed.doctors[0].id,
        appointmentDate: data,
        appointmentTime: '11:00', // mesmo horário
        type:            'presencial',
        paymentMethod:   'cartao',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/já ocupado/i);
  });
});

// ─────────────────────────────────────────────────────────────
// CT10 — Pagamento simulado da consulta
// ─────────────────────────────────────────────────────────────
describe('CT10 — Pagamento simulado', () => {
  it('deve registrar status "paid" ao criar agendamento com método PIX', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`)
      .send({
        clinicId:        seed.clinics[1].id,
        doctorId:        seed.doctors[1].id,
        appointmentDate: dataFutura(10),
        appointmentTime: '09:00',
        type:            'presencial',
        paymentMethod:   'pix',
      });

    expect(res.status).toBe(201);
    expect(res.body.appointment.paymentStatus).toBe('paid');
    expect(res.body.appointment.paymentMethod).toBe('pix');
  });

  it('deve registrar status "paid" ao criar agendamento com cartão', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`)
      .send({
        clinicId:        seed.clinics[0].id,
        doctorId:        seed.doctors[0].id,
        appointmentDate: dataFutura(11),
        appointmentTime: '15:00',
        type:            'presencial',
        paymentMethod:   'cartao',
      });

    expect(res.status).toBe(201);
    expect(res.body.appointment.paymentStatus).toBe('paid');
  });

  it('deve calcular o totalPrice como basePrice + taxa de conveniência', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`)
      .send({
        clinicId:        seed.clinics[2].id,
        doctorId:        seed.doctors[2].id,
        appointmentDate: dataFutura(12),
        appointmentTime: '08:00',
        type:            'presencial',
        paymentMethod:   'boleto',
      });

    expect(res.status).toBe(201);
    const { basePrice, convenienceFee, totalPrice } = res.body.appointment;
    expect(parseFloat(totalPrice)).toBe(parseFloat(basePrice) + parseFloat(convenienceFee));
  });
});

// ─────────────────────────────────────────────────────────────
// CT11 — Reagendar consulta
// ─────────────────────────────────────────────────────────────
describe('CT11 — Reagendamento de consulta', () => {
  let idParaReagendar;

  beforeAll(async () => {
    // Cria uma consulta para reagendar
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`)
      .send({
        clinicId:        seed.clinics[0].id,
        doctorId:        seed.doctors[0].id,
        appointmentDate: dataFutura(15),
        appointmentTime: '16:00',
        type:            'presencial',
        paymentMethod:   'pix',
      });
    idParaReagendar = res.body.appointment?.id;
  });

  it('deve cancelar a consulta original e criar nova com novo horário', async () => {
    // O reagendamento no sistema é: cancelar + criar nova consulta
    // Passo 1: cancela a original
    const cancelRes = await request(app)
      .delete(`/api/appointments/${idParaReagendar}`)
      .set('Authorization', `Bearer ${tokenJoao}`)
      .send({ reason: 'Reagendamento' });

    expect(cancelRes.status).toBe(200);

    // Passo 2: cria nova consulta no novo horário
    const novoHorario = dataFutura(23); // nova data
    const novaRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`)
      .send({
        clinicId:        seed.clinics[0].id,
        doctorId:        seed.doctors[0].id,
        appointmentDate: novoHorario,
        appointmentTime: '10:00',
        type:            'presencial',
        paymentMethod:   'pix',
      });

    expect(novaRes.status).toBe(201);
    expect(novaRes.body.appointment.appointmentDate).toBe(novoHorario);
    expect(novaRes.body.appointment.appointmentTime).toBe('10:00');
    expect(novaRes.body.appointment.status).toBe('confirmed');
  });
});

// ─────────────────────────────────────────────────────────────
// CT12 — Cancelar consulta
// ─────────────────────────────────────────────────────────────
describe('CT12 — Cancelamento de consulta', () => {
  let idParaCancelar;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenMariana}`)
      .send({
        clinicId:        seed.clinics[1].id,
        doctorId:        seed.doctors[1].id,
        appointmentDate: dataFutura(20),
        appointmentTime: '13:00',
        type:            'presencial',
        paymentMethod:   'pix',
      });
    idParaCancelar = res.body.appointment?.id;
  });

  it('deve cancelar consulta e retornar taxa de cancelamento', async () => {
    const res = await request(app)
      .delete(`/api/appointments/${idParaCancelar}`)
      .set('Authorization', `Bearer ${tokenMariana}`)
      .send({ reason: 'Compromisso anterior' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cancelada/i);
    expect(res.body).toHaveProperty('cancelFee');
    expect(res.body).toHaveProperty('refund');
  });

  it('deve impedir cancelar a mesma consulta duas vezes', async () => {
    const res = await request(app)
      .delete(`/api/appointments/${idParaCancelar}`)
      .set('Authorization', `Bearer ${tokenMariana}`)
      .send({ reason: 'Tentativa dupla' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/já cancelada/i);
  });

  it('deve retornar 404 para consulta de outro paciente', async () => {
    const res = await request(app)
      .delete(`/api/appointments/${idParaCancelar}`)
      .set('Authorization', `Bearer ${tokenJoao}`) // usuário errado
      .send({ reason: 'Acesso indevido' });

    expect(res.status).toBe(404);
  });

  it('deve exigir autenticação para cancelar', async () => {
    const res = await request(app)
      .delete(`/api/appointments/${idParaCancelar}`)
      .send({ reason: 'Sem token' });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────
// CT13 — Histórico de consultas do paciente
// ─────────────────────────────────────────────────────────────
describe('CT13 — Histórico de consultas', () => {
  it('deve listar todas as consultas do paciente autenticado', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.appointments)).toBe(true);
    expect(res.body.appointments.length).toBeGreaterThan(0);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('deve incluir dados do médico e clínica em cada consulta', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`);

    expect(res.status).toBe(200);
    const consulta = res.body.appointments[0];
    expect(consulta.doctor).toBeDefined();
    expect(consulta.clinic).toBeDefined();
    expect(consulta.doctor.name).toBeDefined();
    expect(consulta.clinic.name).toBeDefined();
  });

  it('deve filtrar histórico por status "confirmed"', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`)
      .query({ status: 'confirmed' });

    expect(res.status).toBe(200);
    res.body.appointments.forEach(a => {
      expect(a.status).toBe('confirmed');
    });
  });

  it('deve filtrar histórico por status "cancelled"', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${tokenMariana}`)
      .query({ status: 'cancelled' });

    expect(res.status).toBe(200);
    res.body.appointments.forEach(a => {
      expect(a.status).toBe('cancelled');
    });
  });

  it('deve suportar paginação no histórico', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`)
      .query({ page: 1, limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.appointments.length).toBeLessThanOrEqual(2);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('totalPages');
  });

  it('deve retornar estatísticas do histórico', async () => {
    const res = await request(app)
      .get('/api/appointments/stats')
      .set('Authorization', `Bearer ${tokenJoao}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('upcoming');
    expect(res.body).toHaveProperty('done');
    expect(res.body).toHaveProperty('cancelled');
  });

  it('deve exibir detalhes de uma consulta específica', async () => {
    // Pega a primeira consulta do histórico
    const listaRes = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${tokenJoao}`);

    const id = listaRes.body.appointments[0].id;

    const res = await request(app)
      .get(`/api/appointments/${id}`)
      .set('Authorization', `Bearer ${tokenJoao}`);

    expect(res.status).toBe(200);
    expect(res.body.appointment.id).toBe(id);
  });

  it('deve exigir autenticação para acessar histórico', async () => {
    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(401);
  });
});
