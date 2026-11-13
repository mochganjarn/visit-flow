Buatkan unit test yang komprehensif menggunakan **Jest** dan **React Testing Library** (`@testing-library/react`, `@testing-library/user-event`) untuk komponen Halaman Tambah Data (Create Form) berikut pada aplikasi **Next.js App Router**.

**Konteks Teknis:**

- Framework: Next.js (App Router) dengan TypeScript.
- Form Management: native state.
- Endpoint Target: Mengarah ke backend NestJS REST API.

**Skenario Pengujian (Test Cases) yang Wajib Dicakup:**

1. **Initial Render:** Memastikan seluruh field input, label, dan tombol submit dirender dengan benar dalam keadaan awal kosong/default.
2. **Validasi Input (Client-side Validation):**
   - Simulasikan klik tombol submit saat field wajib (_required_) masih kosong, pastikan pesan error validasi muncul dan fungsi API **tidak** dipanggil.
   - Uji validasi format spesifik segmen harus B2B atau B2G.
3. **Alur Sukses Tambah Data (Happy Path):**
   - Simulasikan pengisian semua field form dengan data yang valid menggunakan `userEvent`.
   - Klik tombol submit dan pastikan tombol masuk ke state _loading/disabled_ selama proses berlangsung.
   - Pastikan fungsi API/submit dipanggil satu kali dengan _payload_ JSON yang tepat.
   - Pastikan muncul notifikasi sukses (toast/alert) dan router melakukan redirect (misal: `router.push('/...')`) ke halaman list.
4. **Alur Gagal / Error Handling (API Error):**
   - Mock response API agar mengembalikan error (misal: status 400 Bad Request atau 500 Internal Server Error).
   - Pastikan pesan error dari server ditampilkan kepada user dan halaman tidak melakukan redirect.

**Instruksi Tambahan:**

- Mock modul `next/navigation` (`useRouter`) untuk memverifikasi navigasi setelah submit berhasil.
- Pastikan membersihkan mock (`jest.clearAllMocks()`) di dalam `beforeEach`.
- Gunakan `waitFor` atau `findBy*` untuk menangani proses asynchronous.

**Kode Komponen Halaman Tambah Data:**
[page.tsx](file;file:///Users/satan/Programming/VisitFlow/frontend/src/app/pengunjung/tambah/page.tsx)
