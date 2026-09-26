import type { StrategiPencarian } from '../types/keywords';
import { lookupAgrovoc } from './agrovoc';
import { mintaSaranAi, type PengaturanAi } from './ai';
import { susunStringOpenAlex } from './buildQueries';
import { tambangKandidat, tebakBlok } from './mining';
import { ambilSampel } from './openalexApi';
import { ekspansiWilayah } from './regions';
import { blokDariTopik, semuaIstilah, tambahIstilah, tambahIstilahIndonesia, perbaruiBlok, type IstilahBaru } from './strategyOps';
import { varianIstilah } from './variants';

/**
 * Alur "sekali klik": topik → blok konsep → perluasan (wilayah, varian,
 * AGROVOC) → penambangan literatur OpenAlex → (opsional) saran AI.
 * Biaya OpenAlex: 1–2 panggilan pencarian. AGROVOC gratis.
 */

export interface OpsiOtomatis {
  pakaiAgrovoc: boolean;
  pakaiTambang: boolean;
  ai: PengaturanAi | null;
}

export type Pelapor = (pesan: string) => void;

const MAKS_TERKAIT = 6;

export async function perluasBlok(s: StrategiPencarian, pakaiAgrovoc: boolean, lapor: Pelapor, signal?: AbortSignal) {
  const peringatan: string[] = [];
  let hasil = s;
  for (const blok of s.blok) {
    const benih = blok.istilah.filter((i) => i.dipilih && (i.sumber === 'topik' || i.sumber === 'manual')).map((i) => i.teks);
    for (const teks of benih) {
      const tambahan: IstilahBaru[] = [];

      const wilayah = ekspansiWilayah(teks);
      if (wilayah) {
        for (const w of wilayah) tambahan.push({ teks: w, sumber: 'wilayah', dipilih: true, keterangan: `bagian dari ${teks}` });
      }

      for (const v of varianIstilah(teks)) tambahan.push({ teks: v.teks, sumber: 'varian', dipilih: v.dipilih, keterangan: v.keterangan });

      if (pakaiAgrovoc && !wilayah) {
        lapor(`Mencari "${teks}" di tesaurus AGROVOC…`);
        try {
          const k = await lookupAgrovoc(teks, signal);
          if (k) {
            for (const t of [k.label, ...k.sinonim]) {
              tambahan.push({ teks: t, sumber: 'agrovoc', dipilih: true, keterangan: `sinonim AGROVOC untuk "${k.cocok}"` });
            }
            for (const t of k.lebihSempit.slice(0, MAKS_TERKAIT)) {
              tambahan.push({ teks: t, sumber: 'agrovoc', dipilih: false, keterangan: 'istilah lebih sempit (AGROVOC)' });
            }
            for (const t of k.terkait.slice(0, MAKS_TERKAIT)) {
              tambahan.push({ teks: t, sumber: 'agrovoc', dipilih: false, keterangan: 'istilah terkait (AGROVOC) — belum tentu sinonim' });
            }
            if (k.labelMelayu.length > 0) {
              const lama = hasil.blok.find((b) => b.id === blok.id)?.petunjukMelayu ?? [];
              hasil = perbaruiBlok(hasil, blok.id, { petunjukMelayu: Array.from(new Set([...lama, ...k.labelMelayu])) });
            }
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') throw err;
          peringatan.push(`AGROVOC gagal untuk "${teks}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      hasil = tambahIstilah(hasil, blok.id, tambahan);
    }
  }
  return { strategi: hasil, peringatan };
}

export async function tambangLiteratur(s: StrategiPencarian, lapor: Pelapor, signal?: AbortSignal): Promise<StrategiPencarian> {
  let query = susunStringOpenAlex(s.blok);
  if (!query) return s;
  lapor('Menambang istilah dari 200 artikel paling relevan di OpenAlex…');
  let sampel = await ambilSampel(query, signal);
  if (sampel.length < 20 && s.blok.length > 2) {
    // Terlalu sempit untuk ditambang — longgarkan dengan dua blok pertama saja.
    query = susunStringOpenAlex(s.blok.slice(0, 2));
    lapor('Hasil terlalu sedikit, melonggarkan ke dua konsep pertama…');
    sampel = await ambilSampel(query, signal);
  }
  const blokRingkas = s.blok.map((b) => ({ id: b.id, istilah: b.istilah.map((i) => i.teks) }));
  const kandidat = tambangKandidat(sampel, semuaIstilah(s)).map((k) => ({ ...k, blokSaran: tebakBlok(k.teks, blokRingkas) }));
  return { ...s, kandidat, jumlahSampelTambang: sampel.length, diubah: new Date().toISOString() };
}

export async function tambahSaranAi(
  s: StrategiPencarian,
  ai: PengaturanAi,
  lapor: Pelapor,
  signal?: AbortSignal,
): Promise<StrategiPencarian> {
  lapor('Meminta saran istilah dari Gemini…');
  const saran = await mintaSaranAi(
    s.topik,
    s.blok.map((b) => ({ nama: b.nama, istilah: b.istilah.filter((i) => i.dipilih).map((i) => i.teks) })),
    ai,
    signal,
  );
  let hasil = s;
  s.blok.forEach((blok, idx) => {
    const cocok = saran.find((x) => x.nama.toLowerCase() === blok.nama.toLowerCase()) ?? saran[idx];
    if (!cocok) return;
    hasil = tambahIstilah(
      hasil,
      blok.id,
      cocok.istilah.map((t) => ({ teks: t, sumber: 'ai' as const, dipilih: false, keterangan: 'saran Gemini — cek jumlah hit sebelum dipakai' })),
    );
    hasil = tambahIstilahIndonesia(hasil, blok.id, cocok.istilahIndonesia);
  });
  return hasil;
}

/** Jalankan seluruh alur otomatis. Blok dibuat dari topik bila belum ada. */
export async function jalankanOtomatis(
  awal: StrategiPencarian,
  opsi: OpsiOtomatis,
  lapor: Pelapor,
  signal?: AbortSignal,
): Promise<{ strategi: StrategiPencarian; peringatan: string[] }> {
  let s = awal.blok.length > 0 ? awal : { ...awal, blok: blokDariTopik(awal.topik) };
  if (s.blok.length === 0) throw new Error('Topik belum bisa dipecah menjadi konsep. Tulis topik lebih lengkap.');

  const perluasan = await perluasBlok(s, opsi.pakaiAgrovoc, lapor, signal);
  s = perluasan.strategi;
  const peringatan = [...perluasan.peringatan];

  if (opsi.pakaiTambang) {
    try {
      s = await tambangLiteratur(s, lapor, signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      peringatan.push(`Penambangan OpenAlex gagal: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (opsi.ai) {
    try {
      s = await tambahSaranAi(s, opsi.ai, lapor, signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      peringatan.push(`Saran AI gagal: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { strategi: s, peringatan };
}
