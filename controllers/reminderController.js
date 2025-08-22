const Reminder = require("../models/reminder");
const User = require("../models/User");
const InfoUser = require("../models/InfoUser");
const sendReminderEmail = require("../utils/sendEmail");
const schedule = require("node-schedule");

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
    } = req.body;

    if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
      return res.status(400).json({ message: "Debes enviar al menos un horario" });
    }

    const info = await InfoUser.findOne({ userId });
    const user = await User.findById(userId);

    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    const usernameEmail = isValidEmail(user?.username) ? user.username : null;
    const email = info?.email || usernameEmail;

    if (!email) {
      return res.status(400).json({ message: "Usuario sin correo válido" });
    }

    // Guardar recordatorio en BD
    const reminder = new Reminder({
      userId,
      tipo,
      titulo,
      fecha,
      descripcion,
      frecuencia,
      horarios,
      dosis,
      unidad,
      cantidadDisponible,
    });
    await reminder.save();

    // Programar jobs
    horarios.forEach((hora) => {
      const [h, m] = hora.split(":").map(Number);
      const rule = new schedule.RecurrenceRule();
      rule.hour = h;
      rule.minute = m;
      rule.tz = "America/Bogota";

      schedule.scheduleJob(rule, async () => {
        await sendReminderEmail(email, "⏰ Recordatorio de medicamento", {
          tipo,
          titulo,
          fecha,
          descripcion,
          frecuencia,
          horarios,
          dosis,
          unidad,
          cantidadDisponible,
        });
        console.log(`📩 Recordatorio enviado a ${email} a las ${hora}`);
      });
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error("❌ Error en crearRecordatorio:", error);
    res.status(500).json({ message: "Error al crear el recordatorio", error: error.message });
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

    const updated = await Reminder.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Recordatorio no encontrado" });
    }

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

    if (!deleted) {
      return res.status(404).json({ message: "Recordatorio no encontrado" });
    }

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
