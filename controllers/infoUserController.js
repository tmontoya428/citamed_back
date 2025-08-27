const InfoUser = require('../models/InfoUser');

// ✅ Obtener info del usuario autenticado
const getInfoUser = async (req, res) => {
  try {
    const info = await InfoUser.findOne({ userId: req.user.id }); // <-- corregido
    if (!info) return res.status(404).json({ msg: 'Información no encontrada' });
    res.json(info);
  } catch (error) {
    console.error('❌ Error al obtener información:', error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// ✅ Actualizar info del usuario
const updateInfoUser = async (req, res) => {
  try {
    const updatedInfo = await InfoUser.findOneAndUpdate(
      { userId: req.user.id }, // <-- corregido
      req.body,
      { new: true }
    );
    if (!updatedInfo) return res.status(404).json({ msg: 'Información no encontrada' });
    res.json(updatedInfo);
  } catch (error) {
    console.error('❌ Error al actualizar información:', error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

module.exports = { getInfoUser, updateInfoUser };
