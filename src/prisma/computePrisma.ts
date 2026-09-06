import type { RecordItem } from '../types/record';

export interface PrismaAlasan {
  label: string;
  jumlah: number;
}

export interface PrismaCounts {
  identifikasi: {
    total: number;
    perSumber: Array<{ sumber: string; jumlah: number }>;
  };
  duplikatDibuang: number;
  disaring: number;
  dieksklusiSkrining: {
    total: number;
    alasan: PrismaAlasan[];
  };
  dinilaiFullText: number;
  dieksklusiFullText: {
    total: number;
    alasan: PrismaAlasan[];
  };
  disertakan: number;
  belumDinilai: number;
}

/**
 * Hitung tiap kotak diagram PRISMA 2020 langsung dari data record (Bagian 4, Modul 6).
 * Tahap "dinilai kelayakan full teks" & "dieksklusi full teks" masih placeholder
 * (Modul 5 / Pekan 3 belum dikerjakan) — di sini disamakan dengan hasil skrining
 * abstrak, dan UI wajib menyatakan ini secara eksplisit, bukan menyembunyikannya.
 */
export function computePrismaCounts(records: RecordItem[]): PrismaCounts {
  const total = records.length;

  const perSumberMap = new Map<string, number>();
  for (const r of records) perSumberMap.set(r.sumber, (perSumberMap.get(r.sumber) ?? 0) + 1);
  const perSumber = Array.from(perSumberMap.entries()).map(([sumber, jumlah]) => ({ sumber, jumlah }));

  const duplikatDibuang = records.filter((r) => r.statusDuplikat === 'duplikat').length;
  const nonDuplikat = records.filter((r) => r.statusDuplikat !== 'duplikat');
  const disaring = nonDuplikat.length;

  const dieksklusiRecords = nonDuplikat.filter((r) => r.statusSkrining === 'dikecualikan');
  const alasanMap = new Map<string, number>();
  for (const r of dieksklusiRecords) {
    const label = r.labelEksklusi ?? '(tanpa label)';
    alasanMap.set(label, (alasanMap.get(label) ?? 0) + 1);
  }
  const alasan = Array.from(alasanMap.entries())
    .map(([label, jumlah]) => ({ label, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah);

  const termasuk = nonDuplikat.filter((r) => r.statusSkrining === 'termasuk').length;
  const belumDinilai = nonDuplikat.filter((r) => r.statusSkrining === 'belum').length;

  return {
    identifikasi: { total, perSumber },
    duplikatDibuang,
    disaring,
    dieksklusiSkrining: { total: dieksklusiRecords.length, alasan },
    dinilaiFullText: termasuk,
    dieksklusiFullText: { total: 0, alasan: [] },
    disertakan: termasuk,
    belumDinilai,
  };
}
