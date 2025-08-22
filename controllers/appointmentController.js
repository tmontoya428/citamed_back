// controllers/appointmentController.js
const Appointment = require("../models/appointment");

// Obtener todas las citas de un usuario
const getAppointments = async (req, res) => {
  try {
    const userId = req.user?.id; // viene del token
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });

    const appointments = await Appointment.find({ usuario: userId }).sort({ fecha: 1 });
    res.status(200).json(appointments);
  } catch (error) {
    console.error("❌ Error al obtener citas:", error);
    res.status(500).json({ message: "Error al obtener citas", error: error.message });
  }
};

// Crear una nueva cita
const createAppointment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { titulo, descripcion, fecha, hora, medico } = req.body;

    if (!titulo || !fecha) {
      return res.status(400).json({ message: "Título y fecha son obligatorios" });
    }

    const appointment = new Appointment({
      usuario: userId,
      titulo,
      descripcion,
      fecha,
      hora,
      medico,
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    console.error("❌ Error al crear cita:", error);
    res.status(500).json({ message: "Error al crear cita", error: error.message });
  }
};

// Eliminar cita por ID
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    await Appointment.findByIdAndDelete(id);
    res.status(200).json({ message: "Cita eliminada" });
  } catch (error) {
    console.error("❌ Error al eliminar cita:", error);
    res.status(500).json({ message: "Error al eliminar cita", error: error.message });
  }
};

// Actualizar cita por ID
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Appointment.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Error al actualizar cita:", error);
    res.status(500).json({ message: "Error al actualizar cita", error: error.message });
  }
};

module.exports = {
  getAppointments,
  createAppointment,
  deleteAppointment,
  updateAppointment,
};
