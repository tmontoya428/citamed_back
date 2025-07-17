const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  tipo: {
    type: String, // "control" o "medicamento"
    required: true
  },
  titulo: String,
  descripcion: String,
  frecuencia: String, // Diaria, Semanal, Personalizada
  horarios: [String], // ["8:00 AM", "6:00 PM"]
  dosis: Number,
  unidad: String,
  cantidadDisponible: Number,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creadoEn: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reminder', reminderSchema);
