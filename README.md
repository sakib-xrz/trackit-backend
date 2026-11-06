# Track It - Smart Personal Finance Management System (Backend API)

Production-grade **Express.js + Prisma ORM + MySQL + JWT** backend tailored specifically for the **Track It** Android Mobile Application.

## Key Architectural Highlights
- **Database Conventions:** Strict `snake_case` column and table naming (`@map` & `@@map`), UUID primary keys (`@id @default(uuid())` — zero auto-increment integers), and composite indexes (`@@index`) for fast query execution.
- **Unified Request/Response Format:** Standardized JSON responses via `sendResponse` utility and request validation using `Zod` (`validateRequest` middleware).
- **Centralized Error Handling:** `globalErrorHandler` catches `ZodError`, `PrismaClientKnownRequestError` (`P2002`, `P2025`, `P2003`), `PrismaClientValidationError`, and custom `ApiError` instances.
- **Role-Based Access (`USER` vs `GUEST`):** Matches the proposal's Use Case Diagram. Guests can log income/expenses, manage budgets, view dashboard reports, and view the spending heatmap, while Registered Users unlock Bills, Subscription Detection, Shared Expense Splitting, and Multi-Currency Conversion.

---

## Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and update your MySQL credentials:
```bash
cp .env.example .env
```

### 3. Run Prisma Migration & Seed Default Categories
```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Interactive Swagger API Documentation
Once the server is running, explore and test the entire API interactively in Swagger UI:
- **Swagger UI:** [http://localhost:8000/api/docs](http://localhost:8000/api/docs) (also available via `/api-docs` and `/docs`)
- **Raw OpenAPI 3.0 Specification:** [http://localhost:8000/api/docs.json](http://localhost:8000/api/docs.json)
- **Offline Spec File:** [swagger.json](./swagger.json) (Ready for Postman / Insomnia / Swagger Editor import)

> **Testing Authenticated Endpoints:**
> 1. In Swagger UI, execute `/api/auth/login`, `/api/auth/register`, or `/api/auth/guest`.
> 2. Copy the returned `access_token`.
> 3. Click the green **Authorize** button at the top right, paste the token, and click **Authorize**.

---

## API Endpoints Overview (`/api`)

| Module | Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Health** | `/api/health` | `GET` | Public | Service health status check |
| **Auth** | `/api/auth/register` | `POST` | Public | Register a new account |
| **Auth** | `/api/auth/login` | `POST` | Public | Login & receive JWT |
| **Auth** | `/api/auth/guest` | `POST` | Public | Create temporary Guest session & JWT |
| **Auth** | `/api/auth/me` | `GET / PATCH` | User / Guest | View or update profile |
| **Categories** | `/api/categories` | `GET / POST` | User / Guest | List or create categories |
| **Categories** | `/api/categories/:id` | `PATCH / DELETE` | User / Guest | Update or delete custom category |
| **Transactions** | `/api/transactions` | `GET / POST` | User / Guest | Record income/expense (auto-syncs budget) |
| **Transactions** | `/api/transactions/:id` | `PATCH / DELETE` | User / Guest | Update or delete transaction |
| **Budgets** | `/api/budgets` | `POST` | User / Guest | Set or update monthly budget (`YYYY-MM`) |
| **Budgets** | `/api/budgets/report` | `GET` | User / Guest | Get monthly budget vs spent report |
| **Reports** | `/api/reports/dashboard` | `GET` | User / Guest | Income, expense, net balance & category chart |
| **Reports** | `/api/reports/spending-heatmap` | `GET` | User / Guest | Daily spending heatmap with intensity `0-4` |
| **Bills** | `/api/bills` | `GET / POST` | User Only | Manage bills & subscription calendar |
| **Bills** | `/api/bills/:id` | `PATCH / DELETE` | User Only | Update or delete bill |
| **Bills** | `/api/bills/detect-subscriptions`| `GET` | User Only | Smart recurring subscription detector |
| **Bills** | `/api/bills/reminders` | `GET` | User Only | Upcoming unpaid bill reminders (next 7 days) |
| **Bills** | `/api/bills/:id/mark-paid` | `PATCH` | User Only | Mark a bill as paid |
| **Splits** | `/api/expense-splits` | `GET / POST` | User Only | Create & list shared expense splits |
| **Splits** | `/api/expense-splits/:id/participants` | `POST` | User Only | Add participant to split |
| **Splits** | `/api/expense-splits/:id/participants/:pId/settle` | `PATCH` | User Only | Settle participant share |
| **Splits** | `/api/expense-splits/:id/settle-up`| `PATCH` | User Only | Settle entire shared expense |
| **Currency** | `/api/currency/rates` | `GET` | User Only | Get live exchange rates |
| **Currency** | `/api/currency/convert` | `GET` | User Only | Convert amount between currencies |
