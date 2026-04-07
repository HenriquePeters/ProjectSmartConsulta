// routes/clinics.js — CRUD de Clínicas e Médicos
const router = require('express').Router();
const { Op } = require('sequelize');
const { Clinic, Doctor, Specialty, Review, Appointment, DoctorAvailability } = require('../models');
const auth = require('../middleware/auth');

// ─────────────────────────────────────────
// GET /api/clinics  — Listar/buscar clínicas
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, specialty, city, page = 1, limit = 12 } = req.query;
    const where = { isActive: true };

    if (city) where.city = { [Op.like]: `%${city}%` };

    // Paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const include = [{
      model: Doctor, as: 'doctors',
      attributes: ['id','name','consultPrice','avgRating','avatarInitials','avatarColor','avatarTextColor'],
      include: [{ model: Specialty, as: 'specialty', attributes: ['name','icon'] }],
      through: { attributes: [] },
      ...(specialty ? {
        include: [{ model: Specialty, as: 'specialty',
          where: { name: { [Op.like]: `%${specialty}%` } } }]
      } : {}),
    }];

    let clinics;
    if (search) {
      clinics = await Clinic.findAndCountAll({
        where: {
          ...where,
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { address: { [Op.like]: `%${search}%` } },
          ],
        },
        include, limit: parseInt(limit), offset,
        order: [['featured','DESC'],['avgRating','DESC']],
        distinct: true,
      });
    } else {
      clinics = await Clinic.findAndCountAll({
        where, include, limit: parseInt(limit), offset,
        order: [['featured','DESC'],['avgRating','DESC']],
        distinct: true,
      });
    }

    return res.json({
      clinics: clinics.rows,
      total: clinics.count,
      page: parseInt(page),
      totalPages: Math.ceil(clinics.count / parseInt(limit)),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar clínicas.' });
  }
});

// ─────────────────────────────────────────
// GET /api/clinics/:id  — Detalhes da clínica
// ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const clinic = await Clinic.findByPk(req.params.id, {
      include: [
        {
          model: Doctor, as: 'doctors',
          include: [
            { model: Specialty, as: 'specialty' },
            { model: DoctorAvailability, as: 'availabilities' },
          ],
          through: { attributes: [] },
        },
        {
          model: Review, as: 'reviews',
          include: [{ model: require('../models').User, as: 'user',
            attributes: ['firstName','lastName','avatarColor'] }],
          limit: 10, order: [['createdAt','DESC']],
        },
      ],
    });

    if (!clinic) return res.status(404).json({ error: 'Clínica não encontrada.' });

    // Distribuição de estrelas
    const starDist = await Review.findAll({
      where: { clinicId: clinic.id },
      attributes: ['rating', [require('sequelize').fn('COUNT','*'), 'count']],
      group: ['rating'],
      raw: true,
    });

    return res.json({ clinic, starDistribution: starDist });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar clínica.' });
  }
});

// ─────────────────────────────────────────
// GET /api/clinics/:id/availability
// Horários disponíveis de um médico em uma data
// ─────────────────────────────────────────
router.get('/:clinicId/availability', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date)
      return res.status(422).json({ error: 'doctorId e date são obrigatórios.' });

    const d = new Date(date);
    const dayOfWeek = d.getUTCDay(); // 0=Dom ... 6=Sáb

    // Disponibilidade do médico nesse dia da semana
    const avail = await DoctorAvailability.findOne({
      where: { doctorId, dayOfWeek },
    });
    if (!avail) return res.json({ slots: [] });

    // Gerar slots
    const slots = generateSlots(avail.startTime, avail.endTime, avail.slotMinutes);

    // Slots já ocupados nessa data
    const booked = await Appointment.findAll({
      where: {
        doctorId, clinicId: req.params.clinicId,
        appointmentDate: date,
        status: { [Op.in]: ['confirmed','pending'] },
      },
      attributes: ['appointmentTime'],
      raw: true,
    });

    const bookedTimes = booked.map(b => b.appointmentTime);

    return res.json({
      slots: slots.map(t => ({ time: t, available: !bookedTimes.includes(t) })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar disponibilidade.' });
  }
});

function generateSlots(start, end, intervalMin) {
  const slots = [];
  let [h, m] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  while (h < eh || (h === eh && m < em)) {
    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    m += intervalMin;
    if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
  }
  return slots;
}

// ─────────────────────────────────────────
// POST /api/clinics/:id/reviews (requer login)
// ─────────────────────────────────────────
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment, appointmentId } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(422).json({ error: 'Avaliação deve ser entre 1 e 5.' });

    const existing = await Review.findOne({
      where: { userId: req.user.id, clinicId: req.params.id }
    });
    if (existing) return res.status(409).json({ error: 'Você já avaliou esta clínica.' });

    const review = await Review.create({
      rating, comment, appointmentId,
      userId: req.user.id, clinicId: req.params.id,
    });

    // Atualizar média da clínica
    const all = await Review.findAll({ where: { clinicId: req.params.id }, raw: true });
    const avg = all.reduce((s,r) => s + r.rating, 0) / all.length;
    await Clinic.update({ avgRating: avg, totalRatings: all.length },
      { where: { id: req.params.id } });

    return res.status(201).json({ review });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao salvar avaliação.' });
  }
});

module.exports = router;
