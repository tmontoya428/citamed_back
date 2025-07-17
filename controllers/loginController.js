const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ msg: 'Credenciales incorrectas' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales incorrectas' });
    }

    const payload = {
      userId: user._id.toString(),
      role: user.role,
    };

    const token = jwt.sign(payload, 'secretkey', { expiresIn: '1h' });

    res.json({ token, role: user.role });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

module.exports = login;
