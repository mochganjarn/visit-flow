'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface EntityOption {
  id: number;
  nama: string;
  region?: string;
}

export default function TambahPengunjungPage() {
  const router = useRouter();
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [entity, setEntity] = useState('');
  const [segmen, setSegmen] = useState<'B2B' | 'B2G'>('B2B');
  const [status, setStatus] = useState<'NOT-VISITED' | 'VISITED'>('NOT-VISITED');
  const [tanggalKunjungan, setTanggalKunjungan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchEntities = async () => {
      try {
        const res = await fetch(`${API_URL}/entity`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Gagal memuat daftar entity');
        }

        const data: EntityOption[] = await res.json();
        setEntities(data);
        if (data.length > 0) {
          setEntity(String(data[0].id));
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat daftar entity');
      }
    };

    fetchEntities();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/rencana-kunjungan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          entity: Number(entity),
          segmen,
          status,
          tanggal_kunjungan: tanggalKunjungan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan rencana kunjungan');
      }

      router.push('/pengunjung');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Tambah Rencana Kunjungan
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Isi formulir di bawah untuk menambahkan jadwal kunjungan baru.
            </p>
          </div>
          <Link
            href="/pengunjung"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            &larr; Kembali
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dropdown Entity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Entity (Perusahaan / Instansi)
            </label>
            <select
              required
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {entities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama} {item.region ? `- ${item.region}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Segmen */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Segmen Kunjungan
            </label>
            <select
              required
              value={segmen}
              onChange={(e) => setSegmen(e.target.value as 'B2B' | 'B2G')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="B2B">B2B (Business to Business)</option>
              <option value="B2G">B2G (Business to Government)</option>
            </select>
          </div>

          {/* Dropdown Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status Kunjungan
            </label>
            <select
              required
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'NOT-VISITED' | 'VISITED')
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="NOT-VISITED">NOT-VISITED</option>
              <option value="VISITED">VISITED</option>
            </select>
          </div>

          {/* Input Tanggal Kunjungan */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tanggal & Waktu Kunjungan
            </label>
            <input
              type="datetime-local"
              required
              value={tanggalKunjungan}
              onChange={(e) => setTanggalKunjungan(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href="/pengunjung"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kunjungan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

