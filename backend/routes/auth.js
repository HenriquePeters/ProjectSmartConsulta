// routes/auth.js — Autenticação (registro, login, perfil, senha)
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

const AVATAR_COLORS = ['#1D9E75','#378ADD','#D4537E','#EF9F27','#7F77DD','#E24B4A'];
const randomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('Nome obrigatório.'),
  body('lastName').trim().notEmpty().withMessage('Sobrenome obrigatório.'),
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres.'),
  body('phone').optional().isMobilePhone('pt-BR'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  try {
    const { firstName, lastName, email, password, phone } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstName, lastName, email, phone,
      password: hashed,
      avatarColor: randomColor(),
    });

    // Enviar e-mail de boas-vindas (assíncrono, não bloqueia)
    sendWelcomeEmail(user).catch(console.error);

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return res.status(201).json({
      message: 'Conta criada com sucesso!',
      token,
      user: {
        id: user.id, firstName, lastName, email, phone,
        avatarColor: user.avatarColor,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });

    if (!user.isActive)
      return res.status(403).json({ error: 'Conta desativada. Entre em contato com o suporte.' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatarColor: user.avatarColor,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ─────────────────────────────────────────
// GET /api/auth/me  (requer token)
// ─────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  return res.json({ user: req.user });
});

// ─────────────────────────────────────────
// PUT /api/auth/profile  (requer token)
// ─────────────────────────────────────────
router.put('/profile', auth, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional(),
  body('cpf').optional(),
  body('birthDate').optional().isDate(),
  body('healthPlan').optional(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  try {
    const allowed = ['firstName','lastName','phone','cpf','birthDate','healthPlan',
                     'notifEmail','notifSMS','notifWhatsApp','notifPush',
                     'notif1Week','notif1Day','notif2Hours','notif30Min'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    await req.user.update(updates);
    return res.json({ message: 'Perfil atualizado!', user: req.user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

// ─────────────────────────────────────────
// PUT /api/auth/change-password  (requer token)
// ─────────────────────────────────────────
router.put('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });

  try {
    const userWithPass = await require('../models').User.findByPk(req.user.id);
    const match = await bcrypt.compare(req.body.currentPassword, userWithPass.password);
    if (!match)
      return res.status(401).json({ error: 'Senha atual incorreta.' });

    const hashed = await bcrypt.hash(req.body.newPassword, 12);
    await userWithPass.update({ password: hashed });
    return res.json({ message: 'Senha alterada com sucesso!' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    // Sempre retorna 200 para não vazar quais e-mails existem
    if (user) {
      const token = require('crypto').randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
      await user.update({ resetToken: token, resetTokenExpiry: expiry });
      sendPasswordResetEmail(user, token).catch(console.error);
    }
    return res.json({ message: 'Se o e-mail existir, você receberá as instruções em breve.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
