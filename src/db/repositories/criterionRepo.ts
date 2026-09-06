import { db } from '../db';
import type { Criterion, TipeKriteria } from '../../types/record';

export function listCriteria(projectId: string): Promise<Criterion[]> {
  return db.criterion.where('projectId').equals(projectId).toArray();
}

export async function addCriterion(projectId: string, tipe: TipeKriteria, label: string, deskripsi: string): Promise<Criterion> {
  const criterion: Criterion = { id: crypto.randomUUID(), projectId, tipe, label, deskripsi };
  await db.criterion.add(criterion);
  return criterion;
}

export async function updateCriterion(id: string, label: string, deskripsi: string): Promise<void> {
  await db.criterion.update(id, { label, deskripsi });
}

export async function deleteCriterion(id: string): Promise<void> {
  await db.criterion.delete(id);
}
