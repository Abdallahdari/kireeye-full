# Stayly — Home Rental Platform for Somalia

Stayly is a full-stack home-rental marketplace built for the Somali market. Businesses (landlords and agencies) publish rental listings with photos, tenants browse and contact them, and a super admin moderates accounts, listings, and reports and manages billing. Businesses pay a monthly subscription through **WaafiPay** mobile money (EVC Plus, ZAAD, SAHAL).

The UI is available in **English and Somali**, and the app validates Somali phone numbers and recognizes Somali cities and mobile carriers (e.g. Hormuud).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Billing Model](#billing-model)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Option A — Run with Docker Compose](#option-a--run-with-docker-compose)
  - [Option B — Run Locally (without Docker)](#option-b--run-locally-without-docker)
  - [Create the Super Admin](#create-the-super-admin)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Security](#security)
- [Available Scripts](#available-scripts)

---

## Features

### For tenants
- Browse published listings and filter by city, neighborhood, price range, and minimum number of rooms
- View listing details with photos, rent, deposit, rooms, and bathrooms, plus the poster's name and phone
- Report a user or a specific listing (scam, harassment, fake listing, etc.)

### For businesses
- Register as a business (a super admin must approve the account)
- Create listings with 1–8 images (JPEG/PNG/WebP, 5 MB each)
- Manage their own listings from a business dashboard
- See their billing status and free-listing allowance, and pay the subscription with mobile money

### For the super admin
- Overview dashboard with stats and charts
- Approve or reject business accounts
- Manage users: activate/suspend accounts and change roles
- View and moderate every listing, with search by poster name/email/phone and by mobile provider
- Review and resolve user reports
- Billing dashboard showing every business's status (FREE / PAID / UNPAID) and the amount paid
- Record off-app payments (cash, bank transfer)
- Export listings and billing data to **Excel (.xlsx)**
- Every sensitive action is written to an **audit log**

### Platform
- Email verification and password reset, sent by Gmail SMTP (in development, emails are logged to the console instead)
- Bilingual UI (English / Somali) with a language switcher
- Interactive API docs (Swagger UI)
- Dockerized, with a single `docker compose up`

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | [Next.js 16](https://nextjs.org) (App Router, Server Components), React 19, TypeScript, Tailwind CSS v4, lucide-react icons |
| **Backend** | Node.js 20, Express 4, TypeScript |
| **Database** | MongoDB with Mongoose 8 (local or MongoDB Atlas) |
| **Auth** | JWT in HTTP-only cookies, bcrypt password hashing |
| **Validation** | Zod |
| **File uploads** | Multer (images stored on disk) |
| **Email** | Nodemailer (Gmail SMTP) |
| **Payments** | WaafiPay API (EVC Plus / ZAAD / SAHAL) |
| **Excel export** | ExcelJS |
| **API docs** | swagger-jsdoc + swagger-ui-express |
| **Security** | Helmet, CORS, express-rate-limit |
| **Testing** | Vitest |
| **DevOps** | Docker (multi-stage builds), Docker Compose |

---

## Architecture

```
┌──────────────┐        ┌───────────────────────────┐        ┌────────────────────┐        ┌───────────┐
│   Browser    │ ─────▶ │  Frontend (Next.js :3000) │ ─────▶ │ Backend (Express   │ ─────▶ │  MongoDB  │
│              │  /api/*│  - pages & dashboards     │rewrite │  :5000, /api/*)    │        │  (Atlas)  │
└──────────────┘        │  - proxies /api/* to the  │        │  - auth, listings, │        └───────────┘
                        │    backend                │        │    billing, admin  │ ─────▶ WaafiPay API
                        └───────────────────────────┘        │  - uploads on disk │ ─────▶ Gmail SMTP
                                                             └────────────────────┘
```

- The browser only ever talks to the **frontend's own origin**. Next.js rewrites every `/api/*` request to the backend (`INTERNAL_API_URL`). The backend URL is never exposed to the browser, and the auth cookie stays same-origin.
- Server Components call the backend directly over the internal URL (in Docker this is `http://backend:5000`).
- Uploaded listing images are stored in `UPLOAD_DIR` and served at `/api/uploads/...`. In Docker they sit on a named volume, so they survive rebuilds.

---

## Project Structure

```
.
├── docker-compose.yml          # Runs backend + frontend together
├── backend/                    # Express + TypeScript REST API
│   ├── Dockerfile
│   ├── .env.example            # Copy to .env and fill in
│   ├── scripts/
│   │   └── seed-admin.ts       # Creates the SUPER_ADMIN account
│   └── src/
│       ├── server.ts           # Entry point (connects DB, starts server)
│       ├── app.ts              # Express app: middleware, /health, /api-docs, routes
│       ├── config/             # env loading/validation, DB connection, Swagger spec
│       ├── routes/             # auth, users, reports, properties, billing
│       ├── controllers/        # HTTP layer: reads the request, calls services
│       ├── services/           # Business logic (auth, billing, WaafiPay, mailer, audit log…)
│       ├── models/             # Mongoose schemas: User, Property, Report, Payment, AuditLog
│       ├── middleware/         # authenticate, requireRole, validate, rateLimit, upload, errorHandler
│       ├── validators/         # Zod schemas for every endpoint
│       ├── utils/              # JWT, cookies, Excel, search, Somali phone/city helpers…
│       └── types/              # Shared enums (Role, AuditAction, BillingStatus…)
└── my-app/                     # Next.js frontend
    ├── Dockerfile
    ├── .env.local.example      # Copy to .env.local
    ├── next.config.ts          # /api/* rewrite to the backend, standalone output
    ├── app/
    │   ├── page.tsx            # Landing page
    │   ├── login/ register/ forgot-password/ reset-password/ verify-email/
    │   ├── properties/         # Public listing browser + listing detail ([id])
    │   └── dashboard/
    │       ├── admin/          # Overview, users, business approvals, listings, reports, billing, profile
    │       ├── business/       # Overview, listings, bookings, billing, profile
    │       └── report/         # Report a user/listing
    ├── components/
    │   ├── dashboard/          # Sidebar, topbar, stat cards, forms, tables per role
    │   ├── ui/                 # Reusable UI primitives (button, input, card, charts, pagination…)
    │   ├── auth-provider.tsx   # Client-side session context
    │   └── language-provider.tsx / language-switcher.tsx  # English ⇄ Somali
    └── lib/
        ├── api-client.ts       # Browser-side fetch helpers
        ├── api-server.ts       # Server Component fetch helpers (forwards the auth cookie)
        ├── i18n/translations.ts
        └── somali-phone.ts, locations.ts, format.ts, types.ts
```

---

## User Roles

| Role | How it is created | What it can do |
|---|---|---|
| **TENANT** | Public registration | Browse listings, report users/listings |
| **BUSINESS** | Public registration, then **approval by the super admin** | Everything a tenant can do, plus create and manage listings and pay the subscription |
| **SUPER_ADMIN** | **Only** by the seed script (`npm run seed:admin`) | Full admin panel: users, approvals, listings, reports, billing, exports |

A business account starts as `PENDING`. It can publish listings only after an admin sets it to `APPROVED`. Suspended accounts (`isActive = false`) can't log in, and their listings are hidden from the public site.

---

## Billing Model

- Every business gets **`FREE_LISTING_LIMIT` free listings** (default: 5, over the lifetime of the account).
- To publish more, the business needs an **active monthly subscription** (`SUBSCRIPTION_PRICE_USD`, default: $10/month).
- Billing statuses:
  - **FREE**: still within the free allowance
  - **PAID**: subscription active (paid until a future date)
  - **UNPAID**: free allowance used up and no active subscription. The business can't publish, and its listings beyond the free ones are hidden from the public.
- **Paying online:** the business enters their phone number, and the backend starts a WaafiPay request and returns `202` with a `PENDING` payment. The customer approves on their phone, and the frontend polls `GET /api/billing/payments/:id` until the payment is `SUCCEEDED` or `FAILED`.
- **Paying offline:** the super admin can record a cash or bank payment, which adds one month.
- `WAAFI_MODE=mock` simulates instant successful payments for development. Mock mode is refused when `NODE_ENV=production`.

---

## Getting Started

### Prerequisites

- **Node.js 20+** and npm
- **MongoDB**: a local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **Docker Desktop** (only for Option A)

Clone the repository:

```bash
git clone https://github.com/Abdallahdari/kireeye-full.git
cd kireeye-full
```

### Option A — Run with Docker Compose

1. Create the backend environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Then edit `backend/.env`. At minimum, set `MONGODB_URI` (e.g. your Atlas connection string) and a long random `JWT_SECRET`.

2. Build and start both services:
   ```bash
   docker compose up --build
   ```

3. Open:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - API docs (Swagger): http://localhost:5000/api-docs
   - Health check: http://localhost:5000/health

> **Note:** in Docker, `mongodb://localhost:27017` points to the container itself, not your machine. Use MongoDB Atlas, or `mongodb://host.docker.internal:27017/home-rental` for a MongoDB running on your host.

### Option B — Run Locally (without Docker)

**Backend**

```bash
cd backend
cp .env.example .env        # then edit MONGODB_URI, JWT_SECRET, etc.
npm install
npm run dev                 # starts on http://localhost:5000 with hot reload
```

**Frontend** (in a second terminal)

```bash
cd my-app
cp .env.local.example .env.local   # INTERNAL_API_URL=http://localhost:5000
npm install
npm run dev                         # starts on http://localhost:3000
```

### Create the Super Admin

Public registration can't create admin accounts. Set the `SUPER_ADMIN_*` variables in `backend/.env`, then run:

```bash
cd backend
npm run seed:admin
```

Log in at http://localhost:3000/login with that email and password to open the admin dashboard.

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Description | Example / Default |
|---|---|---|
| `NODE_ENV` | `development` or `production` | `development` |
| `PORT` | API port | `5000` |
| `CLIENT_URL` | Frontend origin (CORS and links in emails) | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/home-rental` |
| `JWT_SECRET` | Secret used to sign JWTs. Use a long random value. | — |
| `JWT_EXPIRES_IN` | Session lifetime | `7d` |
| `COOKIE_NAME` | Name of the auth cookie | `token` |
| `SUPER_ADMIN_FIRST_NAME` / `_LAST_NAME` / `_EMAIL` / `_PASSWORD` / `_PHONE` | Used only by `npm run seed:admin` | — |
| `UPLOAD_DIR` | Folder for listing images | `uploads` |
| `AUTH_RATE_LIMIT_WINDOW_MS` | Rate-limit window for auth endpoints | `900000` (15 min) |
| `AUTH_RATE_LIMIT_MAX` | Max auth requests per window | `20` |
| `SMTP_HOST` / `SMTP_PORT` | SMTP server | `smtp.gmail.com` / `465` |
| `SMTP_USER` / `SMTP_PASS` | Gmail address and a 16-character **App Password**. Leave empty to log emails to the console. | — |
| `EMAIL_FROM` | Sender shown in emails | `Stayly <you@gmail.com>` |
| `FREE_LISTING_LIMIT` | Free listings per business | `5` |
| `SUBSCRIPTION_PRICE_USD` | Monthly subscription price | `10` |
| `WAAFI_MODE` | `live`, `sandbox`, or `mock` | `mock` in development |
| `WAAFI_MERCHANT_UID` / `WAAFI_API_USER_ID` / `WAAFI_API_KEY` | WaafiPay credentials (from merchant.waafipay.com) | — |
| `WAAFI_API_URL` | Optional override of the WaafiPay endpoint | live/sandbox default |

### Frontend — `my-app/.env.local`

| Variable | Description | Example |
|---|---|---|
| `INTERNAL_API_URL` | Server-to-server backend URL (never sent to the browser) | `http://localhost:5000` locally, `http://backend:5000` in Docker |

> ⚠️ Never commit `.env` or `.env.local`. They are ignored by `.gitignore`; only the `*.example` files are committed.

---

## API Reference

All endpoints are under `/api`. Full interactive documentation, with request and response schemas, is available at **`/api-docs`** when the backend is running, and the raw OpenAPI JSON is at `/api-docs.json`.

### Auth — `/api/auth`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a TENANT or BUSINESS account (sends a verification email) |
| POST | `/login` | Public | Log in; sets an HTTP-only JWT cookie |
| POST | `/logout` | Authenticated | Clear the session cookie |
| GET | `/me` | Authenticated | Current user's profile |
| POST | `/forgot-password` | Public | Email a password-reset link (token valid for 1 hour) |
| POST | `/reset-password` | Public | Reset the password with a token |
| POST | `/verify-email` | Public | Verify an email address (token valid for 24 hours) |
| POST | `/resend-verification` | Public | Resend the verification email |

### Properties — `/api/properties`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List published listings (filters: `city`, `neighborhood`, `minPrice`, `maxPrice`, `minRooms`, `page`, `limit`) |
| GET | `/:id` | Public | Listing details with the poster's name and phone |
| POST | `/` | Approved BUSINESS | Create a listing (multipart form with 1–8 images). Returns `402` if the business must pay first. |
| GET | `/mine` | BUSINESS | The business's own listings |
| DELETE | `/:id` | Owner / SUPER_ADMIN | Delete a listing |
| GET | `/all` | SUPER_ADMIN | Every listing, with search (`q`) and a mobile-provider filter (`provider`) |
| GET | `/export` | SUPER_ADMIN | Download listings as Excel (audited) |

### Billing — `/api/billing`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/me` | BUSINESS | Billing status, free allowance, and payment history |
| POST | `/payments` | BUSINESS | Start a one-month subscription payment via WaafiPay |
| GET | `/payments/:id` | BUSINESS | Check a payment's status (`PENDING` / `SUCCEEDED` / `FAILED`) |
| GET | `/businesses` | SUPER_ADMIN | All businesses with billing status and totals |
| GET | `/businesses/export` | SUPER_ADMIN | Download businesses and payments as Excel |
| POST | `/businesses/:id/payments` | SUPER_ADMIN | Record an offline payment (adds one month) |

### Users — `/api/users` (SUPER_ADMIN only)
| Method | Path | Description |
|---|---|---|
| GET | `/` | List users (with filters) |
| GET | `/:id` | Get one user |
| PATCH | `/:id/status` | Activate or suspend a user |
| PATCH | `/:id/role` | Change a user's role |
| PATCH | `/:id/business-approval` | Approve or reject a BUSINESS account |

### Reports — `/api/reports`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/` | Authenticated | Report a user or listing (`SCAM_OR_FRAUD`, `HARASSMENT`, `SUSPICIOUS_ACTIVITY`, `FAKE_LISTING`, `OTHER`) |
| GET | `/` | SUPER_ADMIN | List reports |
| PATCH | `/:id/status` | SUPER_ADMIN | Update a report's status |

### Other
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check (used by the Docker `HEALTHCHECK`) |
| GET | `/api-docs` | Swagger UI |
| GET | `/api/uploads/...` | Uploaded listing images |

---

## Data Models

| Model | Key fields |
|---|---|
| **User** | `firstName`, `lastName`, `email`, `phone`, `city`, `role`, `businessApproval`, `isEmailVerified`, `isActive`, `listingsPublishedCount`, `subscriptionPaidUntil`, `lastLoginAt`, plus hashed tokens for email verification and password reset |
| **Property** | `owner`, `city`, `neighborhood`, `description`, `phone`, `rooms`, `bathrooms`, `price` (USD/month), `deposit`, `images[]`, `billingHidden` |
| **Payment** | `user`, `amount`, `currency`, `method`, `status`, `phone`, `periodStart`, `periodEnd`, `transactionId`, `recordedBy`, `note`, `completedAt` |
| **Report** | `reporter`, `reportedUser`, `property`, `reason`, `details`, `status` |
| **AuditLog** | `actor`, `action`, `targetUser`, `ip`, `userAgent`, `metadata` |

---

## Security

- Passwords are hashed with **bcrypt** and never returned by the API (`select: false`).
- The session JWT is stored in an **HTTP-only, SameSite=Lax cookie**, so page scripts can't read it.
- Email-verification and password-reset tokens are **single-use, time-limited, and stored only as hashes**.
- Login and "forgot password" return **generic messages** so they don't reveal whether an email is registered.
- **Rate limiting** protects the auth endpoints.
- **Helmet** sets security headers, and **CORS** only allows `CLIENT_URL`.
- Every request body, query, and URL parameter is validated with **Zod**.
- **Role-based access control** (`requireRole`) protects the admin and business endpoints.
- An **audit log** records logins, role and status changes, approvals, payments, and data exports.
- Docker images run as a **non-root user**.

---

## Available Scripts

### Backend (`backend/`)
| Command | Description |
|---|---|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run seed:admin` | Create the SUPER_ADMIN account |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Run the tests (Vitest) |

### Frontend (`my-app/`)
| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build (standalone output) |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
