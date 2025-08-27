// sendSMS.js
const twilio = require("twilio");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const formatFechaHora = (date) => {
  const fecha = date.toLocaleDateString("es-CO");
  const hora = date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return { fecha, hora };
};

async function sendReminderSMS(to, data) {
  try {
    // Normalizar número
    const numero = to.startsWith('+') ? to : `+57${to}`;

    const {
      tipo,
      titulo,
      descripcion,
      frecuencia,
      dosis,
      unidad,
      horarios,
      cantidadDisponible,
      nombrePersona,
    } = data;

    // Formatear horarios
    let horariosTexto = '';
    if (horarios && horarios.length > 0) {
      horarios.forEach((h) => {
        let fecha = '';
        let hora = '';
        if (h.includes(' ')) {
          const partes = h.split(' ');
          fecha = partes[0];
          hora = partes.slice(1).join(' ');
        } else {
          const dateObj = new Date(h);
          const fh = formatFechaHora(dateObj);
          fecha = fh.fecha;
          hora = fh.hora;
        }
        horariosTexto += `Hora: ${hora}\nFecha: ${fecha}\n`;
      });
    }

    const tituloLabel = tipo === 'control' ? 'Especialidad' : 'Medicamento';
    let mensajePersona = '';
    if (nombrePersona) mensajePersona = `Estimad@ ${nombrePersona},\n`;

    const message = `
📅 Recordatorio de ${tipo === 'medicamento' ? 'medicación' : 'control'}
${mensajePersona}
${tituloLabel}: ${titulo}
Descripción: ${descripcion || ''}
Frecuencia: ${frecuencia || ''}
${dosis ? `Dosis: ${dosis} ${unidad || ''}` : ''}
${horariosTexto}
${cantidadDisponible ? `Cantidad disponible: ${cantidadDisponible}` : ''}
Gracias por confiar en CITAMED ❤️
    `.trim();

    console.log("Enviando SMS a:", numero);
    console.log("Contenido SMS:", message);

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: numero,
    });

    console.log("✅ SMS enviado:", response.sid);
  } catch (error) {
    console.error("❌ Error enviando SMS:", error);
  }
}

module.exports = sendReminderSMS;
