# To-Do

A personal to-do list backed by a Google Sheet. Single static HTML file, no backend, deploys to GitHub Pages, installable as a PWA.

**Live:** https://danieljurnove-ctrl.github.io/todo/

---

## Features

**Tasks**

- Add, check off, rename in place, and delete tasks (with 6-second undo on delete)
- Three entry types: task (toggleable), event (date-pinned), note
- Categories with deterministic auto-colors and inline "Add new"
- Real due dates with quick chips (Today / Tomorrow / +1 week / +1 month) and a native date picker
- Auto-grouping by date — Overdue / Today / Tomorrow / This Week / Next Week / This Month / Next Month / This Year / Later / No Date — computed live from today's date so groups roll over without manual re-bucketing
- Switchable grouping by category (toolbar toggle)
- Star/priority — starred tasks sort first within each group
- Inline expandable notes per task
- Live search across text, category, and notes, with matches highlighted in `<mark>`
- Filter by category
- Hide-completed toggle
- Review modal for surfacing overdue / no-date open tasks

**Books**

- Separate tab backed by a `books` sheet (auto-created on first sign-in)
- Title, author, started/finished dates, 1-5 star rating, page count, genre, source, notes
- Inline editing of title and all expand-panel fields
- Open Library lookup to autofill page count and other metadata
- Stats sub-view with pages-over-time line chart, year-grouped read list

**UX**

- Sync controls in the header: Refresh button + "synced N min ago" label
- Keyboard shortcuts (press `?` for the full list): `/` focus search, `n` add new, `j`/`k` navigate rows, `s`/`x` star/done, `e` expand, `Esc` close panel
- Focus is preserved across re-renders so editing isn't disrupted
- Save failures show a transient red ring on the failing row with the error in a tooltip, instead of stomping the global status line
- Optimistic updates with rollback on failure; subtle green pulse on the row after a successful save
- Installable as a PWA with offline app-shell (writes still need a live network)

---

## Architecture

```
[ Browser ]
   ↓ Google Sign-In (Google Identity Services, ~1 click/hour)
   ↓ Access token cached in localStorage
   ↓ HTTPS calls to sheets.googleapis.com
[ Your Google Sheet ]   ← also editable by hand in sheets.google.com
```

Single `index.html` file, no build step, no framework. Auth via Google Identity Services (GIS). Data lives in a Google Sheet you own.

---

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The entire app — HTML, CSS, and JS |
| `manifest.json` | PWA metadata for installability |
| `service-worker.js` | Caches the app shell so it loads offline |
| `icon.svg` | App icon (used by manifest and `apple-touch-icon`) |

---

## Sheet schema

Single tab named `tasks`. Recommended (but optional) header row:

| A    | B      | C      | D          | E          | F       | G         |
| ---- | ------ | ------ | ---------- | ---------- | ------- | --------- |
| `id` | `text` | `done` | `category` | `due_date` | `notes` | `starred` |

- `id` — `Date.now()` string set at creation, stable across row reorders
- `done` / `starred` — `TRUE` / `FALSE`
- `due_date` — ISO `YYYY-MM-DD` or empty
- The app reads by column position, not by header text — you can name them anything

---

## Setup (running your own copy)

1. **Google Cloud project** — create one, enable the **Google Sheets API**.
2. **OAuth consent screen** — set type to External, leave it in Testing mode, add your own Gmail as a test user, add scope `https://www.googleapis.com/auth/spreadsheets`.
3. **OAuth client** — type Web Application. Authorized JavaScript origins:
   - `http://localhost:8000` (for local dev)
   - `https://<your-username>.github.io` (for GitHub Pages)
   - No path, no trailing slash.
4. **Sheet** — create one, rename `Sheet1` to `tasks`. Note the Sheet ID from the URL.
5. **Edit `index.html`** — set the constants near the top of `<script>`:
   ```js
   const CLIENT_ID = 'xxx.apps.googleusercontent.com';
   const SHEET_ID  = 'your-sheet-id';
   ```
6. **Host** — push to GitHub Pages, Cloudflare Pages, or anything that serves static files over HTTPS.

The OAuth consent screen can stay in Testing mode indefinitely for personal use (capped at 100 test users you've explicitly added).

---

## Local development

```
python -m http.server 8000
```

Then open `http://localhost:8000`. Use `localhost`, not `127.0.0.1` — they count as different origins for OAuth.

---

## Deploying changes

```
git add index.html
git commit -m "describe the change"
git push
```

GitHub Pages re-deploys in ~30-60s. Hard-refresh on your devices — the service worker will pick up the new shell on the next reload.

---

## Limitations

- **Single user.** The Sheet ID is hardcoded. Supporting multiple users would mean per-user Sheet creation.
- **Token expiry.** Access tokens last ~1 hour. A background timer attempts silent refresh; if that fails (e.g., session revoked elsewhere) one click on Sign In gets another hour.
- **No offline writes.** The app shell loads offline (service worker cache), but reading or writing tasks needs a live network.
- **Date buckets don't auto-promote.** A task dated yesterday shows in Overdue — it isn't auto-rescheduled to today.
- **No bulk operations** (rename a category across all tasks, bulk reschedule, etc.). Edit via the Sheet directly if you need bulk changes.
- **Multi-device.** Editing the Sheet in another tab or by hand while the app is open doesn't auto-sync — hit Refresh in the header to re-pull.

---

## Privacy

Your tasks live in your own Google Sheet. The app makes API calls directly from your browser to `sheets.googleapis.com` using your access token — no third-party server sits in the middle. The hosted page is plain static HTML/JS; it doesn't collect or transmit anything.
