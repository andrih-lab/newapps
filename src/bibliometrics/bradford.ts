import type { RecordItem } from '../types/record';

export interface BradfordJournal {
  jurnal: string;
  jumlahArtikel: number;
  peringkat: number;
  kumulatifArtikel: number;
  /** 1 = zona inti (paling produktif), meningkat ke arah zona periferal. */
  zona: number;
}

export interface BradfordResult {
  jurnal: BradfordJournal[];
  totalArtikel: number;
  totalJurnal: number;
  /** Jumlah jurnal di tiap zona, berurutan dari zona 1. */
  jurnalPerZona: number[];
  /** Rasio Bradford rata-rata antar zona berurutan (idealnya konstan). */
  multiplier: number;
}

/**
 * Hukum Bradford: zonasi jurnal inti (Bagian 4, Modul 3).
 *
 * Jurnal diurutkan menurun berdasarkan jumlah artikel, lalu dibagi menjadi
 * `jumlahZona` zona sedemikian rupa sehingga tiap zona memuat jumlah artikel
 * kumulatif yang kurang-lebih sama (~totalArtikel / jumlahZona per zona).
 * Rasio jumlah jurnal antar zona berurutan (multiplier) idealnya mendekati
 * konstanta yang sama di setiap batas zona (hukum Bradford, 1934).
 *
 * Verifikasi terhadap Bibliometrix/Biblioshiny wajib sebelum rilis.
 */
export function computeBradford(records: RecordItem[], jumlahZona = 3): BradfordResult {
  const counts = new Map<string, number>();
  for (const r of records) {
    const nama = r.jurnal.trim();
    if (!nama) continue;
    counts.set(nama, (counts.get(nama) ?? 0) + 1);
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const totalArtikel = sorted.reduce((acc, [, c]) => acc + c, 0);
  const targetPerZona = totalArtikel / jumlahZona;

  const jurnal: BradfordJournal[] = [];
  const jurnalPerZona: number[] = [];
  let kumulatif = 0;
  let kumulatifAwalZona = 0;
  let zona = 1;
  let jumlahJurnalZonaIni = 0;

  sorted.forEach(([nama, jumlahArtikel], idx) => {
    kumulatif += jumlahArtikel;
    jumlahJurnalZonaIni++;

    const bukanZonaTerakhir = zona < jumlahZona;
    const bukanBarisTerakhir = idx < sorted.length - 1;
    if (bukanZonaTerakhir && bukanBarisTerakhir && kumulatif - kumulatifAwalZona >= targetPerZona) {
      jurnalPerZona.push(jumlahJurnalZonaIni);
      kumulatifAwalZona = kumulatif;
      jumlahJurnalZonaIni = 0;
      zona++;
    }

    jurnal.push({ jurnal: nama, jumlahArtikel, peringkat: idx + 1, kumulatifArtikel: kumulatif, zona });
  });
  jurnalPerZona.push(jumlahJurnalZonaIni);

  let multiplierSum = 0;
  let pairCount = 0;
  for (let i = 1; i < jurnalPerZona.length; i++) {
    if (jurnalPerZona[i - 1] > 0) {
      multiplierSum += jurnalPerZona[i] / jurnalPerZona[i - 1];
      pairCount++;
    }
  }

  return {
    jurnal,
    totalArtikel,
    totalJurnal: sorted.length,
    jurnalPerZona,
    multiplier: pairCount > 0 ? multiplierSum / pairCount : 0,
  };
}
