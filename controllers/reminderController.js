const Reminder = require('../models/reminder');
const User = require('../models/User');
const InfoUser = require('../models/InfoUser');
const sendReminderEmail = require('../utils/sendEmail');

// 👉 Crear un nuevo recordatorio
const crearRecordatorio = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      console.warn("⚠️ Token recibido sin userId");
      return res.status(401).json({ message: "Token inválido. No se identificó al usuario." });
    }

    const {
      titulo,
      descripcion,
      frecuencia,
      tipo,
      horarios,
      dosis,
      unidad,
      cantidadDisponible
    } = req.body;

    console.log("✅ userId desde token:", userId);

    const info = await InfoUser.findOne({ userId });
    const user = await User.findById(userId);

    console.log("📄 InfoUser encontrado:", info);
    console.log("👤 User encontrado:", user);

    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    const usernameEmail = isValidEmail(user?.username) ? user.username : null;
    const email = info?.email || usernameEmail;

    if (!email) {
      console.warn("⚠️ Usuario sin correo electrónico asociado");
      return res.status(400).json({ message: "Usuario sin correo asociado válido" });
    }

    const reminder = new Reminder({
      userId,
      titulo,
      descripcion,
      frecuencia,
      tipo,
      horarios,
      dosis,
      unidad,
      cantidadDisponible
    });

    await reminder.save();

    await sendReminderEmail(
      email,
      '📅 Nuevo recordatorio en CITAMED',
      `Recordatorio creado:\n\nTítulo: ${titulo}\nDescripción: ${descripcion}\nFrecuencia: ${frecuencia}`
    );

    console.log("✅ Recordatorio creado y correo enviado a:", email);
    res.status(201).json(reminder);

  } catch (error) {
    console.error("❌ Error en crearRecordatorio:", error);
    res.status(500).json({
      message: 'Error al crear el recordatorio',
      error: error.message
    });
  }
};

// 👉 Obtener recordatorios por ID de usuario
const obtenerRecordatoriosPorUsuario = async (req, res) => {
  try {
    const { userId } = req.params;
    const reminders = await Reminder.find({ userId });
    res.status(200).json(reminders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener recordatorios', error: error.message });
  }
};

// 👉 Eliminar recordatorio por ID
const eliminarRecordatorio = async (req, res) => {
  try {
    const { id } = req.params;
    await Reminder.findByIdAndDelete(id);
    res.status(200).json({ message: 'Recordatorio eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el recordatorio', error: error.message });
  }
};

// 👉 Actualizar un recordatorio
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
