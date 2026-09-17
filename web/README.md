# Marketly — Web

React 18 + Vite frontend for the Marketly e-commerce app.

## Setup

```
npm install
cp .env.example .env   # if present, otherwise create .env with the vars below
npm run dev
```

Requires the API (`../api`) running and reachable at the URL configured in `.env`:

```
VITE_BASE_URL=http://localhost:4040/api
VITE_IMG_URL=http://localhost:4040/file/images/
VITE_SOCKET_URL=http://localhost:4040
```

## Scripts

- `npm run dev` — start the Vite dev server (default port 3000)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build locally
- `npm start` — serve `dist/` via the bundled Express static server (`server.js`), for production-style hosting
