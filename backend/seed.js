// seed.js — Popular banco com dados iniciais
require('./env-loader');
const bcrypt = require('bcryptjs');
const { sequelize, User, Specialty, Clinic, Doctor, DoctorAvailability } = require('./models');

async function seed() {
  await sequelize.sync({ force: true });
  console.log('✅ Banco sincronizado.');

  // ── Especialidades ──
  const specs = await Specialty.bulkCreate([
    { name: 'Clínica Geral',  icon: '🏥' },
    { name: 'Cardiologia',    icon: '❤️' },
    { name: 'Pediatria',      icon: '🧒' },
    { name: 'Dermatologia',   icon: '✨' },
    { name: 'Ortopedia',      icon: '🦴' },
    { name: 'Odontologia',    icon: '🦷' },
    { name: 'Neurologia',     icon: '🧠' },
    { name: 'Ginecologia',    icon: '💜' },
  ]);
  console.log('✅ Especialidades criadas.');

  const [geral, cardio, ped, derm, orto, odonto] = specs;

  // ── Médicos ──
  const doctors = await Doctor.bulkCreate([
    { name: 'Dr. Felipe Moura',    crm: 'SC-12345', specialtyId: geral.id,  consultPrice: 150, consultDuration: 30, avatarInitials: 'FM', avatarColor: '#E1F5EE', avatarTextColor: '#0F6E56', avgRating: 4.9, totalRatings: 312, bio: 'Médico com 12 anos de experiência em clínica geral e medicina preventiva.' },
    { name: 'Dra. Ana Ribeiro',    crm: 'SC-23456', specialtyId: cardio.id, consultPrice: 120, consultDuration: 45, avatarInitials: 'AR', avatarColor: '#FBEAF0', avatarTextColor: '#993556', avgRating: 4.8, totalRatings: 189, bio: 'Cardiologista com formação pela USP e especialização em arritmias cardíacas.' },
    { name: 'Dr. Lucas Peixoto',   crm: 'SC-34567', specialtyId: orto.id,   consultPrice: 180, consultDuration: 30, avatarInitials: 'LP', avatarColor: '#E6F1FB', avatarTextColor: '#185FA5', avgRating: 4.6, totalRatings: 143, bio: 'Ortopedista especialista em joelho e coluna, com mais de 8 anos de experiência.' },
    { name: 'Dra. Camila Nunes',   crm: 'SC-45678', specialtyId: derm.id,   consultPrice: 200, consultDuration: 30, avatarInitials: 'CN', avatarColor: '#FAEEDA', avatarTextColor: '#633806', avgRating: 4.9, totalRatings: 94,  bio: 'Dermatologista com foco em dermatologia estética e tratamento de acne.' },
    { name: 'Dra. Renata Luz',     crm: 'SC-56789', specialtyId: ped.id,    consultPrice: 130, consultDuration: 30, avatarInitials: 'RL', avatarColor: '#EAF3DE', avatarTextColor: '#3B6D11', avgRating: 5.0, totalRatings: 67,  bio: 'Pediatra com especialização em neonatologia e desenvolvimento infantil.' },
    { name: 'Dr. Bruno Faria',     crm: 'SC-67890', specialtyId: odonto.id, consultPrice: 80,  consultDuration: 60, avatarInitials: 'BF', avatarColor: '#FAEEDA', avatarTextColor: '#854F0B', avgRating: 4.7, totalRatings: 201, bio: 'Dentista especializado em ortodontia e implantes dentários.' },
    { name: 'Dra. Cíntia Moraes',  crm: 'SC-78901', specialtyId: cardio.id, consultPrice: 220, consultDuration: 45, avatarInitials: 'CM', avatarColor: '#FBEAF0', avatarTextColor: '#D4537E', avgRating: 4.8, totalRatings: 94,  bio: 'Cardiologista com especialização em cardiologia intervencionista.' },
  ]);
  console.log('✅ Médicos criados.');

  // Disponibilidade (Seg-Sex 8h-18h, sábado 8h-12h para alguns)
  for (const doc of doctors) {
    const avails = [];
    for (let day = 1; day <= 5; day++) { // Seg a Sex
      avails.push({ doctorId: doc.id, dayOfWeek: day, startTime: '08:00', endTime: '18:00', slotMinutes: 30 });
    }
    if ([0,2,4].includes(doctors.indexOf(doc))) { // Alguns atendem sábado
      avails.push({ doctorId: doc.id, dayOfWeek: 6, startTime: '08:00', endTime: '12:00', slotMinutes: 30 });
    }
    await DoctorAvailability.bulkCreate(avails);
  }
  console.log('✅ Disponibilidades criadas.');

  // ── Clínicas ──
  const [dr1, dr2, dr3, dr4, dr5, dr6, dr7] = doctors;

  const clinics = await Clinic.bulkCreate([
    {
      name: 'Clínica Saúde & Vida', description: 'Referência em clínica geral e medicina preventiva.',
      address: 'R. das Flores, 340', city: 'Joinville', state: 'SC', zipCode: '89200-000',
      phone: '(47) 3522-0101', whatsapp: '47999990101',
      openingHours: 'Seg–Sex: 8h–19h | Sáb: 8h–13h',
      icon: '🏥', coverColor: 'linear-gradient(135deg,#9FE1CB,#5DCAA5)',
      featured: true, avgRating: 4.9, totalRatings: 312,
      latitude: -26.3045, longitude: -48.8487,
    },
    {
      name: 'Centro Médico Pleno', description: 'Centro multidisciplinar com foco em cardiologia.',
      address: 'Av. Brasil, 1200', city: 'Joinville', state: 'SC', zipCode: '89201-000',
      phone: '(47) 3522-0202',
      openingHours: 'Seg–Sex: 8h–18h',
      icon: '🩺', coverColor: 'linear-gradient(135deg,#B5D4F4,#378ADD)',
      avgRating: 4.6, totalRatings: 189,
      latitude: -26.3120, longitude: -48.8560,
    },
    {
      name: 'Cardio Excelência', description: 'Especialistas em cardiologia e saúde do coração.',
      address: 'R. São Paulo, 560', city: 'Joinville', state: 'SC', zipCode: '89202-000',
      phone: '(47) 3522-0303',
      openingHours: 'Seg–Sex: 8h–18h | Sáb: 8h–12h',
      icon: '❤️', coverColor: 'linear-gradient(135deg,#F4C0D1,#D4537E)',
      avgRating: 4.8, totalRatings: 94,
      latitude: -26.2980, longitude: -48.8410,
    },
    {
      name: 'OdontoSorriso', description: 'Odontologia moderna com atendimento humanizado.',
      address: 'R. Itajaí, 88', city: 'Joinville', state: 'SC', zipCode: '89203-000',
      phone: '(47) 3522-0404',
      openingHours: 'Seg–Sex: 8h–19h | Sáb: 9h–13h',
      icon: '🦷', coverColor: 'linear-gradient(135deg,#FAC775,#EF9F27)',
      avgRating: 4.7, totalRatings: 201,
      latitude: -26.3200, longitude: -48.8300,
    },
    {
      name: 'PediaCare', description: 'Clínica pediátrica com ambiente acolhedor para crianças.',
      address: 'R. das Palmeiras, 220', city: 'Joinville', state: 'SC', zipCode: '89204-000',
      phone: '(47) 3522-0505',
      openingHours: 'Seg–Sex: 8h–18h',
      icon: '🧒', coverColor: 'linear-gradient(135deg,#C0DD97,#639922)',
      avgRating: 5.0, totalRatings: 67,
      latitude: -26.2900, longitude: -48.8600,
    },
    {
      name: 'OrthoMax', description: 'Referência em ortopedia e reabilitação.',
      address: 'Av. Santos Dumont, 780', city: 'Joinville', state: 'SC', zipCode: '89205-000',
      phone: '(47) 3522-0606',
      openingHours: 'Seg–Sex: 8h–17h',
      icon: '🦴', coverColor: 'linear-gradient(135deg,#CECBF6,#7F77DD)',
      avgRating: 4.5, totalRatings: 143,
      latitude: -26.3300, longitude: -48.8200,
    },
  ]);
  console.log('✅ Clínicas criadas.');

  // Associar médicos às clínicas
  await clinics[0].addDoctors([dr1, dr2]);
  await clinics[1].addDoctors([dr2, dr7]);
  await clinics[2].addDoctors([dr7, dr4]);
  await clinics[3].addDoctors([dr6]);
  await clinics[4].addDoctors([dr5]);
  await clinics[5].addDoctors([dr3]);
  console.log('✅ Associações clínica↔médico criadas.');

  // ── Usuário de teste ──
  const hash = await bcrypt.hash('senha123', 12);
  await User.create({
    firstName: 'João', lastName: 'Silva',
    email: 'joao@example.com', phone: '(47) 99999-1234',
    password: hash, avatarColor: '#1D9E75',
  });
  console.log('✅ Usuário de teste criado: joao@example.com / senha123');

  console.log('\n🚀 Seed concluído! Banco populado com sucesso.');
  await sequelize.close();
}

seed().catch(err => { console.error('❌ Erro no seed:', err); process.exit(1); });
