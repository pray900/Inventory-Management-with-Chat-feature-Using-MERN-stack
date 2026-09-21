# Marketly Web

React 18 and Vite frontend.

Full documentation lives in the root [README.md](../README.md). A line by line explanation of every file in this folder is in [CODE_WALKTHROUGH.md](../CODE_WALKTHROUGH.md#frontend).

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Needs the API running and reachable at the URLs configured in `.env`:

```
VITE_BASE_URL=http://localhost:4040/api
VITE_IMG_URL=http://localhost:4040/file/images/
VITE_SOCKET_URL=http://localhost:4040
```

Mind the trailing slashes. These strings are concatenated directly onto paths, so `VITE_IMG_URL` needs its trailing slash and the other two must not have one. Vite bakes these values into the bundle at build time, so changing one means rebuilding.

## Scripts

`npm run dev` starts the Vite dev server on port 3000. `npm run build` produces the production build in `dist/`. `npm run preview` serves that build locally so you can check it before deploying. `npm start` serves `dist/` through the small Express server in `server.js`, which is only needed on hosts that serve the app from Node. Vercel does not use it.
