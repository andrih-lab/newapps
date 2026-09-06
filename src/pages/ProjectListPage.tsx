import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createProject, listProjects } from '../db/repositories/projectRepo';
import { importProjectBackup, isValidProjectBackup } from '../db/repositories/backupRepo';
import type { Project } from '../types/project';
import { Button } from '../components/common/Button';

export function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState('');
  const [pertanyaan, setPertanyaan] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();

  async function refresh() {
    setProjects(await listProjects());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!nama.trim()) return;
    const project = await createProject(nama.trim(), pertanyaan.trim());
    setNama('');
    setPertanyaan('');
    navigate(`/proyek/${project.id}`);
  }

  async function handleImportBackup(file: File) {
    setImportError(null);
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!isValidProjectBackup(data)) {
        setImportError('File cadangan tidak valid atau dari versi aplikasi yang tidak kompatibel.');
        return;
      }
      const project = await importProjectBackup(data);
      navigate(`/proyek/${project.id}`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Gagal membaca file cadangan.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-semibold">Proyek Saya</h1>
        {loading ? (
          <p className="mt-3 text-sm text-gray-500">Memuat...</p>
        ) : projects.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Belum ada proyek. Buat proyek pertama Anda di bawah.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
            {projects.map((p) => (
              <li key={p.id}>
                <Link to={`/proyek/${p.id}`} className="block px-4 py-3 hover:bg-gray-50">
                  <div className="font-medium text-gray-900">{p.nama}</div>
                  {p.pertanyaanPenelitian && <div className="text-sm text-gray-500">{p.pertanyaanPenelitian}</div>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-base font-semibold">Buat Proyek Baru</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nama Proyek</label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="mis. Adopsi AI dalam Pendidikan Tinggi"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Pertanyaan Penelitian (opsional)</label>
            <textarea
              value={pertanyaan}
              onChange={(e) => setPertanyaan(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <Button type="submit">Buat Proyek</Button>
        </form>
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="mb-1 text-base font-semibold">Pulihkan dari Cadangan</h2>
        <p className="mb-3 text-sm text-gray-600">
          Unggah file JSON cadangan (dari halaman Ekspor proyek lain) untuk memulihkannya sebagai proyek baru —
          berguna untuk pindah perangkat/peramban (Bagian 4, Modul 8).
        </p>
        <label className="inline-block cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          {importing ? 'Memulihkan...' : 'Pilih File Cadangan (.json)'}
          <input
            type="file"
            accept="application/json"
            className="hidden"
            disabled={importing}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImportBackup(f);
              e.target.value = '';
            }}
          />
        </label>
        {importError && <p className="mt-2 text-sm text-red-600">{importError}</p>}
      </section>
    </div>
  );
}
