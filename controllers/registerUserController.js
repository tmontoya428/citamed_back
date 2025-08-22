const bcrypt = require('bcryptjs');
const User = require('../models/User');
const InfoUser = require('../models/InfoUser');

const registerUser = async (req, res) => {
    const { username, password, celular, ...info } = req.body;

    try {
        // Validar campos obligatorios
        if (!username || !password || !celular) {
            return res.status(400).json({ msg: 'Faltan datos: username, password y celular son obligatorios' });
        }

        // Validar si el usuario ya existe
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ msg: 'Usuario ya registrado' });

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        user = new User({ username, password: hashedPassword });
        await user.save();

        // Crear información adicional (incluyendo celular)
        const userInfo = new InfoUser({ ...info, celular, userId: user._id });
        await userInfo.save();

        res.status(201).json({
            msg: 'Usuario registrado',
            user: { id: user._id, username: user.username, celular }
        });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

module.exports = { registerUser };
