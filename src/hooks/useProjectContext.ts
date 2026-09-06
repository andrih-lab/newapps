import { useOutletContext } from 'react-router-dom';
import type { Project } from '../types/project';

export interface ProjectOutletContext {
  project: Project;
}

/** Dipakai oleh halaman di dalam ProjectPage (impor/deduplikasi/bibliometrik) untuk mengambil proyek aktif. */
export function useProjectContext(): ProjectOutletContext {
  return useOutletContext<ProjectOutletContext>();
}
