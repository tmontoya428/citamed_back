const Agenda = require('agenda');
const Reminder = require('../models/reminder');
const User = require('../models/User');
const InfoUser = require('../models/InfoUser');
const sendReminderEmail = require('./sendEmail');

const mongoConnectionString = process.env.MONGODB_URI;

// 🔹 Inicializa Agenda
const agenda = new Agenda({ db: { address: mongoConnectionString, collection: 'agendaJobs' } });

// 🔹 Formatear fecha/hora 12h AM/PM
const formatFechaHora = (date) => {
  const fecha = date.toLocaleDateString("es-CO");
  const hora = date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true });
  return { fecha, hora };
};

// 🔹 Job para enviar recordatorio
agenda.define('send-reminder', async (job) => {
  const { userId, reminderId } = job.attrs.data;

  const reminder = await Reminder.findById(reminderId);
  if (!reminder) return;

  const user = await User.findById(userId);
  const info = await InfoUser.findOne({ userId });
  const email = info?.email || (/\S+@\S+\.\S+/.test(user?.username) ? user.username : null);
  if (!email) return;

  const now = new Date();
  const { fecha, hora } = formatFechaHora(now);

  await sendReminderEmail(email, `⏰ Recordatorio de medicamento`, {
    ...reminder.toObject(),
    horarios: [`${fecha} ${hora}`],
  });

  console.log(`📩 Recordatorio enviado a ${email} en ${fecha} ${hora}`);
});

// 🔹 Función para programar un recordatorio
const scheduleReminder = async (reminder) => {
  if (!reminder.fecha || !reminder.userId) return;

  await agenda.start();
  await agenda.schedule(reminder.fecha, 'send-reminder', { userId: reminder.userId, reminderId: reminder._id });
};

// 🔹 Al iniciar, carga todos los recordatorios pendientes
const initAgenda = async () => {
  await agenda.start();

  const recordatorios = await Reminder.find({ fecha: { $gte: new Date() } });
  for (const r of recordatorios) {
    await scheduleReminder(r);
  }

  console.log('✅ Agenda inicializada y recordatorios programados');
};

module.exports = { agenda, initAgenda, scheduleReminder };
