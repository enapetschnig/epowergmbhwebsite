const twilio = require('twilio');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { stelle, vorname, nachname, email, telefon, nachricht, link } = req.body || {};

  if (!stelle || !vorname || !nachname || !telefon) {
    return res.status(400).json({ error: 'Fehlende Pflichtfelder' });
  }

  const timestamp = new Date().toLocaleString('de-AT', { timeZone: 'Europe/Vienna' });
  const cut = (s, n) => (s || '').toString().trim().slice(0, n);

  let message = `Neue Bewerbung: ${cut(stelle, 60)}\n`;
  message += `${cut(vorname, 40)} ${cut(nachname, 40)}\n`;
  message += `Tel: ${cut(telefon, 40)}\n`;
  if (email) message += `Mail: ${cut(email, 80)}\n`;
  if (link) message += `Link: ${cut(link, 120)}\n`;
  if (nachricht) message += `Text: ${cut(nachricht, 600)}\n`;
  message += `Zeit: ${timestamp}`;

  try {
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_FROM,
      to: process.env.NOTIFY_PHONE
    });
    console.log('SMS gesendet');
  } catch (err) {
    console.error('SMS Fehler:', err.message);
  }

  return res.status(200).json({ ok: true });
};
