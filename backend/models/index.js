// ============================================================
// models/index.js — Modelos do banco de dados (Sequelize)
// ============================================================
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Configuração da conexão
const isPostgres = process.env.DB_DIALECT === 'postgres' || Boolean(process.env.DATABASE_URL);
const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

const postgresOptions = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
};

const sequelize = isPostgres
  ? process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, postgresOptions)
    : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        ...postgresOptions,
      })
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.resolve(__dirname, '..', process.env.DB_STORAGE || './database/smart_consulta.db'),
      logging: false,
    });

// ──────────────────────────────────────────
// MODELO: Usuário
// ──────────────────────────────────────────
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  firstName:  { type: DataTypes.STRING(100), allowNull: false },
  lastName:   { type: DataTypes.STRING(100), allowNull: false },
  email:      { type: DataTypes.STRING(150), allowNull: false, unique: true,
                validate: { isEmail: true } },
  phone:      { type: DataTypes.STRING(20) },
  cpf:        { type: DataTypes.STRING(14), unique: true },
  birthDate:  { type: DataTypes.DATEONLY },
  healthPlan: { type: DataTypes.STRING(100) },
  password:   { type: DataTypes.STRING(255), allowNull: false },
  avatarColor:{ type: DataTypes.STRING(10), defaultValue: '#1D9E75' },
  isActive:   { type: DataTypes.BOOLEAN, defaultValue: true },
  emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  resetToken: { type: DataTypes.STRING },
  resetTokenExpiry: { type: DataTypes.DATE },
  // Preferências de notificação (JSON)
  notifEmail:    { type: DataTypes.BOOLEAN, defaultValue: true },
  notifSMS:      { type: DataTypes.BOOLEAN, defaultValue: true },
  notifWhatsApp: { type: DataTypes.BOOLEAN, defaultValue: false },
  notifPush:     { type: DataTypes.BOOLEAN, defaultValue: true },
  notif1Week:    { type: DataTypes.BOOLEAN, defaultValue: false },
  notif1Day:     { type: DataTypes.BOOLEAN, defaultValue: true },
  notif2Hours:   { type: DataTypes.BOOLEAN, defaultValue: true },
  notif30Min:    { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'users', timestamps: true });

// ──────────────────────────────────────────
// MODELO: Especialidade
// ──────────────────────────────────────────
const Specialty = sequelize.define('Specialty', {
  id:   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  icon: { type: DataTypes.STRING(10), defaultValue: '🏥' },
}, { tableName: 'specialties', timestamps: false });

// ──────────────────────────────────────────
// MODELO: Clínica
// ──────────────────────────────────────────
const Clinic = sequelize.define('Clinic', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT },
  address:     { type: DataTypes.STRING(255), allowNull: false },
  city:        { type: DataTypes.STRING(100), allowNull: false },
  state:       { type: DataTypes.STRING(2), allowNull: false },
  zipCode:     { type: DataTypes.STRING(10) },
  phone:       { type: DataTypes.STRING(20) },
  whatsapp:    { type: DataTypes.STRING(20) },
  email:       { type: DataTypes.STRING(150) },
  latitude:    { type: DataTypes.FLOAT },
  longitude:   { type: DataTypes.FLOAT },
  openingHours:{ type: DataTypes.STRING(255), defaultValue: 'Seg–Sex: 8h–19h | Sáb: 8h–13h' },
  icon:        { type: DataTypes.STRING(10), defaultValue: '🏥' },
  coverColor:  { type: DataTypes.STRING(100), defaultValue: 'linear-gradient(135deg,#9FE1CB,#5DCAA5)' },
  featured:    { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  avgRating:   { type: DataTypes.FLOAT, defaultValue: 0 },
  totalRatings:{ type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'clinics', timestamps: true });

// ──────────────────────────────────────────
// MODELO: Médico
// ──────────────────────────────────────────
const Doctor = sequelize.define('Doctor', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING(150), allowNull: false },
  crm:         { type: DataTypes.STRING(20), unique: true },
  bio:         { type: DataTypes.TEXT },
  avatarInitials: { type: DataTypes.STRING(3) },
  avatarColor: { type: DataTypes.STRING(20), defaultValue: '#E1F5EE' },
  avatarTextColor: { type: DataTypes.STRING(20), defaultValue: '#0F6E56' },
  consultPrice:{ type: DataTypes.DECIMAL(10,2), allowNull: false },
  consultDuration: { type: DataTypes.INTEGER, defaultValue: 30 }, // minutos
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  avgRating:   { type: DataTypes.FLOAT, defaultValue: 0 },
  totalRatings:{ type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'doctors', timestamps: true });

// ──────────────────────────────────────────
// MODELO: Disponibilidade do Médico
// ──────────────────────────────────────────
const DoctorAvailability = sequelize.define('DoctorAvailability', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  dayOfWeek: { type: DataTypes.INTEGER, allowNull: false }, // 0=Dom, 1=Seg ... 6=Sáb
  startTime: { type: DataTypes.STRING(5), allowNull: false }, // "08:00"
  endTime:   { type: DataTypes.STRING(5), allowNull: false }, // "18:00"
  slotMinutes: { type: DataTypes.INTEGER, defaultValue: 30 },
}, { tableName: 'doctor_availabilities', timestamps: false });

// ──────────────────────────────────────────
// MODELO: Agendamento (Consulta)
// ──────────────────────────────────────────
const Appointment = sequelize.define('Appointment', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  appointmentDate: { type: DataTypes.DATEONLY, allowNull: false },
  appointmentTime: { type: DataTypes.STRING(5), allowNull: false }, // "10:00"
  type:          { type: DataTypes.ENUM('presencial', 'online'), defaultValue: 'presencial' },
  status:        { type: DataTypes.ENUM('pending','confirmed','done','cancelled'), defaultValue: 'confirmed' },
  paymentMethod: { type: DataTypes.ENUM('cartao','pix','boleto'), defaultValue: 'cartao' },
  paymentStatus: { type: DataTypes.ENUM('pending','paid','refunded'), defaultValue: 'paid' },
  basePrice:     { type: DataTypes.DECIMAL(10,2), allowNull: false },
  convenienceFee:{ type: DataTypes.DECIMAL(10,2), defaultValue: 5.00 },
  totalPrice:    { type: DataTypes.DECIMAL(10,2), allowNull: false },
  cancelFee:     { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  cancelReason:  { type: DataTypes.TEXT },
  cancelledAt:   { type: DataTypes.DATE },
  notes:         { type: DataTypes.TEXT },
  // Notificações enviadas
  notif1DaySent:   { type: DataTypes.BOOLEAN, defaultValue: false },
  notif2HoursSent: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'appointments', timestamps: true });

// ──────────────────────────────────────────
// MODELO: Avaliação
// ──────────────────────────────────────────
const Review = sequelize.define('Review', {
  id:      { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  rating:  { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'reviews', timestamps: true });

// ──────────────────────────────────────────
// ASSOCIAÇÕES
// ──────────────────────────────────────────
// Médico ↔ Clínica (N:N)
Clinic.belongsToMany(Doctor, { through: 'ClinicDoctors', as: 'doctors' });
Doctor.belongsToMany(Clinic, { through: 'ClinicDoctors', as: 'clinics' });

// Médico → Especialidade (N:1)
Doctor.belongsTo(Specialty, { foreignKey: 'specialtyId', as: 'specialty' });
Specialty.hasMany(Doctor, { foreignKey: 'specialtyId' });

// Médico → Disponibilidade
Doctor.hasMany(DoctorAvailability, { foreignKey: 'doctorId', as: 'availabilities' });
DoctorAvailability.belongsTo(Doctor, { foreignKey: 'doctorId' });

// Agendamento
Appointment.belongsTo(User,   { foreignKey: 'userId',   as: 'user' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Appointment.belongsTo(Clinic, { foreignKey: 'clinicId', as: 'clinic' });
User.hasMany(Appointment,   { foreignKey: 'userId' });
Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
Clinic.hasMany(Appointment, { foreignKey: 'clinicId' });

// Avaliação
Review.belongsTo(User,        { foreignKey: 'userId',        as: 'user' });
Review.belongsTo(Doctor,      { foreignKey: 'doctorId',      as: 'doctor' });
Review.belongsTo(Clinic,      { foreignKey: 'clinicId',      as: 'clinic' });
Review.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
User.hasMany(Review,   { foreignKey: 'userId' });
Doctor.hasMany(Review, { foreignKey: 'doctorId' });
Clinic.hasMany(Review, { foreignKey: 'clinicId' });

module.exports = { sequelize, User, Specialty, Clinic, Doctor, DoctorAvailability, Appointment, Review };
