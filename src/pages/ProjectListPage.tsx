import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createProject, listProjects } from '../db/repositories/projectRepo';
import type { Project } from '../types/project';
import { Button } from '../components/common/Button';

export function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState('');
  const [pertanyaan, setPertanyaan] = useState('');
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
    </div>
  );
}
