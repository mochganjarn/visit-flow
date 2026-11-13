'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface KunjunganItem {
  id: number;
  entity_id: number;
  nama_entity: string;
  region: string;
  segmen: 'B2B' | 'B2G';
  status: 'VISITED' | 'NOT-VISITED';
  tanggal_kunjungan: string;
  dibuat_oleh: string;
}

export default function PengunjungPage() {
  const router = useRouter();
  const [data, setData] = useState<KunjunganItem[]>([]);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // State untuk search & multi-filter (Nama Entity, Range Tanggal, Segmen, Status)
  const [searchEntity, setSearchEntity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterSegmen, setFilterSegmen] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const token = Cookies.get('token');
    const savedUser = Cookies.get('username') || '';
    const savedRole = Cookies.get('role') || '';

    if (!token) {
      router.push('/login');
      return;
    }

    setUsername(savedUser);
    setRole(savedRole);

    const fetchKunjungan = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (searchEntity.trim()) params.append('search', searchEntity.trim());
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (filterSegmen) params.append('segmen', filterSegmen);
        if (filterStatus) params.append('status', filterStatus);

        const queryString = params.toString();
        const url = `${API_URL}/rencana-kunjungan${
          queryString ? `?${queryString}` : ''
        }`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          handleLogout();
          return;
        }

        if (!res.ok) {
          throw new Error('Gagal mengambil data rencana kunjungan');
        }

        const result = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchKunjungan();
  }, [router, searchEntity, startDate, endDate, filterSegmen, filterStatus]);

  const handleResetFilter = () => {
    setSearchEntity('');
    setStartDate('');
    setEndDate('');
    setFilterSegmen('');
    setFilterStatus('');
  };

  const handleStatusChange = async (
    id: number,
    newStatus: 'VISITED' | 'NOT-VISITED',
  ) => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setError('');
    setUpdatingId(id);

    try {
      const res = await fetch(`${API_URL}/rencana-kunjungan/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Gagal mengubah status kunjungan');
      }

      setData((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item,
        );
        if (filterStatus && filterStatus !== newStatus) {
          return updated.filter((item) => item.id !== id);
        }
        return updated;
      });
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengubah status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token', { path: '/' });
    Cookies.remove('username', { path: '/' });
    Cookies.remove('role', { path: '/' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Daftar Rencana Kunjungan
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
              <span>Login sebagai:</span>
              <span className="font-semibold text-slate-900">{username}</span>
              {role && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    role === 'admin'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {role.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pengunjung/tambah"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              + Tambah Pengunjung
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-lg bg-slate-100 border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Info Hak Akses */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          {role === 'admin' ? (
            <span>
              <strong>Mode Admin:</strong> Menampilkan seluruh data rencana
              kunjungan dari semua pengguna.
            </span>
          ) : (
            <span>
              <strong>Mode Sales:</strong> Hanya menampilkan data rencana
              kunjungan yang dibuat oleh akun Anda ({username}).
            </span>
          )}
        </div>

        {/* Panel Search & Filter (Nama Entity, Range Tanggal, Segmen, Status) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
              Pencarian & Filter Rencana Kunjungan
            </h2>
            {(searchEntity ||
              startDate ||
              endDate ||
              filterSegmen ||
              filterStatus) && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition self-start sm:self-auto"
              >
                Reset Semua Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search Nama Entity */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Cari Entity
              </label>
              <input
                type="text"
                value={searchEntity}
                onChange={(e) => setSearchEntity(e.target.value)}
                placeholder="Ketik nama entity..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Filter Tanggal Mulai */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Filter Tanggal Akhir */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Filter Segmen */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Segmen
              </label>
              <select
                value={filterSegmen}
                onChange={(e) => setFilterSegmen(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Semua Segmen</option>
                <option value="B2B">B2B</option>
                <option value="B2G">B2G</option>
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Status Kunjungan
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Semua Status</option>
                <option value="VISITED">VISITED</option>
                <option value="NOT-VISITED">NOT-VISITED</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Tabel Kunjungan */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Nama Entity
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Segmen
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tanggal Kunjungan
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Dibuat Oleh
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Ubah Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      Memuat data rencana kunjungan...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      Belum ada data rencana kunjungan.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        #{item.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-medium">
                        {item.nama_entity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {item.region || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.segmen}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.status === 'VISITED' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            VISITED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            NOT-VISITED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(item.tanggal_kunjungan).toLocaleString(
                          'id-ID',
                          {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          },
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                        {item.dibuat_oleh}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={item.status}
                          disabled={updatingId === item.id}
                          onChange={(e) =>
                            handleStatusChange(
                              item.id,
                              e.target.value as 'VISITED' | 'NOT-VISITED',
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 cursor-pointer"
                        >
                          <option value="NOT-VISITED">NOT-VISITED</option>
                          <option value="VISITED">VISITED</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

