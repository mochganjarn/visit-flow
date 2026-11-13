import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TambahPengunjungPage from '../page';
import Cookies from 'js-cookie';

// 1. Mock next/navigation (useRouter) dengan referensi objek stabil
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = {
  push: mockPush,
  refresh: mockRefresh,
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// 2. Mock js-cookie untuk autentikasi token JWT
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Data dummy master entity dari GET /entity
const mockEntities = [
  { id: 1, nama: 'PT Maju Jaya', region: 'Jakarta' },
  { id: 2, nama: 'Kementerian Kominfo', region: 'Jakarta' },
  { id: 3, nama: 'CV Berkah Abadi', region: 'Surabaya' },
];

// Helper membuat mock response fetch
const createFetchResponse = (data: unknown, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    json: async () => data,
  } as Response);

describe('TambahPengunjungPage (Halaman Tambah Rencana Kunjungan)', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (Cookies.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'token') return 'mock-jwt-token';
      return undefined;
    });

    // Default mock fetch untuk GET /entity saat komponen mount
    mockFetch = jest.fn().mockImplementation((url: string) => {
      if (url.endsWith('/entity')) {
        return createFetchResponse(mockEntities);
      }
      return createFetchResponse({});
    });

    global.fetch = mockFetch as unknown as typeof fetch;
  });

  // ===========================================================================
  // 1. INITIAL RENDER
  // ===========================================================================
  describe('1. Initial Render', () => {
    it('merender seluruh field input, label, dan tombol submit dalam keadaan default serta memuat opsi Entity', async () => {
      render(<TambahPengunjungPage />);

      // Pastikan judul halaman tampil
      expect(
        screen.getByRole('heading', { name: /tambah rencana kunjungan/i }),
      ).toBeInTheDocument();

      // Pastikan semua field form dirender dan dapat diakses melalui labelnya
      const entitySelect = screen.getByLabelText(
        /entity \(perusahaan \/ instansi\)/i,
      );
      const segmenSelect = screen.getByLabelText(/segmen kunjungan/i);
      const statusSelect = screen.getByLabelText(/status kunjungan/i);
      const tanggalInput = screen.getByLabelText(/tanggal & waktu kunjungan/i);
      const submitButton = screen.getByRole('button', {
        name: /simpan kunjungan/i,
      });

      expect(entitySelect).toBeInTheDocument();
      expect(segmenSelect).toBeInTheDocument();
      expect(statusSelect).toBeInTheDocument();
      expect(tanggalInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();

      // Tunggu hingga daftar entity dari GET /entity selesai dimuat dan pilihannya terpilih secara default
      await waitFor(() => {
        expect(entitySelect).toHaveValue('1');
      });

      // Pastikan nilai default pada masing-masing field sesuai spesifikasi
      expect(segmenSelect).toHaveValue('B2B');
      expect(statusSelect).toHaveValue('NOT-VISITED');
      expect(tanggalInput).toHaveValue('');
    });
  });

  // ===========================================================================
  // 2. VALIDASI INPUT (CLIENT-SIDE VALIDATION)
  // ===========================================================================
  describe('2. Validasi Input (Client-side Validation)', () => {
    it('menampilkan pesan error validasi dan tidak memanggil API POST ketika field Tanggal Kunjungan masih kosong', async () => {
      const user = userEvent.setup();
      render(<TambahPengunjungPage />);

      // Tunggu opsi entity selesai dimuat
      await waitFor(() => {
        expect(
          screen.getByLabelText(/entity \(perusahaan \/ instansi\)/i),
        ).toHaveValue('1');
      });

      // Klik tombol submit tanpa mengisi Tanggal & Waktu Kunjungan
      const submitButton = screen.getByRole('button', {
        name: /simpan kunjungan/i,
      });
      await user.click(submitButton);

      // Pastikan pesan error validasi muncul di layar
      expect(await screen.findByRole('alert')).toHaveTextContent(
        /tanggal kunjungan wajib diisi/i,
      );

      // Pastikan endpoint POST /rencana-kunjungan TIDAK dipanggil (hanya 1 kali panggilan GET /entity saat mount)
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/rencana-kunjungan'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('menampilkan pesan error validasi apabila Segmen bukan bernilai B2B atau B2G dan tidak memanggil API POST', async () => {
      const user = userEvent.setup();
      render(<TambahPengunjungPage />);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/entity \(perusahaan \/ instansi\)/i),
        ).toHaveValue('1');
      });

      // Isi tanggal kunjungan dengan nilai valid
      const tanggalInput = screen.getByLabelText(/tanggal & waktu kunjungan/i);
      await user.type(tanggalInput, '2026-11-20T10:30');

      // Simulasikan perubahan nilai segmen ke nilai tidak valid (di luar B2B / B2G)
      const segmenSelect = screen.getByLabelText(
        /segmen kunjungan/i,
      ) as HTMLSelectElement;
      const invalidOption = document.createElement('option');
      invalidOption.value = 'B2C';
      segmenSelect.appendChild(invalidOption);
      fireEvent.change(segmenSelect, { target: { value: 'B2C' } });

      // Klik tombol submit
      await user.click(
        screen.getByRole('button', { name: /simpan kunjungan/i }),
      );

      // Pastikan validasi format spesifik segmen B2B/B2G tampil
      expect(await screen.findByRole('alert')).toHaveTextContent(
        /segmen harus bernilai b2b atau b2g/i,
      );

      // Pastikan fungsi API POST tidak dipanggil
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/rencana-kunjungan'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  // ===========================================================================
  // 3. ALUR SUKSES TAMBAH DATA (HAPPY PATH)
  // ===========================================================================
  describe('3. Alur Sukses Tambah Data (Happy Path)', () => {
    it('mengirimkan payload JSON yang tepat, menampilkan state loading pada tombol, memunculkan notifikasi sukses, dan melakukan redirect ke /pengunjung', async () => {
      const user = userEvent.setup();

      // Buat promise yang dapat dikontrol untuk memverifikasi state loading/disabled saat proses submit berlangsung
      let resolvePostRequest!: (value: Response) => void;
      const pendingPostPromise = new Promise<Response>((resolve) => {
        resolvePostRequest = resolve;
      });

      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.endsWith('/entity')) {
          return createFetchResponse(mockEntities);
        }
        if (
          url.endsWith('/rencana-kunjungan') &&
          options?.method === 'POST'
        ) {
          return pendingPostPromise;
        }
        return createFetchResponse({});
      });

      render(<TambahPengunjungPage />);

      // Tunggu opsi entity selesai dimuat
      const entitySelect = screen.getByLabelText(
        /entity \(perusahaan \/ instansi\)/i,
      );
      await waitFor(() => {
        expect(entitySelect).toHaveValue('1');
      });

      // Isi seluruh field form dengan data yang valid menggunakan userEvent
      await user.selectOptions(entitySelect, '2'); // Kementerian Kominfo
      await user.selectOptions(
        screen.getByLabelText(/segmen kunjungan/i),
        'B2G',
      );
      await user.selectOptions(
        screen.getByLabelText(/status kunjungan/i),
        'VISITED',
      );
      await user.type(
        screen.getByLabelText(/tanggal & waktu kunjungan/i),
        '2026-11-25T14:00',
      );

      // Klik tombol submit
      const submitButton = screen.getByRole('button', {
        name: /simpan kunjungan/i,
      });
      await user.click(submitButton);

      // Pastikan tombol masuk ke state loading ("Menyimpan...") dan disabled selama request berlangsung
      expect(
        screen.getByRole('button', { name: /menyimpan\.\.\./i }),
      ).toBeDisabled();

      // Selesaikan request POST dengan response sukses
      resolvePostRequest({
        ok: true,
        status: 201,
        json: async () => ({
          id: 10,
          entity: 2,
          segmen: 'B2G',
          status: 'VISITED',
          tanggal_kunjungan: '2026-11-25T14:00:00.000Z',
        }),
      } as Response);

      // Pastikan API POST dipanggil tepat satu kali dengan payload JSON yang sesuai
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/rencana-kunjungan',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer mock-jwt-token',
            },
            body: JSON.stringify({
              entity: 2,
              segmen: 'B2G',
              status: 'VISITED',
              tanggal_kunjungan: '2026-11-25T14:00',
            }),
          }),
        );
      });

      // Pastikan notifikasi sukses tampil dan router melakukan redirect ke halaman list (/pengunjung)
      expect(await screen.findByRole('status')).toHaveTextContent(
        /rencana kunjungan berhasil disimpan/i,
      );
      expect(mockPush).toHaveBeenCalledWith('/pengunjung');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // 4. ALUR GAGAL / ERROR HANDLING (API ERROR)
  // ===========================================================================
  describe('4. Alur Gagal / Error Handling (API Error)', () => {
    it('menampilkan pesan error dari server (400 Bad Request) dan tidak melakukan redirect', async () => {
      const user = userEvent.setup();

      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.endsWith('/entity')) {
          return createFetchResponse(mockEntities);
        }
        if (
          url.endsWith('/rencana-kunjungan') &&
          options?.method === 'POST'
        ) {
          return createFetchResponse(
            { message: 'Tanggal kunjungan tidak valid menurut server' },
            false,
            400,
          );
        }
        return createFetchResponse({});
      });

      render(<TambahPengunjungPage />);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/entity \(perusahaan \/ instansi\)/i),
        ).toHaveValue('1');
      });

      // Isi form dan submit
      await user.type(
        screen.getByLabelText(/tanggal & waktu kunjungan/i),
        '2026-11-25T09:00',
      );
      await user.click(
        screen.getByRole('button', { name: /simpan kunjungan/i }),
      );

      // Pastikan pesan error dari response server ditampilkan kepada user
      const alertBox = await screen.findByRole('alert');
      expect(alertBox).toHaveTextContent(
        'Tanggal kunjungan tidak valid menurut server',
      );

      // Pastikan halaman TIDAK melakukan redirect ke /pengunjung
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('menampilkan pesan error default ketika terjadi kegagalan 500 Internal Server Error tanpa message spesifik', async () => {
      const user = userEvent.setup();

      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.endsWith('/entity')) {
          return createFetchResponse(mockEntities);
        }
        if (
          url.endsWith('/rencana-kunjungan') &&
          options?.method === 'POST'
        ) {
          return createFetchResponse({}, false, 500);
        }
        return createFetchResponse({});
      });

      render(<TambahPengunjungPage />);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/entity \(perusahaan \/ instansi\)/i),
        ).toHaveValue('1');
      });

      await user.type(
        screen.getByLabelText(/tanggal & waktu kunjungan/i),
        '2026-11-25T09:00',
      );
      await user.click(
        screen.getByRole('button', { name: /simpan kunjungan/i }),
      );

      expect(await screen.findByRole('alert')).toHaveTextContent(
        /gagal menyimpan rencana kunjungan/i,
      );
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});

