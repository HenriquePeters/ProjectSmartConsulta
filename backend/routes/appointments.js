// routes/appointments.js — Agendamentos
const router = require('express').Router();
const { Op } = require('sequelize');
const { Appointment, Doctor, Clinic, Specialty, User } = require('../models');
const auth = require('../middleware/auth');
const { sendAppointmentConfirmation, sendCancellationEmail } = require('../services/emailService');

// ─────────────────────────────────────────
// GET /api/appointments  — Histórico do usuário
// ─────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = { userId: req.user.id };
    if (status && status !== 'all') where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await Appointment.findAndCountAll({
      where,
      include: [
        {
          model: Doctor, as: 'doctor',
          attributes: ['id','name','avatarInitials','avatarColor','avatarTextColor'],
          include: [{ model: Specialty, as: 'specialty', attributes: ['name','icon'] }],
        },
        {
          model: Clinic, as: 'clinic',
          attributes: ['id','name','address','phone','icon','coverColor'],
        },
      ],
      order: [['appointmentDate','DESC'],['appointmentTime','DESC']],
      limit: parseInt(limit), offset, distinct: true,
    });

    return res.json({ appointments: rows, total: count,
      page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar consultas.' });
  }
});

// ─────────────────────────────────────────
// GET /api/appointments/stats  — Estatísticas do usuário
// ─────────────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const [total, upcoming, done, cancelled] = await Promise.all([
      Appointment.count({ where: { userId: uid } }),
      Appointment.count({ where: { userId: uid, status: 'confirmed',
        appointmentDate: { [Op.gte]: today } } }),
      Appointment.count({ where: { userId: uid, status: 'done' } }),
      Appointment.count({ where: { userId: uid, status: 'cancelled' } }),
    ]);

    return res.json({ total, upcoming, done, cancelled });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao calcular estatísticas.' });
  }
});

// ─────────────────────────────────────────
// POST /api/appointments  — Criar agendamento
// ─────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { clinicId, doctorId, appointmentDate, appointmentTime, type, paymentMethod, notes } = req.body;

    if (!clinicId || !doctorId || !appointmentDate || !appointmentTime)
      return res.status(422).json({ error: 'Dados incompletos para o agendamento.' });

    // Verificar se horário já está ocupado
    const conflict = await Appointment.findOne({
      where: {
        doctorId, clinicId, appointmentDate, appointmentTime,
        status: { [Op.in]: ['confirmed','pending'] },
      },
    });
    if (conflict) return res.status(409).json({ error: 'Horário já ocupado. Escolha outro.' });

    // Buscar médico para preço
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) return res.status(404).json({ error: 'Médico não encontrado.' });

    const basePrice = parseFloat(doctor.consultPrice);
    const convenienceFee = 5.00;
    const totalPrice = basePrice + convenienceFee;

    const appointment = await Appointment.create({
      userId: req.user.id, clinicId, doctorId,
      appointmentDate, appointmentTime,
      type: type || 'presencial',
      paymentMethod: paymentMethod || 'cartao',
      paymentStatus: 'paid',
      basePrice, convenienceFee, totalPrice,
      notes,
    });

    // Carregar com relacionamentos para a resposta
    const full = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Doctor, as: 'doctor',
          include: [{ model: Specialty, as: 'specialty' }] },
        { model: Clinic, as: 'clinic' },
      ],
    });

    // Enviar e-mail de confirmação
    sendAppointmentConfirmation(req.user, full).catch(console.error);

    return res.status(201).json({
      message: 'Consulta agendada com sucesso!',
      appointment: full,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao criar agendamento.' });
  }
});

// ─────────────────────────────────────────
// DELETE /api/appointments/:id  — Cancelar
// ─────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: Doctor, as: 'doctor', include: [{ model: Specialty, as: 'specialty' }] },
        { model: Clinic, as: 'clinic' },
      ],
    });

    if (!appointment) return res.status(404).json({ error: 'Consulta não encontrada.' });
    if (appointment.status === 'cancelled')
      return res.status(400).json({ error: 'Consulta já cancelada.' });
    if (appointment.status === 'done')
      return res.status(400).json({ error: 'Não é possível cancelar uma consulta já realizada.' });

    // Calcular taxa de cancelamento
    const now = new Date();
    const apptDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
    const hoursUntil = (apptDateTime - now) / (1000 * 60 * 60);

    let feePercent = 0;
    if (hoursUntil < 0)       feePercent = 50; // já passou
    else if (hoursUntil < 2)  feePercent = 50; // mesmo dia / < 2h
    else if (hoursUntil < 24) feePercent = 30;
    else if (hoursUntil < 48) feePercent = 10;

    const cancelFee = (appointment.basePrice * feePercent) / 100;

    await appointment.update({
      status: 'cancelled',
      cancelFee,
      cancelReason: req.body.reason || '',
      cancelledAt: now,
      paymentStatus: cancelFee > 0 ? 'paid' : 'refunded',
    });

    sendCancellationEmail(req.user, appointment, cancelFee, feePercent).catch(console.error);

    return res.json({
      message: 'Consulta cancelada.',
      cancelFee,
      feePercent,
      refund: appointment.totalPrice - cancelFee,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao cancelar consulta.' });
  }
});

// ─────────────────────────────────────────
// GET /api/appointments/:id  — Detalhes
// ─────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: Doctor, as: 'doctor', include: [{ model: Specialty, as: 'specialty' }] },
        { model: Clinic, as: 'clinic' },
      ],
    });
    if (!appointment) return res.status(404).json({ error: 'Consulta não encontrada.' });
    return res.json({ appointment });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
