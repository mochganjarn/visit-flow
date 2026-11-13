Buatkan kode lengkap dan panduan setup untuk aplikasi manajemen kunjungan dalam satu repository (Monorepo) menggunakan **NestJS** (Backend API) dan **Next.js App Router** (Frontend) dengan database **PostgreSQL**, **TypeORM**, dan sistem Role-Based Access Control (RBAC).

### 1. Aturan Utama & Tech Stack

- **Arsitektur:** Monorepo (`/backend` untuk NestJS dan `/frontend` untuk Next.js).
- **Database & ORM:** PostgreSQL menggunakan **TypeORM** (`@nestjs/typeorm`, `typeorm`, `pg`).
- **Aturan Penggunaan ORM & Raw Query (SANGAT PENTING):**
  1. Gunakan **TypeORM Entity** (`@Entity`, `@Column`, `@ManyToOne`, dll.) dan `TypeOrmModule.forRoot({ synchronize: true })` HANYA untuk manajemen koneksi database dan pembuatan skema tabel otomatis di PostgreSQL.
  2. Untuk seluruh eksekusi query di dalam Service (Select, Insert, Seeding, Auth), **WAJIB menggunakan Raw SQL Query** melalui `@InjectDataSource() private dataSource: DataSource` dengan memanggil `await this.dataSource.query('SQL_QUERY', [$1, $2])`.
  3. **DILARANG** menggunakan Query Builder (`createQueryBuilder()`) maupun method abstraksi Repository (`find`, `findOne`, `save`, `create`, `insert`).
  4. Gunakan tanda kutip ganda `"user"` pada setiap raw query SQL yang merujuk ke tabel `user` karena merupakan reserved keyword di PostgreSQL.
- **Autentikasi & Otorisasi:** JWT (JSON Web Token) menggunakan `@nestjs/jwt`, `passport-jwt`, dan `bcrypt`. Payload JWT wajib menyimpan `sub` (user_id), `username`, dan `role` (`admin` atau `sales`).

---

### 2. Skema Database (5 Entity TypeORM)

Buat 5 Entity TypeORM berikut agar tabel terbentuk otomatis di PostgreSQL:

1. **Entity `User` (`@Entity('user')`)**:
   - `id`: `@PrimaryGeneratedColumn()`
   - `username`: `@Column({ type: 'varchar', length: 100, unique: true })`
   - `password`: `@Column({ type: 'varchar', length: 255 })`

2. **Entity `Role` (`@Entity('roles')`)**:
   - `id`: `@PrimaryGeneratedColumn()`
   - `nama_role`: `@Column({ type: 'varchar', length: 50, unique: true })` (berisi `'admin'` dan `'sales'`)

3. **Entity `UserRole` (`@Entity('user_role')`)**:
   - `id`: `@PrimaryGeneratedColumn()`
   - `user_id`: `@Column()`
   - `role_id`: `@Column()`
   - Relasi `@ManyToOne` ke `User` (`@JoinColumn({ name: 'user_id' })`, `onDelete: 'CASCADE'`)
   - Relasi `@ManyToOne` ke `Role` (`@JoinColumn({ name: 'role_id' })`, `onDelete: 'CASCADE'`)

4. **Entity `MasterEntity` (`@Entity('entity')`)**:
   - `id`: `@PrimaryGeneratedColumn()`
   - `nama`: `@Column({ type: 'varchar', length: 150 })`
   - `region`: `@Column({ type: 'varchar', length: 100, nullable: true })`

5. **Entity `RencanaKunjungan` (`@Entity('rencana_kunjungan')`)**:
   - Buat TypeScript Enum `StatusKunjungan`:
     - `VISITED = 'VISITED'`
     - `NOT_VISITED = 'NOT-VISITED'`
   - Buat TypeScript Enum `SegmenKunjungan`:
     - `B2B = 'B2B'`
     - `B2G = 'B2G'`
   - `id`: `@PrimaryGeneratedColumn()`
   - `entity`: `@Column()`
   - `user_id`: `@Column()`
   - `status`: `@Column({ type: 'enum', enum: StatusKunjungan, default: StatusKunjungan.NOT_VISITED })`
   - `segmen`: `@Column({ type: 'enum', enum: SegmenKunjungan })`
   - `tanggal_kunjungan`: `@Column({ type: 'timestamp' })`
   - Relasi `@ManyToOne` ke `MasterEntity` (`@JoinColumn({ name: 'entity' })`)
   - Relasi `@ManyToOne` ke `User` (`@JoinColumn({ name: 'user_id' })`, `onDelete: 'CASCADE'`)

---

### 3. Spesifikasi Backend (NestJS + TypeORM `DataSource.query`)

- **Database Seeder (`OnModuleInit`):**
  - Gunakan `this.dataSource.query(...)` dengan raw SQL `INSERT INTO ... ON CONFLICT DO NOTHING` untuk mengisi data awal:
    - 2 Role: `admin` dan `sales`.
    - 3 User: `admin1` (role: `admin`), `sales1` (role: `sales`), dan `sales2` (role: `sales`) dengan password di-hash `bcrypt`.
    - Relasi di tabel `user_role`.
    - 3 Data `entity` awal beserta `region`-nya (PT Maju Jaya - Jakarta, Kementerian Kominfo - Jakarta, CV Berkah Abadi - Surabaya).
- **Auth Module:**
  - `POST /auth/login`:
    - Cari user beserta role-nya menggunakan `this.dataSource.query()`:
      ```sql
      SELECT u.id, u.username, u.password, r.nama_role AS role
      FROM "user" u
      JOIN user_role ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.username = $1
      LIMIT 1
      ```
    - Validasi password dengan `bcrypt.compare`.
    - Kembalikan JWT access token dengan payload `{ sub: user.id, username: user.username, role: user.role }`.
  - Buat `JwtAuthGuard` untuk memproteksi endpoint dan mengekstrak `req.user` (`id`, `username`, `role`).
- **Rencana Kunjungan Module (Protected dengan `JwtAuthGuard`):**
  - `GET /entity`:
    - Eksekusi dengan `this.dataSource.query('SELECT id, nama, region FROM entity ORDER BY nama ASC')`.
  - `GET /rencana-kunjungan`:
    - **Jika `req.user.role === 'admin'`**: Ambil seluruh data kunjungan dari semua user dengan `this.dataSource.query()`:
      ```sql
      SELECT rk.id, rk.entity AS entity_id, e.nama AS nama_entity, e.region, rk.segmen, rk.status, rk.tanggal_kunjungan, u.username AS dibuat_oleh
      FROM rencana_kunjungan rk
      JOIN entity e ON rk.entity = e.id
      JOIN "user" u ON rk.user_id = u.id
      ORDER BY rk.tanggal_kunjungan DESC
      ```
    - **Jika `req.user.role === 'sales'`**: Filter menggunakan `WHERE rk.user_id = $1` di `this.dataSource.query(sql, [req.user.id])` agar sales HANYA bisa melihat data kunjungan buatannya sendiri:
      ```sql
      SELECT rk.id, rk.entity AS entity_id, e.nama AS nama_entity, e.region, rk.segmen, rk.status, rk.tanggal_kunjungan, u.username AS dibuat_oleh
      FROM rencana_kunjungan rk
      JOIN entity e ON rk.entity = e.id
      JOIN "user" u ON rk.user_id = u.id
      WHERE rk.user_id = $1
      ORDER BY rk.tanggal_kunjungan DESC
      ```
  - `POST /rencana-kunjungan`:
    - Ambil `user_id` langsung dari JWT token (`req.user.id`).
    - Validasi input `status` (`VISITED` / `NOT-VISITED`) dan `segmen` (`B2B` / `B2G`).
    - Simpan menggunakan `this.dataSource.query()`:
      ```sql
      INSERT INTO rencana_kunjungan (entity, user_id, status, segmen, tanggal_kunjungan)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      ```
- Aktifkan CORS agar bisa diakses oleh frontend Next.js.

---

### 4. Spesifikasi Frontend (Next.js App Router + Tailwind CSS)

- **Proteksi Halaman (`middleware.ts`):**
  - Simpan JWT token (dan info user/role) di cookies setelah login.
  - Jika user belum login dan mengakses `/pengunjung` atau `/pengunjung/tambah`, redirect otomatis ke `/login`.
  - Jika user sudah login dan mengakses `/login`, redirect otomatis ke `/pengunjung`.
- **Halaman yang Harus Dibuat:**
  1. **Halaman Login (`/login`):**
     - Form input `username` dan `password`.
     - Menyimpan token JWT ke cookie dan redirect ke `/pengunjung`.
  2. **Halaman Daftar Pengunjung (`/pengunjung`):**
     - Menampilkan informasi user yang sedang login beserta badge role-nya (`ADMIN` atau `SALES`).
     - Menyediakan panel Pencarian & Multi-Filter yang dapat digunakan bersamaan: Cari Entity (`search`), Range Tanggal (`startDate` & `endDate`), Segmen (`B2B` / `B2G`), dan Status Kunjungan (`VISITED` / `NOT-VISITED`), lengkap dengan tombol **Reset Semua Filter**.
     - Menampilkan tabel berisi: ID, Nama Entity (`nama_entity`), Region (`region`), Segmen (`B2B` / `B2G`), Status (`VISITED` hijau / `NOT-VISITED` merah-abu), Tanggal Kunjungan, Pembuat Kunjungan (`dibuat_oleh`), serta dropdown **Ubah Status** (`PATCH /rencana-kunjungan/:id/status`).
     - Data tabel otomatis mengikuti hak akses dari backend (Admin melihat semua data, Sales hanya melihat datanya sendiri).
     - Tombol "Tambah Pengunjung" (`/pengunjung/tambah`) dan tombol "Logout".
  3. **Halaman Tambah Pengunjung (`/pengunjung/tambah`):**
     - Form input terdiri dari:
       - Dropdown `Entity` (diambil dari `GET /entity`).
       - Dropdown `Segmen` (pilihan: `B2B`, `B2G`).
       - Dropdown `Status` (pilihan: `NOT-VISITED`, `VISITED`).
       - Input `Tanggal Kunjungan` (`datetime-local`).
     - Dilengkapi validasi *client-side* serta penanganan *error* dan *loading state*.
     - Saat submit, panggil `POST /rencana-kunjungan` dengan header `Authorization: Bearer <token>`, tampilkan notifikasi sukses, lalu redirect ke `/pengunjung`.
- **Unit Testing Frontend (Jest & React Testing Library):**
  - `src/app/pengunjung/__tests__/page.test.tsx`: Menguji Initial Render, Search Input (`?search=`), Filter Dropdown (`segmen`, `status`, range tanggal), Kombinasi & Reset Filter, Empty State, Validasi Akses RBAC (`admin` vs `sales`), dan aksi Ubah Status (`PATCH`).
  - `src/app/pengunjung/tambah/__tests__/page.test.tsx`: Menguji Initial Render, Validasi Input Client-side (field kosong & validasi `segmen` B2B/B2G), Alur Sukses Tambah Data (loading state, payload JSON, notifikasi sukses, redirect), serta Error Handling API (`400` & `500`).

---

### 5. Output yang Diharapkan

1. Struktur folder lengkap monorepo (`/backend` dan `/frontend`).
2. Kode lengkap 5 Entity TypeORM beserta `SeederService` (menggunakan `DataSource.query`).
3. Kode lengkap Backend NestJS (`AppModule`, `AuthModule`, `RencanaKunjunganModule` menggunakan `DataSource.query`).
4. Kode lengkap Frontend Next.js (`middleware.ts`, halaman `/login`, `/pengunjung`, dan `/pengunjung/tambah`).
5. Panduan menjalankan project dari konfigurasi `.env` PostgreSQL hingga menjalankan kedua server.
