# Marketly

A full-stack (MERN) multi-vendor e-commerce marketplace. Vendors register, list and manage products with images, and buyers browse, search, and review them, plus real-time chat, notifications, password reset by email, and an admin panel.

## Tech stack

**Backend (`/api`)** — Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt, Multer (uploads), Socket.IO (chat), Nodemailer (email), Helmet, express-validator.

**Frontend (`/web`)** — React 18, Vite, React Router 6, Redux Toolkit, Axios, Bootstrap (Sass theme), Socket.IO client.

## Features

- JWT authentication — register, login, forgot/reset password via email
- Role-based access (admin / vendor) with per-resource ownership checks
- Product CRUD with image upload, search, filtering, and pagination
- Product reviews and ratings
- Real-time one-to-one chat between users
- Notifications (e.g. when your product is reviewed)
- Admin panel to manage users' roles and status
- Account settings and a contact form

## Getting started

You'll need Node.js and a MongoDB instance (local or Docker).

```bash
# 1. Backend
cd api
npm install
cp .env.example .env        # then set JWT_SECRET, MONGO_URI, and SMTP_* values
npm run dev                 # http://localhost:4040

# 2. Frontend (separate terminal)
cd web
npm install
cp .env.example .env        # defaults point at the local API
npm run dev                 # http://localhost:3000
```

## Project structure

```
api/    Express REST API + Socket.IO
web/    React single-page app (Vite)
```

See `api/README.md` and `web/README.md` for details on each.
