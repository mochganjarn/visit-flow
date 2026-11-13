import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PengunjungPage from '../page';
import Cookies from 'js-cookie';

// 1. Mock next/navigation (useRouter & useSearchParams) dengan referensi objek stabil
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = {
  push: mockPush,
  refresh: mockRefresh,
};
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

// 2. Mock js-cookie untuk simulasi autentikasi & RBAC (admin vs sales)
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Data dummy rencana kunjungan untuk pengujian
const mockInitialData = [
  {
    id: 1,
    entity_id: 101,
    nama_entity: 'PT Maju Jaya',
    region: 'Jakarta',
    segmen: 'B2B' as const,
    status: 'NOT-VISITED' as const,
    tanggal_kunjungan: '2026-11-10T09:00:00.000Z',
    dibuat_oleh: 'sales1',
  },
  {
    id: 2,
    entity_id: 102,
    nama_entity: 'Kementerian Kominfo',
    region: 'Jakarta',
    segmen: 'B2G' as const,
    status: 'VISITED' as const,
    tanggal_kunjungan: '2026-11-12T14:30:00.000Z',
    dibuat_oleh: 'sales2',
  },
  {
    id: 3,
    entity_id: 103,
    nama_entity: 'CV Berkah Abadi',
    region: 'Surabaya',
    segmen: 'B2B' as const,
    status: 'VISITED' as const,
    tanggal_kunjungan: '2026-11-13T10:00:00.000Z',
    dibuat_oleh: 'sales1',
  },
];

// Helper untuk mengatur cookie simulasi login berdasarkan role
const setupMockAuthCookies = (
  role: 'admin' | 'sales' = 'admin',
  username = 'admin1',
  token = 'mock-jwt-token',
) => {
  (Cookies.get as jest.Mock).mockImplementation((key: string) => {
    if (key === 'token') return token;
    if (key === 'role') return role;
    if (key === 'username') return username;
    return undefined;
  });
};

// Helper untuk membuat mock response fetch
const createFetchResponse = (data: unknown, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    json: async () => data,
  } as Response);

describe('PengunjungPage (Halaman Daftar Rencana Kunjungan)', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMockAuthCookies('admin', 'admin1');
    mockFetch = jest.fn().mockImplementation(() =>
      createFetchResponse(mockInitialData),
    );
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  // ===========================================================================
  // 1. INITIAL RENDER
  // ===========================================================================
  describe('1. Initial Render', () => {
    it('menampilkan indikator loading terlebih dahulu lalu merender data awal ke dalam tabel', async () => {
      // Render halaman daftar rencana kunjungan
      render(<PengunjungPage />);

      // Pastikan teks loading muncul pada saat proses fetch berlangsung
      expect(
        screen.getByText(/memuat data rencana kunjungan/i),
      ).toBeInTheDocument();

      // Tunggu hingga data selesai dimuat dan dirender di dalam tabel
      await waitFor(() => {
        expect(screen.getByText('PT Maju Jaya')).toBeInTheDocument();
      });

      // Pastikan seluruh baris data awal tampil beserta detailnya
      expect(screen.getByText('Kementerian Kominfo')).toBeInTheDocument();
      expect(screen.getByText('CV Berkah Abadi')).toBeInTheDocument();
      expect(screen.getByText('Surabaya')).toBeInTheDocument();

      // Pastikan API dipanggil ke endpoint awal dengan header Authorization Bearer token
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/rencana-kunjungan',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock-jwt-token',
          },
        }),
      );
    });
  });

  // ===========================================================================
  // 2. FILTER PENCARIAN (SEARCH INPUT)
  // ===========================================================================
  describe('2. Filter Pencarian (Search Input)', () => {
    it('memanggil API dengan parameter query ?search= saat user mengetik pada input Cari Entity dan memperbarui tabel', async () => {
      const user = userEvent.setup();

      // Mock implementasi fetch: kembalikan hasil filter ketika URL mengandung search=Kominfo
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('search=Kominfo')) {
          return createFetchResponse([mockInitialData[1]]);
        }
        return createFetchResponse(mockInitialData);
      });

      render(<PengunjungPage />);

      // Tunggu render awal selesai
      await waitFor(() => {
        expect(screen.getByText('PT Maju Jaya')).toBeInTheDocument();
      });

      // Cari input pencarian menggunakan accessible query (getByPlaceholderText / getByLabelText)
      const searchInput = screen.getByPlaceholderText(/ketik nama entity/i);
      await user.type(searchInput, 'Kominfo');

      // Pastikan API dipanggil dengan query parameter search=Kominfo
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          'http://localhost:3001/rencana-kunjungan?search=Kominfo',
          expect.any(Object),
        );
      });

      // Pastikan hanya Kementerian Kominfo yang tampil di tabel
      expect(screen.getByText('Kementerian Kominfo')).toBeInTheDocument();
      expect(screen.queryByText('PT Maju Jaya')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 3. FILTER KATEGORI / STATUS / DROPDOWN & TANGGAL
  // ===========================================================================
  describe('3. Filter Segmen, Status Kunjungan, dan Range Tanggal', () => {
    it('memfilter data ketika user memilih opsi pada dropdown Segmen (B2G)', async () => {
      const user = userEvent.setup();

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('segmen=B2G')) {
          return createFetchResponse([mockInitialData[1]]);
        }
        return createFetchResponse(mockInitialData);
      });

      render(<PengunjungPage />);

      await waitFor(() => {
        expect(screen.getByText('PT Maju Jaya')).toBeInTheDocument();
      });

      // Pilih opsi B2G pada dropdown Segmen menggunakan getByLabelText
      const segmenSelect = screen.getByLabelText(/^segmen$/i);
      await user.selectOptions(segmenSelect, 'B2G');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          'http://localhost:3001/rencana-kunjungan?segmen=B2G',
          expect.any(Object),
        );
      });

      expect(screen.getByText('Kementerian Kominfo')).toBeInTheDocument();
      expect(screen.queryByText('PT Maju Jaya')).not.toBeInTheDocument();
    });

    it('memfilter data ketika user memilih opsi pada dropdown Status Kunjungan (VISITED)', async () => {
      const user = userEvent.setup();

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('status=VISITED')) {
          return createFetchResponse([mockInitialData[1], mockInitialData[2]]);
        }
        return createFetchResponse(mockInitialData);
      });

      render(<PengunjungPage />);

      await waitFor(() => {
        expect(screen.getByText('PT Maju Jaya')).toBeInTheDocument();
      });

      // Pilih opsi VISITED pada dropdown Status Kunjungan
      const statusSelect = screen.getByLabelText(/status kunjungan/i);
      await user.selectOptions(statusSelect, 'VISITED');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          'http://localhost:3001/rencana-kunjungan?status=VISITED',
          expect.any(Object),
        );
      });

      expect(screen.getByText('Kementerian Kominfo')).toBeInTheDocument();
      expect(screen.getByText('CV Berkah Abadi')).toBeInTheDocument();
      expect(screen.queryByText('PT Maju Jaya')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 4. KOMBINASI & RESET FILTER
  // ===========================================================================
  describe('4. Kombinasi Beberapa Filter Sekaligus & Reset Filter', () => {
    it('mengirimkan seluruh parameter filter secara bersamaan dan mereset kembali ke data awal saat tombol Reset Semua Filter diklik', async () => {
      const user = userEvent.setup();

      mockFetch.mockImplementation((url: string) => {
        if (
          url.includes('search=Berkah') &&
          url.includes('startDate=2026-11-01') &&
          url.includes('endDate=2026-11-30') &&
          url.includes('segmen=B2B') &&
          url.includes('status=VISITED')
        ) {
          return createFetchResponse([mockInitialData[2]]);
        }
        return createFetchResponse(mockInitialData);
      });

      render(<PengunjungPage />);

      await waitFor(() => {
        expect(screen.getByText('PT Maju Jaya')).toBeInTheDocument();
      });

      // Pastikan tombol Reset Semua Filter belum tampil saat filter masih kosong
      expect(
        screen.queryByRole('button', { name: /reset semua filter/i }),
      ).not.toBeInTheDocument();

      // Terapkan 5 filter sekaligus (Search + StartDate + EndDate + Segmen + Status)
      await user.type(screen.getByLabelText(/cari entity/i), 'Berkah');
      await user.type(screen.getByLabelText(/dari tanggal/i), '2026-11-01');
      await user.type(screen.getByLabelText(/sampai tanggal/i), '2026-11-30');
      await user.selectOptions(screen.getByLabelText(/^segmen$/i), 'B2B');
      await user.selectOptions(
        screen.getByLabelText(/status kunjungan/i),
        'VISITED',
      );

      // Pastikan API dipanggil dengan seluruh query params yang dikombinasikan
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          'http://localhost:3001/rencana-kunjungan?search=Berkah&startDate=2026-11-01&endDate=2026-11-30&segmen=B2B&status=VISITED',
          expect.any(Object),
        );
      });

      // Hanya CV Berkah Abadi yang tampil
      expect(screen.getByText('CV Berkah Abadi')).toBeInTheDocument();
      expect(screen.queryByText('PT Maju Jaya')).not.toBeInTheDocument();

      // Klik tombol "Reset Semua Filter"
      const resetButton = screen.getByRole('button', {
        name: /reset semua filter/i,
      });
      await user.click(resetButton);

      // Pastikan nilai input filter kembali kosong dan data awal dimuat ulang tanpa query string
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          'http://localhost:3001/rencana-kunjungan',
          expect.any(Object),
        );
      });

      expect(screen.getByLabelText(/cari entity/i)).toHaveValue('');
      expect(screen.getByLabelText(/^segmen$/i)).toHaveValue('');
      expect(screen.getByLabelText(/status kunjungan/i)).toHaveValue('');
      expect(screen.getByText('PT Maju Jaya')).toBeInTheDocument();
      expect(screen.getByText('Kementerian Kominfo')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 5. EMPTY STATE (DATA TIDAK DITEMUKAN)
  // ===========================================================================
  describe('5. Empty State (Data Tidak Ditemukan)', () => {
    it('menampilkan pesan "Belum ada data rencana kunjungan." ketika hasil filter mengembalikan array kosong []', async () => {
      const user = userEvent.setup();

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('search=TidakAdaPT')) {
          return createFetchResponse([]);
        }
        return createFetchResponse(mockInitialData);
      });

      render(<PengunjungPage />);

      await waitFor(() => {
        expect(screen.getByText('PT Maju Jaya')).toBeInTheDocument();
      });

      // Ketik kata kunci yang tidak memiliki hasil
      const searchInput = screen.getByPlaceholderText(/ketik nama entity/i);
      await user.type(searchInput, 'TidakAdaPT');

      // Pastikan pesan empty state tampil di dalam tabel
      await waitFor(() => {
        expect(
          screen.getByText(/belum ada data rencana kunjungan\./i),
        ).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // 6. VALIDASI AKSES RBAC (ADMIN VS SALES) & AKSI UBAH STATUS
  // ===========================================================================
  describe('6. Validasi Akses RBAC (Admin vs Sales) & Interaksi Ubah Status', () => {
    it('menampilkan badge ADMIN dan informasi Mode Admin ketika user login dengan role admin', async () => {
      setupMockAuthCookies('admin', 'admin1');

      render(<PengunjungPage />);

      await waitFor(() => {
        expect(screen.getByText('PT Maju Jaya')).toBeInTheDocument();
      });

      // Pastikan username, badge ADMIN, dan banner informasi Mode Admin tampil
      expect(screen.getByText('admin1')).toBeInTheDocument();
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
      expect(
        screen.getByText(
          /menampilkan seluruh data rencana kunjungan dari semua pengguna/i,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /\+ tambah pengunjung/i }),
      ).toHaveAttribute('href', '/pengunjung/tambah');
    });

    it('menampilkan badge SALES dan informasi Mode Sales ketika user login dengan role sales', async () => {
      setupMockAuthCookies('sales', 'sales1');
      mockFetch.mockImplementation(() =>
        createFetchResponse([mockInitialData[0], mockInitialData[2]]),
      );

      render(<PengunjungPage />);

      await waitFor(() => {
        expect(screen.getByText('PT Maju Jaya')).toBeInTheDocument();
      });

      // Pastikan badge SALES dan banner khusus akun sales1 tampil
      expect(screen.getByText('SALES')).toBeInTheDocument();
      expect(
        screen.getByText(
          /hanya menampilkan data rencana kunjungan yang dibuat oleh akun anda \(sales1\)/i,
        ),
      ).toBeInTheDocument();
    });

    it('mengizinkan perubahan status kunjungan (NOT-VISITED -> VISITED) melalui dropdown di baris tabel', async () => {
      const user = userEvent.setup();

      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (
          url.endsWith('/rencana-kunjungan/1/status') &&
          options?.method === 'PATCH'
        ) {
          return createFetchResponse({
            ...mockInitialData[0],
            status: 'VISITED',
          });
        }
        return createFetchResponse(mockInitialData);
      });

      render(<PengunjungPage />);

      await waitFor(() => {
        expect(screen.getByText('PT Maju Jaya')).toBeInTheDocument();
      });

      // Ambil dropdown ubah status khusus untuk baris PT Maju Jaya menggunakan accessible label
      const rowStatusSelect = screen.getByLabelText(
        /ubah status untuk pt maju jaya/i,
      );
      expect(rowStatusSelect).toHaveValue('NOT-VISITED');

      // Ubah status menjadi VISITED
      await user.selectOptions(rowStatusSelect, 'VISITED');

      // Pastikan endpoint PATCH dipanggil dengan body { status: 'VISITED' }
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/rencana-kunjungan/1/status',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ status: 'VISITED' }),
          }),
        );
      });

      // Pastikan nilai dropdown pada baris tersebut berubah menjadi VISITED
      expect(rowStatusSelect).toHaveValue('VISITED');
    });
  });
});

