// Weiterleitung eines Website-Leads ins ePower CRM (Supabase Edge Function "import-lead").
// Läuft nur, wenn CRM_WEBHOOK_URL und CRM_WEBHOOK_KEY gesetzt sind. Fehler blockieren nie die SMS.
//
// Umgebungsvariablen (Vercel):
//   CRM_WEBHOOK_URL = https://<projekt>.supabase.co/functions/v1/import-lead
//   CRM_WEBHOOK_KEY = <WEBHOOK_API_KEY der Edge Function>

async function forwardToCrm(lead) {
  const url = process.env.CRM_WEBHOOK_URL;
  const key = process.env.CRM_WEBHOOK_KEY;
  if (!url || !key) {
    console.log('CRM nicht konfiguriert (CRM_WEBHOOK_URL / CRM_WEBHOOK_KEY fehlen)');
    return { ok: false, skipped: true };
  }

  const payload = {
    full_name: `${lead.vorname || ''} ${lead.nachname || ''}`.trim(),
    phone: lead.telefon || '',
    email: lead.email || '',
    company_name: lead.unternehmen || '',
    source: 'website',
    platform: 'website',
    campaign_name: lead.quelle || 'website',
    ad_name: lead.seite || '',
    is_entrepreneur: lead.chef === 'ja' || lead.handwerk === 'ja' ? true : null,
    has_more_than_5_employees: parseMitarbeiter(lead.mitarbeiter),
    additional_info: buildInfo(lead),
    created_at: new Date().toISOString()
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-key': key },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const text = await res.text();
    if (!res.ok) {
      console.error('CRM Fehler:', res.status, text.slice(0, 300));
      return { ok: false, status: res.status };
    }
    console.log('CRM: Lead angelegt');
    return { ok: true };
  } catch (err) {
    console.error('CRM Fehler:', err.message);
    return { ok: false, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

function parseMitarbeiter(v) {
  if (!v) return null;
  const s = String(v).toLowerCase();
  const n = parseInt(s.replace(/[^\d]/g, ''), 10);
  if (!isNaN(n)) return n > 5;
  if (s.includes('mehr') || s.includes('über') || s.includes('+')) return true;
  return null;
}

function buildInfo(l) {
  const parts = [];
  if (l.gf) parts.push(`GF: ${l.gf}`);
  if (l.mitarbeiter) parts.push(`Mitarbeiter: ${l.mitarbeiter}`);
  if (l.handwerk) parts.push(`Handwerksbetrieb: ${l.handwerk}`);
  if (l.chef) parts.push(`Chef: ${l.chef}`);
  if (l.gewerk) parts.push(`Gewerk: ${l.gewerk}`);
  if (l.anrufe) parts.push(`Verpasste Anrufe: ${l.anrufe}`);
  if (l.wunschzeit) parts.push(`Wunschzeit: ${l.wunschzeit}`);
  return parts.join(' | ');
}

module.exports = { forwardToCrm };
