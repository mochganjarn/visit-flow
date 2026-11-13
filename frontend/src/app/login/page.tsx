'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login gagal');
      }

      // Simpan JWT token dan informasi user di cookies
      Cookies.set('token', data.access_token, { expires: 1, path: '/' });
      Cookies.set('username', data.user.username, { expires: 1, path: '/' });
      Cookies.set('role', data.user.role, { expires: 1, path: '/' });

      router.push('/pengunjung');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">VisitFlow</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistem Manajemen Rencana Kunjungan (RBAC)
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: admin1, sales1, sales2"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">Akun Demo Seeder:</p>
          <p>• Admin: <code className="bg-slate-100 px-1 py-0.5 rounded">admin1</code> / <code className="bg-slate-100 px-1 py-0.5 rounded">password123</code></p>
          <p>• Sales 1: <code className="bg-slate-100 px-1 py-0.5 rounded">sales1</code> / <code className="bg-slate-100 px-1 py-0.5 rounded">password123</code></p>
          <p>• Sales 2: <code className="bg-slate-100 px-1 py-0.5 rounded">sales2</code> / <code className="bg-slate-100 px-1 py-0.5 rounded">password123</code></p>
        </div>
      </div>
    </div>
  );
}

