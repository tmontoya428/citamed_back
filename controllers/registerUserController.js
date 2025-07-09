const bcrypt = require('bcryptjs');
const User = require('../models/User');
const InfoUser = require('../models/InfoUser');

const registerUser = async (req, res) => {
    const { username, password, ...info } = req.body;

    try {
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ msg: 'Usuario ya registrado' });

        user = new User({ username, password: bcrypt.hashSync(password, 10) });
        await user.save();

        const userInfo = new InfoUser({ ...info, userId: user._id });
        await userInfo.save();

        res.status(200).json({ msg: 'Usuario registrado' });
    } catch (error) {
        console.error('Error al registrar el usuario:', error); //este log para ayudar a depurar
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

module.exports = { registerUser };
