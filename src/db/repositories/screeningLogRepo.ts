import { db } from '../db';
import type { KeputusanSkrining, ScreeningLog } from '../../types/record';

export async function addScreeningLog(
  recordId: string,
  keputusan: KeputusanSkrining,
  alasan: string | null,
  penilai: string | null,
): Promise<ScreeningLog> {
  const log: ScreeningLog = {
    id: crypto.randomUUID(),
    recordId,
    keputusan,
    alasan,
    waktu: new Date().toISOString(),
    penilai,
  };
  await db.screeningLog.add(log);
  return log;
}

export function listScreeningLogsByRecordIds(recordIds: string[]): Promise<ScreeningLog[]> {
  if (recordIds.length === 0) return Promise.resolve([]);
  return db.screeningLog.where('recordId').anyOf(recordIds).sortBy('waktu');
}

export async function deleteLatestScreeningLog(recordId: string): Promise<void> {
  const logs = await db.screeningLog.where('recordId').equals(recordId).sortBy('waktu');
  const latest = logs[logs.length - 1];
  if (latest) await db.screeningLog.delete(latest.id);
}
