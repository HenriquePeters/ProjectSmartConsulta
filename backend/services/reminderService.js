// services/reminderService.js — Envio automático de lembretes via cron
const cron = require('node-cron');
const { Op } = require('sequelize');
const { Appointment, User, Doctor, Clinic, Specialty } = require('../models');
const { sendReminderEmail } = require('./emailService');

function startReminderJobs() {
  console.log('⏰ Serviço de lembretes iniciado.');

  // Roda a cada hora, checa se há consultas em 24h ou 2h
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Verificando lembretes...');
    try {
      const now = new Date();

      const appointments = await Appointment.findAll({
        where: {
          status: 'confirmed',
          [Op.or]: [
            { notif1DaySent: false },
            { notif2HoursSent: false },
          ],
        },
        include: [
          { model: User,   as: 'user' },
          { model: Doctor, as: 'doctor',
            include: [{ model: Specialty, as: 'specialty' }] },
          { model: Clinic, as: 'clinic' },
        ],
      });

      for (const appt of appointments) {
        const apptDate = new Date(`${appt.appointmentDate}T${appt.appointmentTime}`);
        const hoursUntil = (apptDate - now) / (1000 * 60 * 60);

        // Lembrete de 1 dia (entre 23h e 25h antes)
        if (!appt.notif1DaySent && hoursUntil >= 23 && hoursUntil <= 25) {
          if (appt.user?.notifEmail) {
            await sendReminderEmail(appt.user, appt, 24);
          }
          await appt.update({ notif1DaySent: true });
          console.log(`[Cron] Lembrete 1 dia enviado: ${appt.id}`);
        }

        // Lembrete de 2 horas (entre 1.5h e 2.5h antes)
        if (!appt.notif2HoursSent && hoursUntil >= 1.5 && hoursUntil <= 2.5) {
          if (appt.user?.notifEmail) {
            await sendReminderEmail(appt.user, appt, 2);
          }
          await appt.update({ notif2HoursSent: true });
          console.log(`[Cron] Lembrete 2 horas enviado: ${appt.id}`);
        }
      }

      // Marcar como 'done' consultas que já passaram
      await Appointment.update(
        { status: 'done' },
        {
          where: {
            status: 'confirmed',
            appointmentDate: { [Op.lt]: now.toISOString().split('T')[0] },
          },
        }
      );
    } catch (err) {
      console.error('[Cron] Erro ao processar lembretes:', err.message);
    }
  });
}

module.exports = { startReminderJobs };
