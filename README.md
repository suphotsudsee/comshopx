# ComShopX

All-in-one computer store management system for POS, document workflow, customer management, and Serial Number-based inventory.

## Included
- `prd.md` - Product Requirements Document
- `design.md` - System Design Document
- Next.js App Router scaffold
- Prisma schema for MySQL
- Docker Compose for app, MySQL, and Redis
- Dashboard UI prototype with POS, documents, inventory, and customer panels

## Quick Start
```bash
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

Open `http://localhost:3000`.

## Docker
```bash
docker compose up -d --build
```

The production container runs:

```bash
prisma migrate deploy && npm run db:seed && node server.js
```

Default seeded admin:

- Email: `suphotsudsee@gmail.com`
- Password: `admin1234`

Set `ADMIN_PASSWORD` in Coolify to override the seeded password before first deploy.

## Database
After MySQL is running:

```bash
npx prisma migrate dev
```

The initial schema is in `prisma/schema.prisma`.

## Admin

- `/admin/login` - sign in
- `/admin` - dashboard
- `/admin/pos` - POS sale transaction with stock and Serial Number updates
- `/admin/documents` - quotations, delivery notes, receipts, tax invoices
- `/admin/inventory` - products, receiving, Serial Number status
- `/admin/customers` - CRM
- `/admin/reports` - inventory and document reports
- `/admin/settings` - users and RBAC
