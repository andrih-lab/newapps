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
  /** Belum dinilai pada tahap skrining abstrak. */
  belumDinilai: number;
  /** Lolos skrining abstrak — inilah cakupan yang dinilai kelayakan full teks (Modul 5). */
  dinilaiFullText: number;
  dieksklusiFullText: {
    total: number;
    alasan: PrismaAlasan[];
  };
  disertakan: number;
  /** Lolos skrining abstrak tapi belum diputuskan kelayakan full teksnya. */
  belumDinilaiFullText: number;
}

/**
 * Hitung tiap kotak diagram PRISMA 2020 langsung dari data record (Bagian 4, Modul 6).
 * Tahap full teks memakai RecordItem.statusFullText/labelEksklusiFullText yang diisi
 * dari halaman Full Teks & Ekstraksi (Modul 5).
 */
export function computePrismaCounts(records: RecordItem[]): PrismaCounts {
  const total = records.length;

  const perSumberMap = new Map<string, number>();
  for (const r of records) perSumberMap.set(r.sumber, (perSumberMap.get(r.sumber) ?? 0) + 1);
  const perSumber = Array.from(perSumberMap.entries()).map(([sumber, jumlah]) => ({ sumber, jumlah }));

  const duplikatDibuang = records.filter((r) => r.statusDuplikat === 'duplikat').length;
  const nonDuplikat = records.filter((r) => r.statusDuplikat !== 'duplikat');
  const disaring = nonDuplikat.length;

  const dieksklusiSkriningRecords = nonDuplikat.filter((r) => r.statusSkrining === 'dikecualikan');
  const alasanSkrining = ringkasAlasan(dieksklusiSkriningRecords.map((r) => r.labelEksklusi));
  const belumDinilai = nonDuplikat.filter((r) => r.statusSkrining === 'belum').length;

  const eligibleFullText = nonDuplikat.filter((r) => r.statusSkrining === 'termasuk');
  const dinilaiFullText = eligibleFullText.length;

  const dieksklusiFullTextRecords = eligibleFullText.filter((r) => r.statusFullText === 'dikecualikan');
  const alasanFullText = ringkasAlasan(dieksklusiFullTextRecords.map((r) => r.labelEksklusiFullText));

  const disertakan = eligibleFullText.filter((r) => r.statusFullText === 'termasuk').length;
  const belumDinilaiFullText = eligibleFullText.filter((r) => r.statusFullText === 'belum').length;

  return {
    identifikasi: { total, perSumber },
    duplikatDibuang,
    disaring,
    dieksklusiSkrining: { total: dieksklusiSkriningRecords.length, alasan: alasanSkrining },
    belumDinilai,
    dinilaiFullText,
    dieksklusiFullText: { total: dieksklusiFullTextRecords.length, alasan: alasanFullText },
    disertakan,
    belumDinilaiFullText,
  };
}

function ringkasAlasan(labels: Array<string | null>): PrismaAlasan[] {
  const map = new Map<string, number>();
  for (const raw of labels) {
    const label = raw ?? '(tanpa label)';
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, jumlah]) => ({ label, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah);
}
