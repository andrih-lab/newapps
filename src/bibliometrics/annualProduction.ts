import type { RecordItem } from '../types/record';

export interface AnnualProductionPoint {
  tahun: number;
  jumlah: number;
  /** Persentase perubahan dari tahun sebelumnya, null untuk titik pertama. */
  lajuPertumbuhan: number | null;
}

/** Produksi tahunan dan laju pertumbuhan (Bagian 4, Modul 3). */
export function computeAnnualProduction(records: RecordItem[]): AnnualProductionPoint[] {
  const counts = new Map<number, number>();
  for (const r of records) {
    if (r.tahun == null) continue;
    counts.set(r.tahun, (counts.get(r.tahun) ?? 0) + 1);
  }

  const years = Array.from(counts.keys()).sort((a, b) => a - b);
  const result: AnnualProductionPoint[] = [];
  let prev: number | null = null;

  for (const tahun of years) {
    const jumlah = counts.get(tahun) as number;
    const lajuPertumbuhan = prev !== null && prev > 0 ? ((jumlah - prev) / prev) * 100 : null;
    result.push({ tahun, jumlah, lajuPertumbuhan });
    prev = jumlah;
  }

  return result;
}
