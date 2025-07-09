const Code = require('../models/Code');
const Attempt = require('../models/Attempt');

const registerCode = async (req, res) => {
    const { qrCode } = req.body;
    const userId = req.userId;

    if (!/^\d{3}$/.test(qrCode)) {
        return res.status(400).json({ msg: 'Código inválido' });
    }

    try {
        let code = await Code.findOne({ codigo: qrCode });
        let resultMessage;

        if (!code) {
            resultMessage = 'No ganaste, sigue intentando';
        } else {
            if (code.estado !== 'libre') {
                resultMessage = 'Código ya registrado';
            } else {
                code.estado = userId;
                code.fecha = new Date().toLocaleDateString('es-ES');
                code.hora = new Date().toLocaleTimeString('es-ES');
                await code.save();
                resultMessage = `¡Ganaste! Premio: ${code.premio}`;
            }
        }

        const newAttempt = new Attempt({
            userId,
            qrCode,
            date: new Date(),
            result: resultMessage,
        });
        await newAttempt.save();

        res.json({ msg: resultMessage });
    } catch (error) {
        console.error('Error registrando el intento:', error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

module.exports = registerCode;
