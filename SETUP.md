# Calendar App Setup

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173

---

## Google Calendar & Contacts Integration

To connect Google Calendar and import contact photos, you need a Google OAuth Client ID.

### Steps

1. Go to https://console.cloud.google.com/
2. Create a new project (or select an existing one)
3. In the left menu go to **APIs & Services → Library**
4. Enable **Google Calendar API**
5. Enable **People API** (for contact photo import)
6. Go to **APIs & Services → OAuth consent screen**
   - Choose **External**
   - Fill in App name and your email
   - Add scopes: `calendar.events` and `contacts.readonly`
   - Add your email as a test user
7. Go to **APIs & Services → Credentials**
   - Click **+ Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins: add `http://localhost:5173` (for dev)
   - For production: add your deployed domain
8. Copy the **Client ID**

### Configure the app

```bash
cp .env.example .env
```

Edit `.env` and replace the placeholder:
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Restart the dev server (`npm run dev`) and click **Connect Google Calendar**.

---

## Features

- **Monthly calendar** — A4 page layout, prints perfectly
- **1"×1" date blocks** — each day has space for event dots and notes
- **Birthday strip** — faces of people with birthdays this month appear at the top
- **Google Calendar sync** — events from your Google Calendar appear automatically
- **Birthday & Anniversary contacts** — stored locally with photos
- **WhatsApp & Call** — click any event with a phone number to open WhatsApp or dial
- **Day notes** — type notes on screen; printed version shows ruled lines for handwriting
- **Monthly notes** — note section at the bottom of each printed page
- **Print** — click the Print button for a clean A4 printout (browser print dialog)

## Printing

Click the **Print** button in the top-right corner. Set your browser's print settings to:
- Paper size: A4
- Margins: None (the app handles its own 10mm margins)
- Scale: 100%

All navigation buttons, modals, and the Google sign-in UI are hidden on print automatically.
