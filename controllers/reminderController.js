const Reminder = require('../models/reminder');
const User = require('../models/User');
const InfoUser = require('../models/InfoUser');
const sendReminderEmail = require('../utils/sendEmail');
const schedule = require("node-schedule");

const crearRecordatorio = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const {
      titulo,
      descripcion,
      frecuencia,
      tipo,
      horarios, // <-- array con horas, ej: ["08:00", "14:00", "20:00"]
      dosis,
      unidad,
      cantidadDisponible
    } = req.body;

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
      descripcion,
      frecuencia,
      horarios,
      dosis,
      unidad,
      cantidadDisponible
    });
    await reminder.save();

    // Programar jobs según horarios
    horarios.forEach((hora) => {
      const [h, m] = hora.split(":").map(Number);
      const rule = new schedule.RecurrenceRule();
      rule.hour = h;
      rule.minute = m;
      rule.tz = "America/Bogota"; // ✅ importante para Colombia

      schedule.scheduleJob(rule, async () => {
        await sendReminderEmail(email, '⏰ Recordatorio de medicamento', {
          tipo,
          titulo,
          descripcion,
          frecuencia,
          horarios,
          dosis,
          unidad,
          cantidadDisponible
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
;

const obtenerRecordatoriosPorUsuario = async (req, res) => {
  try {
    const userId = req.user?.id; // ✅ viene del token gracias a authMiddleware

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const reminders = await Reminder.find({ userId }).sort({ createdAt: -1 }); // más recientes primero
    res.status(200).json(reminders);
  } catch (error) {
    console.error("❌ Error al obtener recordatorios:", error);
    res.status(500).json({ message: "Error al obtener recordatorios", error: error.message });
  }
};


const eliminarRecordatorio = async (req, res) => {
  try {
    const { id } = req.params;
    await Reminder.findByIdAndDelete(id);
    res.status(200).json({ message: 'Recordatorio eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el recordatorio', error: error.message });
  }
};

const actualizarRecordatorio = async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await Reminder.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(reminder);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar', error: error.message });
  }
};

module.exports = {
  crearRecordatorio,
  obtenerRecordatoriosPorUsuario,
  eliminarRecordatorio,
  actualizarRecordatorio,
};
