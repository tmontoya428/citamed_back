const express = require('express');
const router = express.Router();
const {
  crearRecordatorio,
  obtenerRecordatoriosPorUsuario,
  eliminarRecordatorio,
  actualizarRecordatorio
} = require('../controllers/reminderController');

const authMiddleware = require('../middlewares/authMiddleware'); // ⬅️ IMPORTA EL MIDDLEWARE

// ✅ Crear recordatorio - requiere token válido
router.post('/', authMiddleware, crearRecordatorio);

// ✅ Obtener recordatorios del usuario autenticado
router.get('/:userId', authMiddleware, obtenerRecordatoriosPorUsuario);

// ✅ Actualizar un recordatorio
router.put('/:id', authMiddleware, actualizarRecordatorio);

// ✅ Eliminar un recordatorio
router.delete('/:id', authMiddleware, eliminarRecordatorio);

module.exports = router;
