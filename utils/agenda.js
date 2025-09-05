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

// 🔹 Mapeo de intervalos español → inglés
const intervalMap = {
  minuto: 'minute',
  minutos: 'minutes',
  hora: 'hour',
  horas: 'hours',
  dia: 'day',
  días: 'days',
  dias: 'days',
  semana: 'week',
  semanas: 'weeks',
};

// 🔹 Función para validar intervalos en español
const parseInterval = (intervalo) => {
  const regex = /^(\d+)\s*(minutos?|horas?|d[ií]as?|semanas?)$/i;
  const match = intervalo.trim().match(regex);

  if (!match) return null;

  const cantidad = match[1];
  const unidadEs = match[2].toLowerCase();
  const unidadEn = intervalMap[unidadEs];

  return unidadEn ? `${cantidad} ${unidadEn}` : null;
};

// 🔹 Función para programar un recordatorio (único o repetitivo)
const scheduleReminder = async (reminder) => {
  if (!reminder.fecha || !reminder.userId) return;

  await agenda.start();

  // ❌ Borra jobs anteriores de este recordatorio para evitar duplicados
  await agenda.cancel({ 'data.reminderId': reminder._id.toString() });

  const reminderIdStr = reminder._id.toString();

  // 🔹 Frecuencia diaria
  if (reminder.frecuencia === 'Diaria') {
    const primerEnvio = agenda.create('send-reminder', { userId: reminder.userId, reminderId: reminderIdStr });
    primerEnvio.schedule(reminder.fecha);
    await primerEnvio.save();
    console.log(`📌 Primer recordatorio diario programado para ${reminder.fecha}`);

    const jobRepetitivo = agenda.create('send-reminder', { userId: reminder.userId, reminderId: reminderIdStr });
    jobRepetitivo.repeatEvery('1 day', { skipImmediate: true });
    await jobRepetitivo.save();
    console.log('🔁 Recordatorio diario repetitivo guardado');

  // 🔹 Frecuencia semanal
  } else if (reminder.frecuencia === 'Semanal') {
    const primerEnvio = agenda.create('send-reminder', { userId: reminder.userId, reminderId: reminderIdStr });
    primerEnvio.schedule(reminder.fecha);
    await primerEnvio.save();
    console.log(`📌 Primer recordatorio semanal programado para ${reminder.fecha}`);

    const jobRepetitivo = agenda.create('send-reminder', { userId: reminder.userId, reminderId: reminderIdStr });
    jobRepetitivo.repeatEvery('1 week', { skipImmediate: true });
    await jobRepetitivo.save();
    console.log('🔁 Recordatorio semanal repetitivo guardado');

  // 🔹 Frecuencia personalizada
  } else if (reminder.frecuencia === 'Personalizada' && reminder.intervaloPersonalizado) {
    const intervaloEn = parseInterval(reminder.intervaloPersonalizado);
    if (!intervaloEn) {
      console.error(`❌ Intervalo no válido: ${reminder.intervaloPersonalizado}`);
      return;
    }

    const primerEnvio = agenda.create('send-reminder', { userId: reminder.userId, reminderId: reminderIdStr });
    primerEnvio.schedule(reminder.fecha);
    await primerEnvio.save();
    console.log(`📌 Primer recordatorio personalizado programado para ${reminder.fecha}`);

    const jobRepetitivo = agenda.create('send-reminder', { userId: reminder.userId, reminderId: reminderIdStr });
    jobRepetitivo.repeatEvery(intervaloEn, { skipImmediate: true });
    await jobRepetitivo.save();
    console.log(`🔁 Recordatorio repetitivo cada ${intervaloEn} guardado`);

  // 🔹 Frecuencia única
  } else {
    const job = agenda.create('send-reminder', { userId: reminder.userId, reminderId: reminderIdStr });
    job.schedule(reminder.fecha);
    await job.save();
    console.log(`📌 Recordatorio único programado para ${reminder.fecha}`);
  }
};

// 🔹 Inicializar Agenda y programar todos los recordatorios pendientes
const initAgenda = async () => {
  await agenda.start();

  const recordatorios = await Reminder.find({ fecha: { $gte: new Date() } });
  for (const r of recordatorios) {
    await scheduleReminder(r);
  }

  console.log('✅ Agenda inicializada y recordatorios programados');
};

module.exports = { agenda, initAgenda, scheduleReminder };
