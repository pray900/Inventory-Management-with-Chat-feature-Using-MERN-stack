# Marketly — API

Express + MongoDB backend. Also hosts a Socket.IO server (chat) on the same port.

## Setup

```
npm install
cp .env.example .env   # fill in JWT_SECRET at minimum; SMTP_* to send real email
npm run dev
```

Requires MongoDB reachable at `MONGO_URI` (see `.env.example`), and the web app (`../web`) running at `CORS_ORIGIN`/`FRONTEND_URL`.

Until `SMTP_HOST` is set, password-reset and contact emails are logged to the console instead of sent — the rest of those features work as normal.

## Scripts

- `npm run dev` — start with nodemon (auto-restart on change)
- `npm start` — start once, no auto-restart
