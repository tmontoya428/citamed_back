const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
  tipo: {
    type: String, // "control" o "medicamento"
    required: true,
  },
  titulo: {
    type: String,
    required: true,
  },
  fecha: {
    type: Date,
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  frecuencia: {
    type: String,
    enum: ["Diaria", "Semanal", "Personalizada"],
    required: true,
  },
  horarios: {
    type: [String], // ["08:00", "18:00"]
    default: [],
  },
  dosis: Number,
  unidad: String,
  cantidadDisponible: Number,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  creadoEn: {
    type: Date,
    default: Date.now,
  },
   completed: {
    type: Boolean,
    default: false, 
  },
});

module.exports = mongoose.model("Reminder", reminderSchema);
