const mongoose = require('mongoose');

const AttemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    qrCode: { type: String, required: true },
    date: { type: Date, default: Date.now }, // Fecha del intento
    result: { type: String, required: true }, // Resultado del intento (ganaste o no ganaste)
});

module.exports = mongoose.model('Attempt', AttemptSchema);
