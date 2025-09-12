const InfoUser = require('../models/InfoUser');

// ✅ Obtener info del usuario autenticado
const getInfoUser = async (req, res) => {
  try {
    const info = await InfoUser.findOne({ userId: req.user.id }).lean();

    if (!info) {
      return res.status(404).json({ msg: 'Información no encontrada' });
    }

    const { name, lastName, email } = info;
    const fullName = [name, lastName].filter(Boolean).join(" "); // 👈 evita "undefined"
    
    res.json({ name, lastName, email, fullName });
  } catch (error) {
    console.error('❌ Error al obtener información:', error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// ✅ Actualizar info del usuario con validación de campos vacíos
const updateInfoUser = async (req, res) => {
  try {
    let updates = req.body;

    // 🚨 Validar que no se envíen campos vacíos o solo espacios
    for (let key of Object.keys(updates)) {
      if (updates[key] === undefined || updates[key] === null) {
        return res.status(400).json({ msg: `El campo "${key}" es requerido.` });
      }

      if (typeof updates[key] === "string") {
        updates[key] = updates[key].trim();
        if (updates[key] === "") {
          return res.status(400).json({ msg: `El campo "${key}" no puede estar vacío.` });
        }
      }
    }

    const updatedInfo = await InfoUser.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedInfo) {
      return res.status(404).json({ msg: "Información no encontrada" });
    }

    const { name, lastName, email } = updatedInfo;
    const fullName = [name, lastName].filter(Boolean).join(" "); // 👈 evita "undefined"
    
    res.json({ name, lastName, email, fullName });
  } catch (error) {
    console.error("❌ Error al actualizar información:", error);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

module.exports = { getInfoUser, updateInfoUser };
