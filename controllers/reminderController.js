const Reminder = require("../models/reminder");
const User = require("../models/User");
const InfoUser = require("../models/InfoUser");
const sendReminderEmail = require("../utils/sendEmail");
const schedule = require("node-schedule");

// 📌 Función para formatear fecha y hora
const formatFechaHora = (date) => {
  const fecha = date.toLocaleDateString("es-CO");
  const hora = date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  return { fecha, hora };
};

// 📌 Función para programar envíos diarios/semanales
const programarEnvio = (frecuencia, horarios, fechaNormalizada, email, reminderData) => {
  horarios.forEach((horaStr) => {
    const [h, m] = horaStr.split(":").map(Number);
    const rule = new schedule.RecurrenceRule();
    rule.hour = h;
    rule.minute = m;
    rule.tz = "America/Bogota";

    if (frecuencia === "Semanal") {
      rule.dayOfWeek = fechaNormalizada.getDay();
    }

    schedule.scheduleJob(rule, async () => {
      const now = new Date();
      const { fecha, hora } = formatFechaHora(now);
      const horarioActual = `${fecha} ${hora}`;

      await sendReminderEmail(email, `⏰ Recordatorio ${frecuencia.toLowerCase()}`, {
        ...reminderData,
        horarios: [horarioActual],
      });

      console.log(`📩 Recordatorio ${frecuencia} enviado a ${email} en ${horarioActual}`);
    });
  });
};

// 📌 Función para enviar recordatorios personalizados
const enviarRecordatorioPersonalizado = async (fechaNormalizada, intervaloPersonalizado, email, reminderData) => {
  let intervalMs = intervaloPersonalizado === "2min" ? 2 * 60 * 1000 : 2 * 60 * 60 * 1000;
  let nextTime = new Date(fechaNormalizada);

  const sendCustomReminder = async () => {
    const { fecha, hora } = formatFechaHora(nextTime);
    const horarioCompleto = `${fecha} ${hora}`;

    await sendReminderEmail(email, "⏰ Recordatorio de medicamento", {
      ...reminderData,
      horarios: [horarioCompleto],
    });

    console.log(`📩 Recordatorio Personalizada enviado a ${email} en ${horarioCompleto}`);
    nextTime = new Date(nextTime.getTime() + intervalMs);
  };

  const delay = nextTime - new Date();
  setTimeout(() => {
    sendCustomReminder();
    setInterval(sendCustomReminder, intervalMs);
  }, delay > 0 ? delay : 0);

  return [formatFechaHora(fechaNormalizada).fecha + " " + formatFechaHora(fechaNormalizada).hora];
};

// 📌 Crear recordatorio
const crearRecordatorio = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const {
      titulo,
      fecha,
      descripcion,
      frecuencia,
      tipo,
      horarios,
      dosis,
      unidad,
      cantidadDisponible,
      intervaloPersonalizado,
    } = req.body;

    const info = await InfoUser.findOne({ userId });
    const user = await User.findById(userId);
    const email = info?.email || (/\S+@\S+\.\S+/.test(user?.username) ? user.username : null);
    if (!email) return res.status(400).json({ message: "Usuario sin correo válido" });

    const fechaNormalizada = fecha ? new Date(fecha) : new Date();

    // Obtenemos nombre completo de la persona
    const nombreCompleto = info?.name ? `${info.name} ${info.lastName || ''}`.trim() : "Paciente";

    const reminderData = {
      tipo,
      titulo,
      descripcion,
      frecuencia,
      dosis,
      unidad,
      cantidadDisponible,
      nombrePersona: nombreCompleto,
    };

    let reminder = new Reminder({
      userId,
      tipo,
      titulo,
      fecha: fechaNormalizada,
      descripcion,
      frecuencia,
      horarios: [],
      dosis,
      unidad,
      cantidadDisponible,
    });

    // 🔹 Recordatorios Personalizados
    if (frecuencia === "Personalizada" && intervaloPersonalizado) {
      reminder.horarios = await enviarRecordatorioPersonalizado(fechaNormalizada, intervaloPersonalizado, email, reminderData);
    }
    // 🔹 Recordatorios Diarios o Semanales
    else if (frecuencia === "Diaria" || frecuencia === "Semanal") {
      // Extraemos hora y minuto de la fecha enviada
      const h = fechaNormalizada.getHours();
      const m = fechaNormalizada.getMinutes();
      const horaStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

      reminder.horarios = [horaStr]; // Guardamos solo la hora en la DB
      programarEnvio(frecuencia, [horaStr], fechaNormalizada, email, reminderData);
    }

    await reminder.save();
    res.status(201).json(reminder);
  } catch (error) {
    console.error("❌ Error en crearRecordatorio:", error);
    res.status(500).json({ message: "Error al crear el recordatorio", error: error.message });
  }
};

// 📌 Obtener recordatorios del usuario
const obtenerRecordatoriosPorUsuario = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const recordatorios = await Reminder.find({ userId });
    res.json(recordatorios);
  } catch (error) {
    console.error("❌ Error en obtenerRecordatorios:", error);
    res.status(500).json({ message: "Error al obtener los recordatorios" });
  }
};

// 📌 Actualizar recordatorio
const actualizarRecordatorio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (req.body.fecha) {
      const f = new Date(req.body.fecha);
      req.body.fecha = new Date(f.getFullYear(), f.getMonth(), f.getDate());
    }

    const updated = await Reminder.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Recordatorio no encontrado" });

    res.json(updated);
  } catch (error) {
    console.error("❌ Error en actualizarRecordatorio:", error);
    res.status(500).json({ message: "Error al actualizar el recordatorio" });
  }
};

// 📌 Eliminar recordatorio
const eliminarRecordatorio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const deleted = await Reminder.findOneAndDelete({ _id: id, userId });

    if (!deleted) return res.status(404).json({ message: "Recordatorio no encontrado" });

    res.json({ message: "✅ Recordatorio eliminado" });
  } catch (error) {
    console.error("❌ Error en eliminarRecordatorio:", error);
    res.status(500).json({ message: "Error al eliminar el recordatorio" });
  }
};

module.exports = {
  crearRecordatorio,
  obtenerRecordatoriosPorUsuario,
  actualizarRecordatorio,
  eliminarRecordatorio,
};
