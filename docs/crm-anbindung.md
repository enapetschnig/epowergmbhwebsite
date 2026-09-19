# Website-Leads ins ePower CRM

Die Website (epowergmbh.at) schickt jeden Lead aus den Formularen (Quiz, Termin, KI-Telefon)
zusätzlich zur SMS an die Supabase Edge Function `import-lead` des CRM
(Projekt `xyhgckqxowqnzjtoblfs`, Ordner `~/Developer/epower-cockpit/crm-app`).

## Was die Website sendet

`POST https://xyhgckqxowqnzjtoblfs.supabase.co/functions/v1/import-lead`
Header: `Content-Type: application/json`, `x-webhook-key: <CRM_WEBHOOK_KEY>`

```json
{
  "full_name": "Max Muster",
  "phone": "+43 660 1234567",
  "email": "max@muster.at",
  "company_name": "Muster Holzbau GmbH",
  "source": "website",
  "platform": "website",
  "campaign_name": "quiz",
  "ad_name": "",
  "is_entrepreneur": true,
  "has_more_than_5_employees": true,
  "additional_info": "Mitarbeiter: 10-20 | Chef: ja | Gewerk: Holzbau",
  "created_at": "2026-09-19T06:35:21.182Z"
}
```

`campaign_name` enthält die Quelle des Formulars: `quiz`, `termin-ki-assistent` oder `website`.
`is_entrepreneur` und `has_more_than_5_employees` sind `null`, wenn die Website es nicht weiß.
`email` kann leer sein.

## Umgebungsvariablen auf Vercel (Website)

| Variable | Wert |
|---|---|
| `CRM_WEBHOOK_URL` | `https://xyhgckqxowqnzjtoblfs.supabase.co/functions/v1/import-lead` |
| `CRM_WEBHOOK_KEY` | derselbe Wert wie `WEBHOOK_API_KEY` in den Secrets der Edge Function |

Ohne diese beiden Variablen schickt die Website nur die SMS, der CRM-Teil wird übersprungen.

## Code auf der Website

- `api/_crm.js`: baut den Payload und schickt ihn mit 6 Sekunden Timeout.
- `api/lead.js` und `server.js`: rufen SMS und CRM parallel auf, ein Fehler im CRM blockiert nie die SMS.
