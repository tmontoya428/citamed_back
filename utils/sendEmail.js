const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envía un correo electrónico con recordatorio personalizado.
 * @param {string} to - Correo del destinatario.
 * @param {string} subject - Asunto del correo.
 * @param {object} data - Datos del recordatorio.
 */
const sendReminderEmail = async (to, subject, data = {}) => {
  const {
    tipo,
    titulo,
    descripcion,
    frecuencia,
    dosis,
    unidad,
    horarios,
    cantidadDisponible,
  } = data;

  let html = `
    <div style="background-color: #f4f4f4; padding: 40px 0; font-family: Arial, sans-serif; color: #333;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center;">
          <img src="cid:citamedlogo" alt="CITAMED Logo" style="width: 120px; margin-bottom: 10px;" />
          <h2 style="color: #2a6edc; margin-top: 0;"> 📅 Recordatorio de ${tipo === 'medicamento' ? 'medicación' : 'control'}</h2>
        </div>

        <div style="margin-top: 20px; font-size: 16px; line-height: 1.6;">
          <p><strong>Título:</strong> ${titulo}</p>
          <p><strong>Descripción:</strong> ${descripcion}</p>
          <p><strong>Frecuencia:</strong> ${frecuencia}</p>`;


if (tipo === 'medicamento' || tipo === 'control') {
  html += `
      ${dosis ? `<p><strong>Dosis:</strong> ${dosis} ${unidad}</p>` : ''}
      ${horarios ? `<p><strong>Horario(s):</strong> ${Array.isArray(horarios) ? horarios.join(', ') : horarios}</p>` : ''}
      ${cantidadDisponible ? `<p><strong>Cantidad disponible:</strong> ${cantidadDisponible}</p>` : ''}`;
}


  html += `
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 14px; color: #777;">
          Gracias por confiar en <strong style="color:#d60039;">CITAMED ❤️</strong>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"CITAMED 📅" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments: [
      {
        filename: 'logo.png',
        path: path.join(__dirname, '../assets/logo.png'),
        cid: 'citamedlogo', // debe coincidir con el cid en <img>
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📨 Correo enviado a', to);
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
  }
};

module.exports = sendReminderEmail;
