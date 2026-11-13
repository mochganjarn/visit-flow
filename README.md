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
    ├── jest.config.js
    ├── jest.setup.ts
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
                ├── __tests__/
                │   └── page.test.tsx
                └── tambah/
                    ├── page.tsx
                    └── __tests__/
                        └── page.test.tsx
```

## Fitur Aplikasi

1. **Autentikasi & Role-Based Access Control (RBAC):**
   - Login menggunakan JWT (`admin` & `sales`) yang disimpan di Cookie dan diproteksi oleh Next.js Middleware (`middleware.ts`) serta `JwtAuthGuard` di NestJS.
   - **Role `admin`:** Melihat dan mengelola seluruh data rencana kunjungan dari semua pengguna.
   - **Role `sales`:** Hanya melihat dan mengelola data rencana kunjungan buatannya sendiri.
2. **Manajemen Rencana Kunjungan (100% Raw SQL via `DataSource.query`):**
   - Menampilkan daftar rencana kunjungan lengkap dengan informasi **Nama Entity**, **Region**, **Segmen (`B2B` / `B2G`)**, **Status (`VISITED` / `NOT-VISITED`)**, **Tanggal Kunjungan**, dan **Dibuat Oleh**.
   - **Tambah Rencana Kunjungan (`/pengunjung/tambah`):** Formulir dengan validasi *client-side* & *server-side* untuk membuat jadwal kunjungan baru.
   - **Ubah Status Kunjungan Langsung:** Mengganti status menjadi `VISITED` atau `NOT-VISITED` secara langsung dari tabel daftar rencana kunjungan (`PATCH /rencana-kunjungan/:id/status`).
3. **Pencarian & Multi-Filter Kombinasi:**
   - Pencarian berdasarkan **Nama Entity** (*case-insensitive* menggunakan `ILIKE`).
   - Filter berdasarkan **Range Tanggal** (`Dari Tanggal` & `Sampai Tanggal`), **Segmen** (`B2B` / `B2G`), dan **Status Kunjungan** (`VISITED` / `NOT-VISITED`) yang dapat dikombinasikan sekaligus beserta tombol **Reset Semua Filter**.

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
- `SeederService` akan otomatis mengeksekusi Raw SQL query (`DataSource.query`) untuk mengisi role (`admin`, `sales`), 3 user (`admin1`, `sales1`, `sales2` dengan password `password123`), relasi `user_role`, dan 3 data `entity` awal beserta `region`-nya (`PT Maju Jaya - Jakarta`, `Kementerian Kominfo - Jakarta`, `CV Berkah Abadi - Surabaya`).

### 3. Jalankan Frontend (Next.js - Port 3000)

Buka terminal baru:

```bash
cd frontend
npm install
npm run dev
```

Akses aplikasi di `http://localhost:3000`.

---

## Pengujian Unit Test (Jest & React Testing Library)

Frontend dilengkapi dengan **15 skenario unit test** menggunakan **Jest** (`next/jest`), **React Testing Library** (`@testing-library/react`, `@testing-library/jest-dom`), dan `@testing-library/user-event` di dalam lingkungan `jest-environment-jsdom`.

### Cara Menjalankan Unit Test

```bash
cd frontend

# Menjalankan seluruh unit test sekali
npm test

# Menjalankan unit test dalam mode watch
npm run test:watch
```

### Cakupan Skenario Pengujian (Test Suites)

#### 1. Halaman Daftar Rencana Kunjungan (`src/app/pengunjung/__tests__/page.test.tsx` — 9 Test Cases)
- **Initial Render:** Memastikan indikator loading muncul terlebih dahulu kemudian merender seluruh data awal (`PT Maju Jaya`, `Kementerian Kominfo`, `CV Berkah Abadi`, beserta `region`) ke dalam tabel dengan header `Authorization: Bearer <token>`.
- **Filter Pencarian (Search Input):** Menyimulasikan pengetikan pada input `Cari Entity`, memastikan API dipanggil dengan query `?search=...` dan tabel diperbarui sesuai hasil pencarian.
- **Filter Dropdown & Tanggal:** Menguji pemfilteran berdasarkan dropdown `Segmen` (`?segmen=B2G`) dan `Status Kunjungan` (`?status=VISITED`).
- **Kombinasi Multi-Filter & Reset Filter:** Menguji penggunaan 5 filter sekaligus (`search`, `startDate`, `endDate`, `segmen`, `status`) serta memastikan tombol `Reset Semua Filter` mengosongkan state filter dan memuat ulang data awal.
- **Empty State:** Memastikan pesan `"Belum ada data rencana kunjungan."` tampil ketika hasil pencarian/filter mengembalikan array kosong `[]`.
- **Validasi Akses RBAC & Interaksi Ubah Status:**
  - Memverifikasi tampilan badge `ADMIN` dan banner **Mode Admin** saat login sebagai `admin`.
  - Memverifikasi tampilan badge `SALES` dan banner **Mode Sales** saat login sebagai `sales`.
  - Menguji perubahan status kunjungan (`NOT-VISITED` -> `VISITED`) melalui dropdown baris tabel yang memanggil `PATCH /rencana-kunjungan/:id/status`.

#### 2. Halaman Tambah Rencana Kunjungan (`src/app/pengunjung/tambah/__tests__/page.test.tsx` — 6 Test Cases)
- **Initial Render:** Memastikan seluruh field (`Entity`, `Segmen Kunjungan`, `Status Kunjungan`, `Tanggal & Waktu Kunjungan`) dan tombol `Simpan Kunjungan` dirender dengan nilai default serta memuat daftar entity dari `GET /entity`.
- **Validasi Input (Client-side Validation):**
  - Memastikan pesan error muncul (`role="alert"`) dan endpoint `POST /rencana-kunjungan` **tidak** dipanggil apabila field wajib (`Tanggal & Waktu Kunjungan`) masih kosong.
  - Memastikan validasi format spesifik `Segmen` menolak nilai di luar `B2B` atau `B2G` tanpa memanggil API.
- **Alur Sukses Tambah Data (Happy Path):** Menyimulasikan pengisian form lengkap, memverifikasi tombol masuk ke state loading/disabled (`Menyimpan...`), memastikan `POST /rencana-kunjungan` dipanggil satu kali dengan payload JSON yang tepat, menampilkan notifikasi sukses (`role="status"`), dan melakukan navigasi `router.push('/pengunjung')`.
- **Alur Gagal / Error Handling (API Error):** Menyimulasikan respons error dari server (`400 Bad Request` dan `500 Internal Server Error`), memastikan pesan error ditampilkan kepada user dan halaman tidak melakukan redirect.
