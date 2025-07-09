/*const mongoose = require('mongoose');

const CodeSchema = new mongoose.Schema({
    qrCode: { type: String, unique: true },
    prize: Number, // 10000, 50000, 1000000
    status: { type: String, default: 'libre' }, // 'free' o 'claimed'
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    claimedAt: Date
});

module.exports = mongoose.model('Code', CodeSchema);*/

const mongoose = require('mongoose');

const CodeSchema = new mongoose.Schema({
    codigo: { type: String, required: true },
    estado: { type: String, default: 'libre' }, // Almacena 'libre' o el userId como String
    fecha: { type: String },
    hora: { type: String },
    premio: { type: String }, // O cualquier otro campo que tengas
});

module.exports = mongoose.model('Code', CodeSchema);