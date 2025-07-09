const Code = require('../models/Code');
const InfoUser = require('../models/InfoUser');

const getWinners = async (req, res) => {
    try {
        // Encontrar los códigos que han sido reclamados (estado es un userId)
        const codes = await Code.find({ estado: { $ne: 'libre' } });

        // Obtener la información del usuario a partir de la colección InfoUser
        const winners = await Promise.all(
            codes.map(async (code) => {
                // Buscar la información del usuario basado en el userId almacenado en 'estado'
                const userInfo = await InfoUser.findOne({ userId: code.estado });

                
                const dateTime = code.fecha && code.hora ? `${code.fecha} ${code.hora}` : null;

                return {
                    date: dateTime,
                    user: userInfo ? userInfo.name : 'N/A',
                    city: userInfo ? userInfo.city : 'N/A',
                    phone: userInfo ? userInfo.phone : 'N/A',
                    qrCode: code.codigo,
                    prize: code.premio,
                };
            })
        );

        res.json(winners);
    } catch (error) {
        console.error('Error al obtener los ganadores:', error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

module.exports = getWinners;