
NOWFit Starter Scaffold
======================

What this contains (minimal, functional starting point):
- Node.js + Express server (index.js)
- MongoDB connection (mongoose)
- Redis usage for OTP/refresh-token storage (redis v4)
- EJS views (landing, auth, admin dashboard)
- MVC structure under /app: controllers, routes, models, middlewares, utils
- JWT Access + Refresh token flow (cookies)
- Cloudinary upload helper (usage stub)
- Nodemailer OTP send (usage stub)
- Swagger UI at /api-docs
- Socket.io basic chat for real-time messages

How to run:
1. Copy `.env.example` to `.env` and fill values (MongoDB, Redis, Cloudinary, email).
2. npm install
3. npm run dev
4. Open http://localhost:5000

Notes:
- This is a starter scaffold to be extended. It implements core flows (auth, role check, admin CRUD) with clear naming.
- Tests: minimal Jest example in /tests
- CI: github actions workflow included (.github/workflows/nodejs.yml)
