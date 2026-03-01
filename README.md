# GlobalFood — Full-Stack Take-Home Challenge

A full-stack food-ordering management platform built with **React**, **GraphQL (Apollo)**, **Prisma**, **SQLite**, and **Tailwind CSS v4**. It demonstrates Role-Based Access Control (RBAC) and Resource-Based Access Control (ReBAC) across two countries (India & America).

---

## Features

- 🔐 **Authentication** — JWT-based login & registration with input validation
- 🌍 **Multi-country isolation** — Enforced at Prisma query level; users only see restaurants and orders in their country
- 👤 **Policy-based RBAC** — Three roles: `ADMIN`, `MANAGER`, `MEMBER`
  - **Admin**: Full access including payment methods and audit logs
  - **Manager**: Can checkout orders; sees all country orders; cannot modify Admin data
  - **Member**: Can browse & create orders, cancel own orders; sees only their own orders
- 🍽️ **Restaurants** — Browse and search restaurants with pagination; add items to cart
- 📦 **Orders** — Create, view, checkout, and cancel orders with status filtering
- 💳 **Payment Methods** — Admin-only management
- 🗂️ **Audit Logs** — Admin-only audit trail of all order actions
- 🔒 **Soft Delete** — Orders can be soft-deleted (Admin only) without data loss
- 🛡️ **Rate Limiting** — API rate limiting (200 req/15min) and auth rate limiting (20 req/15min)
- 🌐 **CORS** — Configurable allowed origins
- 📊 **Logging** — Structured request and application logging
- 🐳 **Docker** — Dockerfile and docker-compose for containerized deployment
- 🧪 **Tests** — Unit tests for permission guards and input validation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, React Router v7, Apollo Client |
| Backend | Node.js, Express, Apollo Server (GraphQL) |
| Database | SQLite via Prisma ORM |
| Styling | Tailwind CSS v4 |
| Animations | Motion (Framer Motion) |
| Auth | JWT + bcrypt |
| Dev Server | Vite + tsx |
| Testing | Vitest |
| Security | express-rate-limit, cors, morgan |

---

## Project Structure

```
├── server.ts               # Express + Apollo Server entry point
├── src/
│   ├── graphql/
│   │   ├── schema.ts       # GraphQL type definitions
│   │   └── resolvers.ts    # Query & mutation resolvers with access control
│   ├── lib/
│   │   ├── auth.ts         # JWT helpers (sign, verify, hash)
│   │   ├── permissions.ts  # RBAC/ReBAC guard functions
│   │   ├── validation.ts   # Input validation helpers
│   │   ├── prisma.ts       # Prisma client singleton
│   │   ├── apollo.ts       # Apollo Client (frontend)
│   │   └── logger.ts       # Structured logger
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Restaurants.tsx
│   │   ├── RestaurantDetail.tsx
│   │   └── Orders.tsx
│   ├── components/
│   │   ├── Layout.tsx      # App shell with sidebar nav
│   │   └── Toast.tsx       # Toast notification system
│   └── App.tsx             # Router & auth context
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeder
├── tests/
│   ├── permissions.test.ts
│   └── validation.test.ts
├── Dockerfile
└── docker-compose.yml
```

---

## Run Locally

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Copy and configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `JWT_SECRET` to a secure random string (e.g. `openssl rand -hex 32`).

3. **Run Prisma migrations and generate client:**
   ```bash
   npx prisma migrate dev
   ```

4. **Seed the database** (creates countries, users, restaurants & menu items):
   ```bash
   npx tsx prisma/seed.ts
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Run with Docker

```bash
docker-compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Run Tests

```bash
npm test
```

---

## Test Credentials

All seeded passwords are `password123`.

| Country | Email | Role |
|---------|-------|------|
| India | admin.in@example.com | ADMIN |
| India | manager.in@example.com | MANAGER |
| India | member.in@example.com | MEMBER |
| America | admin.us@example.com | ADMIN |
| America | manager.us@example.com | MANAGER |
| America | member.us@example.com | MEMBER |

You can also create a new account via the **Sign Up** page.

---

## GraphQL API

The GraphQL playground is available at `/graphql` in development.

### Queries
- `me` — Current authenticated user
- `countries` — List all available countries
- `restaurants(page, pageSize)` — Paginated restaurants in the user's country
- `restaurant(id)` — Single restaurant with menu (country-isolated)
- `orders(status)` — Orders with optional status filter (admin/manager: all country orders; member: own orders)
- `paymentMethods` — Admin only
- `auditLogs` — Admin only — last 100 actions in country

### Mutations
- `login(email, password)` — Returns JWT token
- `register(email, password, role, countryId)` — Creates account, returns JWT token
- `createOrder(restaurantId, items)` — Place an order
- `checkoutOrder(orderId)` — Admin/Manager only
- `cancelOrder(orderId)` — Members can cancel own; Admin/Manager can cancel any in country
- `addPaymentMethod(type, lastFour)` — Admin only
- `softDeleteOrder(orderId)` — Admin only; soft-deletes an order

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for signing JWTs | `super-secret-key` (dev only) |
| `PORT` | Server port | `3000` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000,http://localhost:5173` |
| `LOG_LEVEL` | Logging level (`debug`, `info`, `warn`, `error`) | `info` |

