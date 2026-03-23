const twilio = require('twilio');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vorname, nachname, unternehmen, telefon, quelle, gf, mitarbeiter } = req.body;

  if (!vorname || !nachname || !telefon) {
    return res.status(400).json({ error: 'Fehlende Pflichtfelder' });
  }

  const timestamp = new Date().toLocaleString('de-AT', { timeZone: 'Europe/Vienna' });

  let message = `Neuer Lead (${quelle || 'website'})\n`;
  message += `${vorname} ${nachname}\n`;
  if (unternehmen) message += `Firma: ${unternehmen}\n`;
  message += `Tel: ${telefon}\n`;
  if (gf) message += `GF: ${gf}\n`;
  if (mitarbeiter) message += `MA: ${mitarbeiter}\n`;
  message += `Zeit: ${timestamp}`;

  // Send SMS via Twilio
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
