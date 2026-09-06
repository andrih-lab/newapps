import type { RecordItem } from '../types/record';

export interface KeywordTrendSeries {
  kataKunci: string;
  data: Array<{ tahun: number; jumlah: number }>;
}

/** Tren kata kunci per tahun, untuk N kata kunci terfrekuensi (Bagian 4, Modul 3). */
export function computeKeywordTrends(records: RecordItem[], topN = 10): KeywordTrendSeries[] {
  const freqTotal = new Map<string, number>();
  for (const r of records) {
    const unique = new Set(r.kataKunci.map((k) => k.trim().toLowerCase()).filter(Boolean));
    for (const kw of unique) {
      freqTotal.set(kw, (freqTotal.get(kw) ?? 0) + 1);
    }
  }

  const top = Array.from(freqTotal.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([kw]) => kw);
  const topSet = new Set(top);

  const perYear = new Map<string, Map<number, number>>();
  for (const kw of top) perYear.set(kw, new Map());

  for (const r of records) {
    if (r.tahun == null) continue;
    const unique = new Set(r.kataKunci.map((k) => k.trim().toLowerCase()).filter((k) => topSet.has(k)));
    for (const kw of unique) {
      const m = perYear.get(kw) as Map<number, number>;
      m.set(r.tahun, (m.get(r.tahun) ?? 0) + 1);
    }
  }

  return top.map((kw) => {
    const m = perYear.get(kw) as Map<number, number>;
    const years = Array.from(m.keys()).sort((a, b) => a - b);
    return { kataKunci: kw, data: years.map((tahun) => ({ tahun, jumlah: m.get(tahun) as number })) };
  });
}
