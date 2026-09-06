import { db } from '../db';
import type { Project } from '../../types/project';

export async function createProject(nama: string, pertanyaanPenelitian: string): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    id: crypto.randomUUID(),
    nama,
    pertanyaanPenelitian,
    dibuat: now,
    diubah: now,
  };
  await db.project.add(project);
  return project;
}

export function listProjects(): Promise<Project[]> {
  return db.project.orderBy('diubah').reverse().toArray();
}

export function getProject(id: string): Promise<Project | undefined> {
  return db.project.get(id);
}

export async function touchProject(id: string): Promise<void> {
  await db.project.update(id, { diubah: new Date().toISOString() });
}

export async function deleteProject(id: string): Promise<void> {
  const tables = [db.project, db.searchQuery, db.record, db.criterion, db.extraction, db.screeningLog];
  await db.transaction('rw', tables, async () => {
    const recordIds = await db.record.where('projectId').equals(id).primaryKeys();
    await db.screeningLog.where('recordId').anyOf(recordIds).delete();
    await db.extraction.where('recordId').anyOf(recordIds).delete();
    await db.record.where('projectId').equals(id).delete();
    await db.searchQuery.where('projectId').equals(id).delete();
    await db.criterion.where('projectId').equals(id).delete();
    await db.project.delete(id);
  });
}
