# Karachi Weather

Live weather and 5-day forecast for Karachi's major areas — Clifton, DHA,
Saddar, Gulshan-e-Iqbal, North Nazimabad, and more. Built with Node.js
(Express) on the backend and vanilla HTML/CSS/JS on the frontend, using the
free [Open-Meteo](https://open-meteo.com) API (no API key needed).

## How it's structured

```
karachi-weather/
├── server.js        Express server: serves the frontend + /api routes
├── package.json
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js        Calls our own /api endpoints (never Open-Meteo directly)
└── README.md
```

The list of areas and their coordinates live in `server.js` (`AREAS` array) —
edit that array to add, remove, or rename areas.

## Run locally

Requires Node.js 18 or newer (for built-in `fetch`).

```bash
npm install
npm start
```

Then open http://localhost:3000.

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Karachi weather app"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 2. Deploy on Cloudways

Cloudways runs Node.js apps as a "Custom App" (Node.js stack). Steps:

1. **Launch a Node.js server** — In the Cloudways console: *Servers → Launch*,
   pick any provider/size, and choose the **Node.js** application stack when
   creating the app (name it e.g. `karachi-weather`).
2. **Connect your GitHub repo** — Open the app → **Deployment via Git** tab.
   Authorize GitHub, select your repository and the `main` branch, and set
   the deploy path to the app's root (Cloudways points this at
   `public_html` / the app folder automatically).
3. **Set the start command** — In the app's **Application Settings**, make
   sure the start command is:
   ```
   npm install && npm start
   ```
   (Some Cloudways Node images run `npm install` automatically on deploy —
   if so you only need `npm start` / `node server.js`.)
4. **Set the port** — Cloudways typically expects the app to read the port
   from `process.env.PORT`, which `server.js` already does. Confirm the port
   Cloudways assigns matches what's shown in the app's **Application URL**
   settings.
5. **Deploy** — Click **Pull & Deploy** (or it will trigger automatically on
   push, if you enable auto-deploy). Cloudways pulls the repo, installs
   dependencies, and starts the app.
6. **Point your domain** — Under **Domain Management**, add your domain and
   issue an SSL certificate (Cloudways provides free Let's Encrypt certs).

After that, every `git push` to `main` can redeploy automatically if you
enable auto-deployment on the Git tab, or you can trigger **Pull & Deploy**
manually from the Cloudways dashboard.

## Notes

- No API keys, secrets, or `.env` file are required — Open-Meteo's forecast
  endpoint is free and unauthenticated.
- If Cloudways' Node.js stack sits behind Apache/Nginx (common on their
  setup), it proxies to whatever port your app listens on — just make sure
  `server.js`'s `PORT` matches the "Application Port" configured in the
  Cloudways app settings.
