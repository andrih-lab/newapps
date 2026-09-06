import type { RecordItem } from '../types/record';

export interface LotkaPoint {
  /** n = jumlah publikasi per penulis. */
  jumlahPublikasi: number;
  /** A_n aktual: jumlah penulis yang punya tepat n publikasi. */
  jumlahPenulisAktual: number;
  /** A_n teoritis menurut Hukum Lotka dengan eksponen C=2. */
  jumlahPenulisTeoritis: number;
  proporsiAktual: number;
  proporsiTeoritis: number;
}

export interface LotkaResult {
  titik: LotkaPoint[];
  totalPenulis: number;
  /** Eksponen C hasil estimasi regresi log-log (metode Pao), teoritis Lotka = 2. */
  eksponen: number;
  /** Konstanta A1 hasil estimasi regresi log-log. */
  konstanta: number;
}

function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const n = xs.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/**
 * Hukum Lotka: distribusi produktivitas penulis (Bagian 4, Modul 3).
 *
 * Rumus teoritis: A_n = A_1 / n^C, dengan C=2 (nilai baku Lotka 1926).
 * Eksponen C diestimasi ulang dari data dengan regresi linear atas
 * log10(n) vs log10(A_n) (metode Pao, 1985): log(A_n) = log(A_1) - C*log(n).
 *
 * Verifikasi terhadap Bibliometrix/Biblioshiny wajib dilakukan sebelum rilis
 * (Bagian 4, catatan verifikasi Modul 3).
 */
export function computeLotka(records: RecordItem[]): LotkaResult {
  const publikasiPerPenulis = new Map<string, number>();
  for (const r of records) {
    for (const author of r.penulis) {
      const key = author.trim();
      if (!key) continue;
      publikasiPerPenulis.set(key, (publikasiPerPenulis.get(key) ?? 0) + 1);
    }
  }

  const totalPenulis = publikasiPerPenulis.size;
  const frekuensi = new Map<number, number>();
  for (const jumlah of publikasiPerPenulis.values()) {
    frekuensi.set(jumlah, (frekuensi.get(jumlah) ?? 0) + 1);
  }

  const daftarN = Array.from(frekuensi.keys()).sort((a, b) => a - b);
  const a1 = frekuensi.get(1) ?? 0;

  const xs = daftarN.map((n) => Math.log10(n));
  const ys = daftarN.map((n) => Math.log10(frekuensi.get(n) as number));
  const { slope, intercept } = linearRegression(xs, ys);
  const eksponen = -slope;
  const konstanta = 10 ** intercept;

  const titik: LotkaPoint[] = daftarN.map((n) => {
    const jumlahPenulisAktual = frekuensi.get(n) as number;
    const jumlahPenulisTeoritis = a1 / n ** 2;
    return {
      jumlahPublikasi: n,
      jumlahPenulisAktual,
      jumlahPenulisTeoritis,
      proporsiAktual: totalPenulis > 0 ? jumlahPenulisAktual / totalPenulis : 0,
      proporsiTeoritis: totalPenulis > 0 ? jumlahPenulisTeoritis / totalPenulis : 0,
    };
  });

  return { titik, totalPenulis, eksponen, konstanta };
}
