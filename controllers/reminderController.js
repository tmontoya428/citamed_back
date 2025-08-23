const Reminder = require("../models/reminder");
const User = require("../models/User");
const InfoUser = require("../models/InfoUser");
const sendReminderEmail = require("../utils/sendEmail");
const schedule = require("node-schedule");

// 📌 Crear recordatorio
const crearRecordatorio = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ message: "Usuario no autenticado" });

    const {
      titulo,
      fecha,
      descripcion,
      frecuencia, // "Diaria", "Semanal", "Personalizada"
      tipo,
      horarios,
      dosis,
      unidad,
      cantidadDisponible,
      intervaloPersonalizado, // "2min" | "2h"
    } = req.body;

    const info = await InfoUser.findOne({ userId });
    const user = await User.findById(userId);
    const email =
      info?.email ||
      (/\S+@\S+\.\S+/.test(user?.username) ? user.username : null);

    if (!email)
      return res.status(400).json({ message: "Usuario sin correo válido" });

    let fechaNormalizada = fecha ? new Date(fecha) : new Date();

    const reminder = new Reminder({
      userId,
      tipo,
      titulo,
      fecha: fechaNormalizada,
      descripcion,
      frecuencia,
      horarios,
      dosis,
      unidad,
      cantidadDisponible,
    });
    await reminder.save();

    // 📌 Programar jobs según frecuencia
    if (frecuencia === "Personalizada" && intervaloPersonalizado) {
      let intervalMs = 0;
      if (intervaloPersonalizado === "2min") intervalMs = 2 * 60 * 1000;
      else if (intervaloPersonalizado === "2h") intervalMs = 2 * 60 * 60 * 1000;

      // Hora inicial tomada de fechaNormalizada
      let nextTime = new Date(fechaNormalizada);

      const sendCustomReminder = async () => {
        // Formateamos la hora para mostrarla en el correo
        const horario = nextTime.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        });

        await sendReminderEmail(email, "⏰ Recordatorio de medicamento", {
          tipo,
          titulo,
          fecha: nextTime,
          descripcion,
          frecuencia,
          horarios: [horario], // ✅ Pasamos la hora como arreglo
          dosis,
          unidad,
          cantidadDisponible,
        });

        console.log(`📩 Recordatorio enviado a ${email} a las ${horario}`);

        // Actualizar nextTime sumando el intervalo
        nextTime = new Date(nextTime.getTime() + intervalMs);
      };

      // Enviar primero a la hora inicial
      const delay = nextTime - new Date();
      setTimeout(() => {
        sendCustomReminder();
        setInterval(sendCustomReminder, intervalMs);
      }, delay > 0 ? delay : 0);
    } else if (frecuencia === "Diaria" || frecuencia === "Semanal") {
      if (!horarios || !Array.isArray(horarios) || horarios.length === 0)
        return res
          .status(400)
          .json({ message: "Debes enviar al menos un horario" });

      horarios.forEach((hora) => {
        const [h, m] = hora.split(":").map(Number);
        const rule = new schedule.RecurrenceRule();
        rule.hour = h;
        rule.minute = m;
        rule.tz = "America/Bogota";
        if (frecuencia === "Semanal") rule.dayOfWeek = fechaNormalizada.getDay();

        schedule.scheduleJob(rule, async () => {
          await sendReminderEmail(
            email,
            `⏰ Recordatorio ${frecuencia.toLowerCase()} de medicamento`,
            {
              tipo,
              titulo,
              fecha: new Date(),
              descripcion,
              frecuencia,
              horarios,
              dosis,
              unidad,
              cantidadDisponible,
            }
          );
          console.log(`📩 Recordatorio ${frecuencia} enviado a ${email} a las ${hora}`);
        });
      });
    }

    res.status(201).json(reminder);
  } catch (error) {
    console.error("❌ Error en crearRecordatorio:", error);
    res
      .status(500)
      .json({ message: "Error al crear el recordatorio", error: error.message });
  }
};

// 📌 Obtener recordatorios del usuario
const obtenerRecordatoriosPorUsuario = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ message: "Usuario no autenticado" });

    const recordatorios = await Reminder.find({ userId });
    res.json(recordatorios);
  } catch (error) {
    console.error("❌ Error en obtenerRecordatorios:", error);
    res.status(500).json({ message: "Error al obtener los recordatorios" });
  }
};

// 📌 Actualizar recordatorio
const actualizarRecordatorio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (req.body.fecha) {
      const f = new Date(req.body.fecha);
      req.body.fecha = new Date(f.getFullYear(), f.getMonth(), f.getDate());
    }

    const updated = await Reminder.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Recordatorio no encontrado" });

    res.json(updated);
  } catch (error) {
    console.error("❌ Error en actualizarRecordatorio:", error);
    res.status(500).json({ message: "Error al actualizar el recordatorio" });
  }
};

// 📌 Eliminar recordatorio
const eliminarRecordatorio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const deleted = await Reminder.findOneAndDelete({ _id: id, userId });

    if (!deleted)
      return res.status(404).json({ message: "Recordatorio no encontrado" });

    res.json({ message: "✅ Recordatorio eliminado" });
  } catch (error) {
    console.error("❌ Error en eliminarRecordatorio:", error);
    res.status(500).json({ message: "Error al eliminar el recordatorio" });
  }
};

module.exports = {
  crearRecordatorio,
  obtenerRecordatoriosPorUsuario,
  actualizarRecordatorio,
  eliminarRecordatorio,
};
