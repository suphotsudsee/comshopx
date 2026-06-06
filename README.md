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

## Database
After MySQL is running:

```bash
npx prisma migrate dev
```

The initial schema is in `prisma/schema.prisma`.
