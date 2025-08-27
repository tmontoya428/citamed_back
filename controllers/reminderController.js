const Reminder = require("../models/reminder");
const User = require("../models/User");
const InfoUser = require("../models/InfoUser");
const sendReminderEmail = require("../utils/sendEmail");
const schedule = require("node-schedule");

// 📌 Formatear fecha y hora en 12h AM/PM
const formatFechaHora = (date) => {
  const fecha = date.toLocaleDateString("es-CO");
  const hora = date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // AM/PM
  });
  return { fecha, hora };
};

// 📌 Programar envíos diarios/semanales
const programarEnvio = (frecuencia, horariosObj, fechaNormalizada, email, reminderData) => {
  horariosObj.forEach(({ hour, minute }) => {
    const rule = new schedule.RecurrenceRule();
    rule.hour = hour; 
    rule.minute = minute;
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

// 📌 Recordatorios personalizados
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

    console.log(`📩 Recordatorio Personalizado enviado a ${email} en ${horarioCompleto}`);
    nextTime = new Date(nextTime.getTime() + intervalMs);
  };

  const delay = nextTime - new Date();
  setTimeout(() => {
    sendCustomReminder();
    setInterval(sendCustomReminder, intervalMs);
  }, delay > 0 ? delay : 0);

  const { fecha, hora } = formatFechaHora(fechaNormalizada);
  return [`${fecha} ${hora}`];
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

    if (frecuencia === "Personalizada" && intervaloPersonalizado) {
      // AM/PM para mostrar y enviar correo
      reminder.horarios = await enviarRecordatorioPersonalizado(fechaNormalizada, intervaloPersonalizado, email, reminderData);
    } else if (frecuencia === "Diaria" || frecuencia === "Semanal") {
      const { hora } = formatFechaHora(fechaNormalizada);
      reminder.horarios = [hora]; // AM/PM para DB

      // Hora 24h para node-schedule
      const hour24 = fechaNormalizada.getHours();
      const minute = fechaNormalizada.getMinutes();
      programarEnvio(frecuencia, [{ hour: hour24, minute }], fechaNormalizada, email, reminderData);
    }

    await reminder.save();

    // Formatear fecha/hora al responder
    const { fecha: fForm, hora: hForm } = formatFechaHora(fechaNormalizada);
    res.status(201).json({
      ...reminder.toObject(),
      fechaFormateada: fForm,
      horaFormateada: hForm,
    });

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

    const recordatoriosFormateados = recordatorios.map(r => {
      const { fecha, hora } = formatFechaHora(new Date(r.fecha));
      return {
        ...r.toObject(),
        fechaFormateada: fecha,
        horaFormateada: hora,
      };
    });

    res.json(recordatoriosFormateados);
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

    // Formatear fecha/hora al responder
    const { fecha: fForm, hora: hForm } = formatFechaHora(new Date(updated.fecha));

    res.json({
      ...updated.toObject(),
      fechaFormateada: fForm,
      horaFormateada: hForm,
    });
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
// 📌 Marcar recordatorio como completado o no
const marcarRecordatorioCompletado = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body; // true o false
    const userId = req.user?.id;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userId },
      { completed },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: "Recordatorio no encontrado" });
    }

    res.json(reminder);
  } catch (error) {
    console.error("❌ Error en marcarRecordatorioCompletado:", error);
    res.status(500).json({ message: "Error al actualizar el estado del recordatorio" });
  }
};


module.exports = {
  crearRecordatorio,
  obtenerRecordatoriosPorUsuario,
  actualizarRecordatorio,
  eliminarRecordatorio,
  marcarRecordatorioCompletado,
  
};
