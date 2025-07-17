const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  tipo: {
    type: String, // "control" o "medicamento"
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  frecuencia: {
    type: String,
    enum: ['Diaria', 'Semanal', 'Personalizada'],
    required: true
  },
  horarios: {
    type: [String], // ["8:00 AM", "6:00 PM"]
    default: []
  },
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
