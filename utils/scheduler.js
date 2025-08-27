const schedule = require("node-schedule");
const Reminder = require("../models/reminder");
const User = require("../models/User");
const InfoUser = require("../models/InfoUser");
const sendReminderEmail = require("./sendEmail");
const sendReminderSMS = require("./sendSMS"); // Ajustado para usar reminderData

async function cargarRecordatorios() {
  try {
    const recordatorios = await Reminder.find();

    recordatorios.forEach(async (reminder) => {
      const user = await User.findById(reminder.userId);
      const info = await InfoUser.findOne({ userId: reminder.userId });

      const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
      const usernameEmail = isValidEmail(user?.username) ? user.username : null;
      const email = info?.email || usernameEmail;
      const telefono = info?.phone || null;

      if (!email && !telefono) return;

      const reminderData = {
        tipo: reminder.tipo,
        titulo: reminder.titulo,
        descripcion: reminder.descripcion,
        frecuencia: reminder.frecuencia,
        dosis: reminder.dosis,
        unidad: reminder.unidad,
        horarios: reminder.horarios,
        cantidadDisponible: reminder.cantidadDisponible,
        nombrePersona: info?.name ? `${info.name} ${info.lastName || ""}`.trim() : "Paciente",
      };

      reminder.horarios.forEach((hora) => {
        const [h, m] = hora.split(":").map(Number);

        const ejecutarRecordatorio = async () => {
          if (email) await sendReminderEmail(email, `⏰ Recordatorio ${reminder.frecuencia || "Unica"}`, reminderData);
          if (telefono) await sendReminderSMS(telefono, reminderData);
          console.log(`📩 Recordatorio enviado a ${email || telefono} a las ${hora}`);
        };

        if (!reminder.frecuencia || reminder.frecuencia === "Unica") {
          const fechaRecordatorio = new Date(reminder.fecha);
          fechaRecordatorio.setHours(h, m, 0, 0);
          if (fechaRecordatorio > new Date()) {
            schedule.scheduleJob(fechaRecordatorio, ejecutarRecordatorio);
          }
        } else if (reminder.frecuencia === "Diaria") {
          const rule = new schedule.RecurrenceRule();
          rule.hour = h;
          rule.minute = m;
          rule.tz = "America/Bogota";
          schedule.scheduleJob(rule, ejecutarRecordatorio);
        } else if (reminder.frecuencia === "Semanal") {
          const rule = new schedule.RecurrenceRule();
          rule.dayOfWeek = reminder.fecha.getDay();
          rule.hour = h;
          rule.minute = m;
          rule.tz = "America/Bogota";
          schedule.scheduleJob(rule, ejecutarRecordatorio);
        }
      });
    });

    console.log("✅ Recordatorios cargados y reprogramados al iniciar el servidor");
  } catch (error) {
    console.error("❌ Error al cargar recordatorios:", error);
  }
}

module.exports = { cargarRecordatorios };
