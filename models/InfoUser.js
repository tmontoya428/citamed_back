const mongoose = require('mongoose');

const InfoUserSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    lastName: String,
    birthdate: String,
    phone: { type: String,required: true, match: /^[0-9]{10}$/ 
    },
    email: String, // ✅ Agregado
});

module.exports = mongoose.model('InfoUser', InfoUserSchema);
