const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Twilio config from environment variables
const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH;
const TWILIO_FROM = process.env.TWILIO_FROM;       // Your Twilio phone number, e.g. +1234567890
const NOTIFY_PHONE = process.env.NOTIFY_PHONE;     // Your phone number to receive SMS, e.g. +43...

let twilioClient = null;
if (TWILIO_SID && TWILIO_AUTH) {
  const twilio = require('twilio');
  twilioClient = twilio(TWILIO_SID, TWILIO_AUTH);
  console.log('Twilio configured.');
} else {
  console.log('Twilio not configured. Set TWILIO_SID, TWILIO_AUTH, TWILIO_FROM, NOTIFY_PHONE.');
}

// Lead endpoint
app.post('/api/lead', async (req, res) => {
  const { vorname, nachname, unternehmen, telefon, quelle, gf, mitarbeiter, wunschzeit, chef, gewerk, anrufe, handwerk } = req.body;

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

  console.log('--- NEUER LEAD ---');
  console.log(message);
  console.log('------------------');

  // Send SMS via Twilio
  if (twilioClient && TWILIO_FROM && NOTIFY_PHONE) {
    try {
      await twilioClient.messages.create({
        body: message,
        from: TWILIO_FROM,
        to: NOTIFY_PHONE
      });
      console.log('SMS gesendet an', NOTIFY_PHONE);
    } catch (err) {
      console.error('SMS Fehler:', err.message);
    }
  }

  res.json({ ok: true });
});

// Bewerbung endpoint (Karriere-Seite)
app.post('/api/bewerbung', async (req, res) => {
  const { stelle, vorname, nachname, email, telefon, nachricht, link } = req.body;
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

  console.log('--- NEUE BEWERBUNG ---');
  console.log(message);
  console.log('----------------------');

  if (twilioClient && TWILIO_FROM && NOTIFY_PHONE) {
    try {
      await twilioClient.messages.create({ body: message, from: TWILIO_FROM, to: NOTIFY_PHONE });
      console.log('SMS gesendet an', NOTIFY_PHONE);
    } catch (err) {
      console.error('SMS Fehler:', err.message);
    }
  }
  res.json({ ok: true });
});

// Fallback: serve index.html for unknown routes
app.get('*', (req, res) => {
  // Handle /youtube route
  if (req.path === '/youtube') {
    return res.sendFile(path.join(__dirname, 'youtube.html'));
  }
  if (req.path === '/ki-assistent' || req.path === '/ki-telefon') {
    return res.sendFile(path.join(__dirname, 'ki-assistent.html'));
  }
  if (req.path === '/job-software-ki') {
    return res.sendFile(path.join(__dirname, 'job-software-ki.html'));
  }
  if (req.path === '/karriere') {
    return res.sendFile(path.join(__dirname, 'karriere.html'));
  }
  if (req.path === '/termin') {
    return res.sendFile(path.join(__dirname, 'termin.html'));
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
