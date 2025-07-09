const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Buscar el usuario por email
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ msg: 'Credenciales incorrectas' });

        // Comparar la contraseña proporcionada con la almacenada
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Credenciales incorrectas' });

        // Crear un token JWT
        const token = jwt.sign({ userId: user._id, role: user.role }, 'secretkey');

        // Devolver el token y el rol
        res.json({ token, role: user.role });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

module.exports = login;