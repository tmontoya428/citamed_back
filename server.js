const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const registerUserRoutes = require('./routes/registerUserRoutes');
const loginRoutes = require('./routes/loginRoutes');
const registerCodeRoutes = require('./routes/registerCodeRoutes');
const historyRoutes = require('./routes/historyRoutes');
const winnersRoutes = require('./routes/winnersRoutes');
const adminRegistrationRoutes = require('./routes/adminRegistrationRoutes');

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Configuración de rutas
app.use('/api/register', registerUserRoutes);
app.use('/api/login', loginRoutes); // Asegúrate de que esta línea esté presente
app.use('/api/register-code', registerCodeRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/winners', winnersRoutes);
app.use('/api/admin', adminRegistrationRoutes);

// Manejador de rutas no encontradas (404)
app.use((req, res, next) => {
    res.status(404).json({ msg: 'Ruta no encontrada' });
});

// Manejador de errores genérico
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ msg: 'Error interno del servidor' });
});

// Configuración del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));