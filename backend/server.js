// server.js — Servidor principal Express
require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const fs         = require('fs');

const { sequelize } = require('./models');
const { startReminderJobs } = require('./services/reminderService');

const app  = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = [
  ...(process.env.FRONTEND_URLS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
  process.env.FRONTEND_URL,
].filter(Boolean);

// ──────────────────────────────────────────
// Segurança
// ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      styleSrc:   ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc:    ["'self'", "fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:", "blob:"],
    },
  },
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS bloqueado para a origem ${origin}`));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Rate limiting — 100 req/15min por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições. Aguarde alguns minutos.' },
  standardHeaders: true,
});
app.use('/api/', limiter);

// Rate limit mais estrito para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ──────────────────────────────────────────
// Parsers
// ──────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ──────────────────────────────────────────
// Arquivos estáticos (frontend)
// ──────────────────────────────────────────
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const publicDir = path.resolve(__dirname, '..', 'frontend', 'public');
if (fs.existsSync(publicDir)) app.use(express.static(publicDir));

// ──────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/clinics',      require('./routes/clinics'));
app.use('/api/appointments', require('./routes/appointments'));

// ──────────────────────────────────────────
// Health check
// ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Smart Consulta API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ──────────────────────────────────────────
// SPA fallback — qualquer rota serve o index.html
// ──────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ message: 'Smart Consulta API rodando. Coloque o frontend em /frontend/public/index.html' });
  }
});

// ──────────────────────────────────────────
// Error handler global
// ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ──────────────────────────────────────────
// Inicialização
// ──────────────────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Banco de dados conectado.');

    // Cria tabelas que não existem (sem derrubar dados)
    await sequelize.sync({ alter: false });
    console.log('✅ Modelos sincronizados.');

    // Inicia cron de lembretes
    startReminderJobs();

    app.listen(PORT, () => {
      console.log(`\n🚀 Smart Consulta rodando em http://localhost:${PORT}`);
      console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Banco: ${process.env.DB_DIALECT || 'sqlite'}`);
      console.log(`   API: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('❌ Falha ao iniciar:', err);
    process.exit(1);
  }
})();
