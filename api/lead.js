const twilio = require('twilio');
const { forwardToCrm } = require('./_crm');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const { vorname, nachname, unternehmen, telefon, quelle, gf, mitarbeiter, handwerk, chef, gewerk, anrufe, wunschzeit } = body;

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
  if (handwerk) message += `Handwerksbetrieb: ${handwerk}\n`;
  if (chef) message += `Chef: ${chef}\n`;
  if (gewerk) message += `Gewerk: ${gewerk}\n`;
  if (anrufe) message += `Verpasste Anrufe: ${anrufe}\n`;
  if (wunschzeit) message += `Wunschzeit: ${wunschzeit}\n`;
  message += `Zeit: ${timestamp}`;

  // SMS und CRM parallel, keines blockiert das andere
  const sms = (async () => {
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
  })();

  const crm = forwardToCrm(body);

  await Promise.all([sms, crm]);

  return res.status(200).json({ ok: true });
};
