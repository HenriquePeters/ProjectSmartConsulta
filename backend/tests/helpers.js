// tests/helpers.js — Utilitários compartilhados entre os testes

const { sequelize, User, Clinic, Doctor, Specialty, DoctorAvailability, Appointment, Review } = require('../models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ─────────────────────────────────────────
// Inicializa o banco em memória
// ─────────────────────────────────────────
async function setupDatabase() {
  await sequelize.authenticate();
  await sequelize.sync({ force: true }); // recria tabelas a cada suite
}

async function teardownDatabase() {
  await sequelize.close();
}

// ─────────────────────────────────────────
// Dados fictícios fixos (alinhados ao PDF)
// ─────────────────────────────────────────
const PACIENTES = [
  { firstName: 'Joao',    lastName: 'da Silva', email: 'joao.teste@smartconsult.com',     phone: '(47) 99911-2200', password: 'Teste@123' },
  { firstName: 'Mariana', lastName: 'Costa',    email: 'mariana.teste@smartconsult.com',  phone: '(47) 99822-3311', password: 'Teste@123' },
  { firstName: 'Pedro',   lastName: 'Henrique', email: 'pedro.teste@smartconsult.com',    phone: '(47) 99733-4422', password: 'Teste@123' },
];

const CLINICAS = [
  { name: 'Clinica Saude Mais', address: 'Rua das Flores, 100', city: 'Jaragua do Sul', state: 'SC', zipCode: '89251-000', phone: '(47) 3000-1111', isActive: true, avgRating: 4.5, totalRatings: 10 },
  { name: 'Clinica Bem Estar',  address: 'Av. Brasil, 200',     city: 'Joinville',      state: 'SC', zipCode: '89200-000', phone: '(47) 3000-2222', isActive: true, avgRating: 4.2, totalRatings: 8  },
  { name: 'Centro Medico Norte',address: 'Rua Norte, 300',      city: 'Jaragua do Sul', state: 'SC', zipCode: '89251-111', phone: '(47) 3000-3333', isActive: true, avgRating: 4.8, totalRatings: 15 },
];

const ESPECIALIDADES = [
  { name: 'Cardiologista', icon: '❤️' },
  { name: 'Dermatologista', icon: '🩺' },
  { name: 'Ortopedista', icon: '🦴' },
];

// ─────────────────────────────────────────
// Semeia os dados ficticios no banco
// ─────────────────────────────────────────
async function seedDatabase() {
  // Especialidades
  const specs = await Promise.all(
    ESPECIALIDADES.map(e => Specialty.create(e))
  );

  // Clínicas
  const clinics = await Promise.all(
    CLINICAS.map(c => Clinic.create(c))
  );

  // Médicos
  const doctors = await Promise.all([
    Doctor.create({ name: 'Dr. Carlos Mendes',  crm: 'SC-12345', consultPrice: 180.00, specialtyId: specs[0].id, avatarInitials: 'CM', avatarColor: '#E1F5EE', avatarTextColor: '#0F6E56', isActive: true }),
    Doctor.create({ name: 'Dra. Ana Ribeiro',   crm: 'SC-67890', consultPrice: 150.00, specialtyId: specs[1].id, avatarInitials: 'AR', avatarColor: '#EDE1F5', avatarTextColor: '#6E0F6E', isActive: true }),
    Doctor.create({ name: 'Dr. Felipe Souza',   crm: 'SC-11111', consultPrice: 200.00, specialtyId: specs[2].id, avatarInitials: 'FS', avatarColor: '#F5EDE1', avatarTextColor: '#6E4C0F', isActive: true }),
  ]);

  // Associar médicos às clínicas
  await clinics[0].addDoctor(doctors[0]);
  await clinics[1].addDoctor(doctors[1]);
  await clinics[2].addDoctor(doctors[2]);

  // Disponibilidade (Seg a Sex, 08h–18h, slots de 30 min)
  for (const doctor of doctors) {
    for (let day = 1; day <= 5; day++) {
      await DoctorAvailability.create({
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '18:00',
        slotMinutes: 30,
      });
    }
  }

  // Usuários (pacientes fictícios)
  const users = await Promise.all(
    PACIENTES.map(async p => {
      const hashed = await bcrypt.hash(p.password, 12);
      return User.create({ ...p, password: hashed, avatarColor: '#1D9E75' });
    })
  );

  return { specs, clinics, doctors, users };
}

// ─────────────────────────────────────────
// Cria um token JWT de teste para um usuário
// ─────────────────────────────────────────
function gerarToken(userId) {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// ─────────────────────────────────────────
// Data futura para evitar conflitos
// ─────────────────────────────────────────
function dataFutura(diasOffset = 7) {
  const d = new Date();
  d.setDate(d.getDate() + diasOffset);
  // Garante dia de semana (seg-sex)
  const dia = d.getDay();
  if (dia === 0) d.setDate(d.getDate() + 1);
  if (dia === 6) d.setDate(d.getDate() + 2);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

module.exports = { setupDatabase, teardownDatabase, seedDatabase, gerarToken, dataFutura, PACIENTES, CLINICAS };
