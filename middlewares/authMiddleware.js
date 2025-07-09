const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    //console.log('Token recibido:', token); // Log para verificar el token//

    if (!token) {
        //console.log('No token, authorization denied');//
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const verified = jwt.verify(token, 'secretkey'); // Asegúrate de usar la misma clave secreta
        req.userId = verified.userId; // Guarda el userId del token en la solicitud
        next();
    } catch (error) {
        //console.log('Token inválido:', error.message); // Imprime el error para más detalles//
        res.status(401).json({ msg: 'Token inválido' });
    }
};

module.exports = authMiddleware;
