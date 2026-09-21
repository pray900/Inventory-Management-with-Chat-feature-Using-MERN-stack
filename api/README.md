# Marketly API

Express and MongoDB backend. Also hosts the Socket.IO chat server on the same port.

Full documentation lives in the root [README.md](../README.md). A line by line explanation of every file in this folder is in [CODE_WALKTHROUGH.md](../CODE_WALKTHROUGH.md#backend).

## Quick start

```bash
npm install
cp .env.example .env   # set JWT_SECRET at minimum
npm run dev
```

Needs MongoDB reachable at `MONGO_URI`, and the web app running at whatever `CORS_ORIGIN` points to.

Until `SMTP_HOST` is set, password reset and contact emails are logged to the console rather than sent. Both features still work end to end, you just read the link out of the terminal.

## Scripts

`npm run dev` starts with nodemon and restarts on every change. `npm start` runs it once, which is what production uses.
