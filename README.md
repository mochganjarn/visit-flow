# VisitFlow — Aplikasi Manajemen Rencana Kunjungan (Monorepo)

Aplikasi manajemen rencana kunjungan berbasis **NestJS** (Backend API + TypeORM + Raw SQL Queries) dan **Next.js App Router** (Frontend + Tailwind CSS) dengan **Role-Based Access Control (RBAC)** (`admin` & `sales`). 100% AI saya hanya membuat context seperti arsitektur, skema db, dan flow logic aplikasi dan mereview hasilnya, alasan penggunaan stack pada project ini adalah karena ekosistemnya sudah matang dan lebih mudah di maintain karena sudah terdokumentasi dan scalable.

## Struktur Monorepo

```text
VisitFlow/
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── nest-cli.json
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── entities/
│       │   ├── user.entity.ts
│       │   ├── role.entity.ts
│       │   ├── user-role.entity.ts
│       │   ├── master-entity.entity.ts
│       │   └── rencana-kunjungan.entity.ts
│       ├── database/
│       │   └── seeder.service.ts
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── jwt.strategy.ts
│       │   └── jwt-auth.guard.ts
│       └── rencana-kunjungan/
│           ├── rencana-kunjungan.module.ts
│           ├── rencana-kunjungan.controller.ts
│           └── rencana-kunjungan.service.ts
└── frontend/
    ├── .env.local
    ├── next.config.mjs
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── src/
        ├── middleware.ts
        └── app/
            ├── globals.css
            ├── layout.tsx
            ├── page.tsx
            ├── login/
            │   └── page.tsx
            └── pengunjung/
                ├── page.tsx
                └── tambah/
                    └── page.tsx
```

## Cara Menjalankan Project

### 1. Persiapan Database PostgreSQL

Buat database baru di PostgreSQL dengan nama `visitflow_db`:

```sql
CREATE DATABASE visitflow_db;
```

### 2. Jalankan Backend (NestJS - Port 3001)

```bash
cd backend
npm install
# Sesuaikan konfigurasi database di file .env
npm run start:dev
```

Saat pertama kali dijalankan:

- `TypeOrmModule.forRoot({ synchronize: true })` akan otomatis membuat ke-5 tabel (`"user"`, `roles`, `user_role`, `entity`, `rencana_kunjungan`).
- `SeederService` akan otomatis mengeksekusi Raw SQL query (`DataSource.query`) untuk mengisi role (`admin`, `sales`), 3 user (`admin1`, `sales1`, `sales2` dengan password `password123`), relasi `user_role`, dan 3 data `entity` awal.

### 3. Jalankan Frontend (Next.js - Port 3000)

Buka terminal baru:

```bash
cd frontend
npm install
npm run dev
```

Akses aplikasi di `http://localhost:3000`.
