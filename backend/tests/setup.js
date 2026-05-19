// tests/setup.js — Configuração global do ambiente de testes
// Usa SQLite em memória para não afetar o banco de dados real

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'smart-consulta-test-secret-key-2026';
process.env.JWT_EXPIRES_IN = '1h';
// Força SQLite em memória durante os testes
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

// Silenciar envio de e-mails nos testes
jest.mock('../services/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendAppointmentConfirmation: jest.fn().mockResolvedValue(true),
  sendCancellationEmail: jest.fn().mockResolvedValue(true),
}));
