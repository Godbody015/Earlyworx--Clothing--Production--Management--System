# Earlyworx 769 · Production Board

A lightweight job tracker for the Earlyworx 769 workshop: Embroidery, Sublimation, DTF, Sewing and Manufacturing.
Add jobs, track status (Pending → In Progress → Done → Delivered), search, filter by department, and export to CSV.

No build step, no dependencies. Jobs are stored in the browser's localStorage.

## Structure

```
earlyworx-769/
├── index.html         # page markup + dialogs
├── wrangler.json      # Cloudflare Workers config
├── css/
│   └── styles.css     # theme (light/dark), layout, cards
├── js/
│   ├── config.js      # departments, statuses, storage key
│   ├── utils.js       # helpers: $, esc, money, dates, uid
│   ├── storage.js     # load / save / seed sample jobs
│   └── app.js         # render, events, form, CSV export
└── README.md


Scripts load in the order listed in `index.html` (config → utils → storage → app).

## Run locally
Open `index.html` in a browser.

## Deploy (GitHub Pages)
Repo → Settings → Pages → Source: **GitHub Actions**. Every push to `main` deploys.

## Roadmap ideas
- [ ] Customer/phone fields and WhatsApp "ready for collection" link
- [ ] Deposit paid / balance owing
- [ ] Per-department due-date view
- [ ] Import CSV
- [ ] Cloud sync (Supabase/Firebase) so jobs work across devices

