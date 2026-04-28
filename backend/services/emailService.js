// services/emailService.js — Envio de e-mails com Nodemailer
const nodemailer = require('nodemailer');
require('../env-loader');

// ─────────────────────────────────────────
// Configuração do transporter
// ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─────────────────────────────────────────
// Template base HTML
// ─────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width"/>
<style>
  body{font-family:'DM Sans',Helvetica,Arial,sans-serif;background:#f2f5f3;margin:0;padding:20px;}
  .container{max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;}
  .header{background:#1D9E75;padding:28px 32px;text-align:center;}
  .header h1{font-size:22px;color:#fff;margin:0;font-weight:700;}
  .header p{color:rgba(255,255,255,.8);margin:4px 0 0;font-size:13px;}
  .body{padding:32px;}
  .body h2{font-size:20px;color:#0e1a14;margin:0 0 8px;}
  .body p{font-size:14px;color:#6b7c72;line-height:1.7;margin:0 0 14px;}
  .info-box{background:#f2f5f3;border-radius:12px;padding:18px;margin:18px 0;}
  .info-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e8ede9;font-size:13px;}
  .info-row:last-child{border-bottom:none;}
  .info-row .lbl{color:#6b7c72;}
  .info-row .val{font-weight:600;color:#0e1a14;}
  .btn{display:block;background:#1D9E75;color:#fff;text-decoration:none;text-align:center;border-radius:10px;padding:13px 24px;font-size:14px;font-weight:600;margin:20px 0;}
  .warn-box{background:#FEF3E2;border-radius:10px;padding:12px 16px;font-size:12px;color:#633806;margin:14px 0;}
  .footer{padding:20px 32px;text-align:center;font-size:11px;color:#aab5af;border-top:1px solid #e8ede9;}
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Smart Consulta</h1>
      <p>Revolucionando Agendamentos Médicos</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      Smart Consulta © 2026 · Este e-mail foi enviado automaticamente.<br/>
      Dúvidas? Fale conosco pelo WhatsApp ou pelo site.
    </div>
  </div>
</body>
</html>`;

// ─────────────────────────────────────────
// Formatar data pt-BR
// ─────────────────────────────────────────
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${d} de ${months[parseInt(m)-1]} de ${y}`;
}

// ─────────────────────────────────────────
// 1. E-mail de boas-vindas
// ─────────────────────────────────────────
async function sendWelcomeEmail(user) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: '🎉 Bem-vindo(a) à Smart Consulta!',
    html: baseTemplate(`
      <h2>Olá, ${user.firstName}! 👋</h2>
      <p>Sua conta na <strong>Smart Consulta</strong> foi criada com sucesso. Agora você pode agendar consultas com os melhores médicos e clínicas, tudo em um só lugar.</p>
      <a href="${process.env.FRONTEND_URL}" class="btn">Agendar minha primeira consulta →</a>
      <p style="font-size:12px;color:#aab5af;">Precisa de ajuda? Responda este e-mail ou acesse nossa central de suporte.</p>
    `),
  });
}

// ─────────────────────────────────────────
// 2. Confirmação de agendamento
// ─────────────────────────────────────────
async function sendAppointmentConfirmation(user, appointment) {
  const a = appointment;
  const docName = a.doctor?.name || 'Médico';
  const spec = a.doctor?.specialty?.name || '';
  const clinicName = a.clinic?.name || 'Clínica';
  const clinicAddress = a.clinic?.address || '';

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `✅ Consulta confirmada — ${formatDate(a.appointmentDate)}`,
    html: baseTemplate(`
      <h2>Consulta confirmada! ✅</h2>
      <p>Olá, <strong>${user.firstName}</strong>! Sua consulta foi agendada com sucesso.</p>
      <div class="info-box">
        <div class="info-row"><span class="lbl">Clínica</span><span class="val">${clinicName}</span></div>
        <div class="info-row"><span class="lbl">Médico</span><span class="val">${docName}</span></div>
        <div class="info-row"><span class="lbl">Especialidade</span><span class="val">${spec}</span></div>
        <div class="info-row"><span class="lbl">Data</span><span class="val">${formatDate(a.appointmentDate)}</span></div>
        <div class="info-row"><span class="lbl">Horário</span><span class="val">${a.appointmentTime}</span></div>
        <div class="info-row"><span class="lbl">Tipo</span><span class="val">${a.type === 'online' ? 'Teleconsulta' : 'Presencial'}</span></div>
        <div class="info-row"><span class="lbl">Endereço</span><span class="val">${clinicAddress}</span></div>
        <div class="info-row"><span class="lbl">Total pago</span><span class="val" style="color:#1D9E75;">R$ ${parseFloat(a.totalPrice).toFixed(2).replace('.',',')}</span></div>
      </div>
      <div class="warn-box">⚠️ <strong>Lembrete de cancelamento:</strong> Cancelamentos com menos de 24h têm taxa de 30% do valor.</div>
      <a href="${process.env.FRONTEND_URL}/profile" class="btn">Ver minhas consultas →</a>
    `),
  });
}

// ─────────────────────────────────────────
// 3. Lembrete de consulta (1 dia antes)
// ─────────────────────────────────────────
async function sendReminderEmail(user, appointment, hoursAhead) {
  const a = appointment;
  const label = hoursAhead >= 24 ? '1 dia' : '2 horas';

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `🔔 Lembrete: sua consulta é ${hoursAhead >= 24 ? 'amanhã' : 'em 2 horas'}!`,
    html: baseTemplate(`
      <h2>🔔 Sua consulta se aproxima!</h2>
      <p>Olá, <strong>${user.firstName}</strong>! Este é um lembrete que você tem uma consulta em <strong>${label}</strong>.</p>
      <div class="info-box">
        <div class="info-row"><span class="lbl">Médico</span><span class="val">${a.doctor?.name}</span></div>
        <div class="info-row"><span class="lbl">Data</span><span class="val">${formatDate(a.appointmentDate)}</span></div>
        <div class="info-row"><span class="lbl">Horário</span><span class="val">${a.appointmentTime}</span></div>
        <div class="info-row"><span class="lbl">Clínica</span><span class="val">${a.clinic?.name}</span></div>
        <div class="info-row"><span class="lbl">Endereço</span><span class="val">${a.clinic?.address}</span></div>
      </div>
      <a href="${process.env.FRONTEND_URL}/profile" class="btn">Ver detalhes da consulta →</a>
    `),
  });
}

// ─────────────────────────────────────────
// 4. Confirmação de cancelamento
// ─────────────────────────────────────────
async function sendCancellationEmail(user, appointment, cancelFee, feePercent) {
  const a = appointment;
  const refund = parseFloat(a.totalPrice) - cancelFee;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: '❌ Consulta cancelada — Smart Consulta',
    html: baseTemplate(`
      <h2>Consulta cancelada</h2>
      <p>Olá, <strong>${user.firstName}</strong>. Sua consulta foi cancelada.</p>
      <div class="info-box">
        <div class="info-row"><span class="lbl">Médico</span><span class="val">${a.doctor?.name}</span></div>
        <div class="info-row"><span class="lbl">Data</span><span class="val">${formatDate(a.appointmentDate)}</span></div>
        <div class="info-row"><span class="lbl">Horário</span><span class="val">${a.appointmentTime}</span></div>
        <div class="info-row"><span class="lbl">Taxa de cancelamento (${feePercent}%)</span>
          <span class="val" style="color:#E24B4A;">R$ ${cancelFee.toFixed(2).replace('.',',')}</span></div>
        <div class="info-row"><span class="lbl">Valor a estornar</span>
          <span class="val" style="color:#1D9E75;">R$ ${refund.toFixed(2).replace('.',',')}</span></div>
      </div>
      ${feePercent === 0 ? '<p>Nenhuma taxa foi cobrada. O valor total será estornado em até 5 dias úteis.</p>' :
        `<div class="warn-box">A taxa de ${feePercent}% foi cobrada pois o cancelamento ocorreu com menos de ${feePercent === 30 ? '24h' : '2h'} de antecedência.</div>`}
    `),
  });
}

// ─────────────────────────────────────────
// 5. Redefinição de senha
// ─────────────────────────────────────────
async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: '🔑 Redefinição de senha — Smart Consulta',
    html: baseTemplate(`
      <h2>Redefinir sua senha</h2>
      <p>Recebemos uma solicitação para redefinir a senha da conta associada a <strong>${user.email}</strong>.</p>
      <a href="${resetUrl}" class="btn">Redefinir minha senha →</a>
      <p style="font-size:12px;color:#aab5af;">Este link expira em 1 hora. Se você não solicitou, ignore este e-mail.</p>
    `),
  });
}

module.exports = {
  sendWelcomeEmail,
  sendAppointmentConfirmation,
  sendReminderEmail,
  sendCancellationEmail,
  sendPasswordResetEmail,
};
