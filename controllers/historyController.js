const Attempt = require('../models/Attempt');

const getHistory = async (req, res) => {
    const userId = req.userId;

    try {
        const attempts = await Attempt.find({ userId }).sort({ date: -1 });
        res.json(attempts);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

module.exports = getHistory;