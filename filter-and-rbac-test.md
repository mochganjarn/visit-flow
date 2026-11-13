Buatkan unit test yang komprehensif menggunakan **Jest** dan **React Testing Library** (`@testing-library/react`, `@testing-library/user-event`) untuk komponen Halaman List berikut pada aplikasi **Next.js App Router**.

**Konteks Teknis:**

- Framework: Next.js (App Router) dengan TypeScript.
- State/Data Fetching: fetch biasa.
- UI Library: Tailwind.
- Role User (RBAC): Aplikasi memiliki role `admin` dan `sales`.

**Skenario Pengujian (Test Cases) yang Wajib Dicakup:**

1. **Initial Render:** Memastikan data awal berhasil dirender dalam tabel/list setelah proses loading selesai.
2. **Filter Pencarian (Search Input):**
   - Simulasikan user mengetik kata kunci pada input pencarian (perhatikan mekanisme _debounce_ jika ada menggunakan `jest.useFakeTimers()`).
   - Pastikan fungsi fetch/API dipanggil dengan parameter query pencarian yang sesuai, dan tampilan list diperbarui sesuai hasil filter.
3. **Filter Kategori / Status / Dropdown:**
   - Simulasikan pemilihan opsi filter tertentu (misal: status, tanggal, atau kategori).
   - Pastikan parameter filter terkirim dengan benar dan list menampilkan data yang terfilter.
4. **Kombinasi & Reset Filter:**
   - Uji kombinasi lebih dari satu filter secara bersamaan.
   - Uji tombol "Reset Filter" (jika ada) untuk memastikan state filter kembali kosong dan data awal dimuat ulang.
5. **Empty State (Data Tidak Ditemukan):**
   - Simulasikan hasil filter yang mengembalikan array kosong `[]`, dan pastikan pesan "Data tidak ditemukan" tampil di layar.
6. **Validasi Akses RBAC (Opsional sesuai komponen):**
   - Pastikan elemen aksi tertentu (misal: tombol tambah/hapus) tampil atau tersembunyi sesuai role `admin` vs `sales`.

**Instruksi Tambahan:**

- Mock semua pemanggilan API/service eksternal dan `next/navigation` (`useRouter`, `useSearchParams`).
- Gunakan query yang _accessible_ (`getByRole`, `getByLabelText`, `getByPlaceholderText`) dibanding `getByTestId`.
- Sertakan komentar penjelasan singkat di setiap blok `it(...)`.

**Kode Komponen Halaman List:**
@frontend/src/app/pengunjung/page.tsx
