// middleware/auth.js — Verificação de JWT
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ error: 'Token não fornecido.' });

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] }
    });
    if (!user || !user.isActive)
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    return res.status(401).json({ error: 'Token inválido.' });
  }
};

module.exports = auth;
