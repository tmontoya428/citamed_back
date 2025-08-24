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
    nombrePersona, // <-- Nombre real de la persona
  } = data;

  // Generar HTML de horarios separados en Fecha y Hora
  let horariosHtml = '';
  if (horarios && horarios.length > 0) {
    horarios.forEach((h) => {
      let partes = h.split(' ');
      let fecha = partes[0];
      let hora = partes[1] || '';
      horariosHtml += `<p><strong>Hora:</strong> ${hora}</p><p><strong>Fecha:</strong> ${fecha}</p>`;
    });
  }

  // Cambiar "Título" según tipo
  let tituloLabel = tipo === 'control' ? 'Especialidad' : 'Medicamento';

  // Mensaje especial solo para controles
  let mensajePersona = '';
  if (tipo === 'control' && nombrePersona) {
    mensajePersona = `<p>Estimad@ ${nombrePersona}, te recordamos que tienes una cita pendiente.</p>`;
  }

  const html = `
    <div style="background-color: #f4f4f4; padding: 40px 0; font-family: Arial, sans-serif; color: #333;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center;">
          <img src="cid:citamedlogo" alt="CITAMED Logo" style="width: 120px; margin-bottom: 10px;" />
          <h2 style="color: #2a6edc; margin-top: 0;"> 📅 Recordatorio de ${tipo === 'medicamento' ? 'medicación' : 'control'}</h2>
        </div>

        <div style="margin-top: 20px; font-size: 16px; line-height: 1.6;">
          ${mensajePersona}  <!-- mensaje para control -->

          <p><strong>${tituloLabel}:</strong> ${titulo}</p>
          <p><strong>Descripción:</strong> ${descripcion}</p>
          <p><strong>Frecuencia:</strong> ${frecuencia}</p>
          ${dosis ? `<p><strong>Dosis:</strong> ${dosis} ${unidad}</p>` : ''}
          ${horariosHtml}
          ${cantidadDisponible ? `<p><strong>Cantidad disponible:</strong> ${cantidadDisponible}</p>` : ''}
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
        cid: 'citamedlogo',
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
