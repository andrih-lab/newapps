import { useEffect, useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { getProject } from '../db/repositories/projectRepo';
import type { Project } from '../types/project';
import { Sidebar } from '../components/layout/Sidebar';

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null | undefined>(undefined);

  useEffect(() => {
    if (!projectId) return;
    setProject(undefined);
    getProject(projectId).then((p) => setProject(p ?? null));
  }, [projectId]);

  if (project === undefined) {
    return <p className="text-sm text-gray-500">Memuat proyek...</p>;
  }

  if (project === null) {
    return (
      <div className="text-sm text-gray-600">
        Proyek tidak ditemukan.{' '}
        <Link to="/proyek" className="text-indigo-600 underline">
          Kembali ke daftar proyek
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <h1 className="mb-1 text-xl font-semibold">{project.nama}</h1>
        {project.pertanyaanPenelitian && <p className="mb-4 text-sm text-gray-600">{project.pertanyaanPenelitian}</p>}
        <Outlet context={{ project }} />
      </div>
    </div>
  );
}
