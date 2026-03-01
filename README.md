<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GlobalFood — Full-Stack Take-Home Challenge

A full-stack food-ordering management platform built with **React**, **GraphQL (Apollo)**, **Prisma**, **SQLite**, and **Tailwind CSS v4**. It demonstrates Role-Based Access Control (RBAC) and Resource-Based Access Control (ReBAC) across two countries (India & America).

---

## Features

- 🔐 **Authentication** — JWT-based login & registration
- 🌍 **Multi-country isolation** — Users only see restaurants and orders in their country
- 👤 **RBAC** — Three roles: `ADMIN`, `MANAGER`, `MEMBER`
  - **Admin**: Full access including payment methods
  - **Manager**: Can checkout / cancel orders; sees all country orders
  - **Member**: Can browse & create orders; sees only their own orders
- 🍽️ **Restaurants** — Browse and search restaurants; add items to cart
- 📦 **Orders** — Create, view, checkout, and cancel orders
- 💳 **Payment Methods** — Admin-only management

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, React Router v7, Apollo Client |
| Backend | Node.js, Express, Apollo Server (GraphQL) |
| Database | SQLite via Prisma ORM |
| Styling | Tailwind CSS v4 |
| Auth | JWT + bcrypt |
| Dev Server | Vite + tsx |

---

## Run Locally

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

3. **Seed the database** (creates countries, users, restaurants & menu items):
   ```bash
   npx tsx prisma/seed.ts
   ```

4. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```
   Set `JWT_SECRET` to a secure random string (optional — defaults to a dev value).

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

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
- `restaurants` — Restaurants in the user's country
- `restaurant(id)` — Single restaurant with menu
- `orders` — Orders (admin/manager: all country orders; member: own orders)
- `paymentMethods` — Admin only

### Mutations
- `login(email, password)` — Returns JWT token
- `register(email, password, role, countryId)` — Creates account, returns JWT token
- `createOrder(restaurantId, items)` — Place an order
- `checkoutOrder(orderId)` — Admin/Manager only
- `cancelOrder(orderId)` — Admin/Manager only
- `addPaymentMethod(type, lastFour)` — Admin only
