const Reminder = require("../models/reminder");
const User = require("../models/User");
const InfoUser = require("../models/InfoUser");
const sendReminderEmail = require("../utils/sendEmail");
const schedule = require("node-schedule");

// 📌 Crear recordatorio (CORREGIDO)
const crearRecordatorio = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ message: "Usuario no autenticado" });

    const {
      titulo,
      fecha,
      fecha_control,
      descripcion,
      frecuencia, // "Unica", "Diaria", "Semanal"
      tipo,
      horarios,
      dosis,
      unidad,
      cantidadDisponible,
    } = req.body;

    if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
      return res
        .status(400)
        .json({ message: "Debes enviar al menos un horario" });
    }

    const info = await InfoUser.findOne({ userId });
    const user = await User.findById(userId);

    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    const usernameEmail = isValidEmail(user?.username) ? user.username : null;
    const email = info?.email || usernameEmail;

    if (!email) {
      return res.status(400).json({ message: "Usuario sin correo válido" });
    }

  // 🔥 Normalizar fecha como Date (seguro)
let fechaNormalizada = null;

if (fecha && typeof fecha === "string") {
  const partes = fecha.split("-").map(Number); // ["2025","08","23"] -> [2025,8,23]
  if (partes.length === 3 && !partes.some(isNaN)) {
    const [year, month, day] = partes;
    fechaNormalizada = new Date(year, month - 1, day); // mes 0-index
  } else {
    return res.status(400).json({ message: "Fecha inválida" });
  }
} else {
  return res.status(400).json({ message: "Fecha requerida" });
}


    // Guardar recordatorio en BD
    const reminder = new Reminder({
      userId,
      tipo,
      titulo,
      fecha: fechaNormalizada,
      fecha_control,
      descripcion,
      frecuencia,
      horarios,
      dosis,
      unidad,
      cantidadDisponible,
    });
    await reminder.save();

    // 📌 Programar jobs según frecuencia
    horarios.forEach((hora) => {
      const [h, m] = hora.split(":").map(Number);

      if (frecuencia === "Unica" || !frecuencia) {
        const fechaRecordatorio = new Date(fechaNormalizada);
        fechaRecordatorio.setHours(h, m, 0, 0);

        schedule.scheduleJob(fechaRecordatorio, async () => {
          await sendReminderEmail(email, "⏰ Recordatorio de medicamento", {
            tipo,
            titulo,
            fecha: fechaNormalizada,
            fecha_control,
            descripcion,
            frecuencia,
            horarios,
            dosis,
            unidad,
            cantidadDisponible,
          });
          console.log(`📩 Recordatorio enviado a ${email} el ${fechaRecordatorio}`);
        });
      } else if (frecuencia === "Diaria") {
        const rule = new schedule.RecurrenceRule();
        rule.hour = h;
        rule.minute = m;
        rule.tz = "America/Bogota";

        schedule.scheduleJob(rule, async () => {
          await sendReminderEmail(email, "⏰ Recordatorio diario de medicamento", {
            tipo,
            titulo,
            fecha: fechaNormalizada,
            fecha_control,
            descripcion,
            frecuencia,
            horarios,
            dosis,
            unidad,
            cantidadDisponible,
          });
          console.log(`📩 Recordatorio diario enviado a ${email} a las ${hora}`);
        });
      } else if (frecuencia === "Semanal") {
        const rule = new schedule.RecurrenceRule();
        rule.dayOfWeek = new Date(fechaNormalizada).getDay();
        rule.hour = h;
        rule.minute = m;
        rule.tz = "America/Bogota";

        schedule.scheduleJob(rule, async () => {
          await sendReminderEmail(email, "⏰ Recordatorio semanal de medicamento", {
            tipo,
            titulo,
            fecha: fechaNormalizada,
            fecha_control,
            descripcion,
            frecuencia,
            horarios,
            dosis,
            unidad,
            cantidadDisponible,
          });
          console.log(`📩 Recordatorio semanal enviado a ${email} cada ${rule.dayOfWeek} a las ${hora}`);
        });
      }
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error("❌ Error en crearRecordatorio:", error);
    res.status(500).json({
      message: "Error al crear el recordatorio",
      error: error.message,
    });
  }
};

// 📌 Obtener recordatorios del usuario autenticado
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
      const [year, month, day] = req.body.fecha.split("-").map(Number);
      req.body.fecha = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
