import type { BlokKonsep } from '../types/keywords';
import { kunciStem, kutip } from './text';
import { memuatFrasa } from './mining';

/**
 * Susun string Boolean per basis data dari blok konsep: istilah dalam satu
 * blok digabung OR, antar-blok digabung AND. Sintaks mengikuti dokumentasi
 * masing-masing basis data.
 */

export type BasisData = 'openalex' | 'scopus' | 'wos' | 'scholar' | 'indonesia';

export interface StringBasisData {
  basisData: BasisData;
  label: string;
  string: string;
  catatan: string[];
}

export const BATAS_SCHOLAR = 256;

export interface BlokAktif {
  nama: string;
  istilah: string[];
  /** Istilah yang dibuang karena sudah tercakup istilah lain di blok yang sama. */
  tercakup: string[];
}

/**
 * Istilah terpilih per blok, setelah membuang duplikat bentuk jamak/tunggal
 * dan istilah yang tercakup istilah lebih pendek ("mangrove forest" sudah
 * terjaring oleh "mangrove"). Blok tanpa istilah terpilih dilewati.
 */
export function blokAktif(blok: BlokKonsep[], urutkanHits = false): BlokAktif[] {
  const hasil: BlokAktif[] = [];
  for (const b of blok) {
    let dipilih = b.istilah.filter((i) => i.dipilih && i.teks.trim());
    if (urutkanHits) dipilih = [...dipilih].sort((x, y) => (y.hits ?? -1) - (x.hits ?? -1));
    const unik = new Map<string, string>();
    for (const i of dipilih) {
      const k = kunciStem(i.teks);
      if (!unik.has(k)) unik.set(k, i.teks.trim());
    }
    const semua = Array.from(unik.values());
    const istilah: string[] = [];
    const tercakup: string[] = [];
    for (const t of semua) {
      const pendek = semua.find((lain) => lain !== t && !lain.includes('*') && memuatFrasa(t, lain));
      if (pendek) tercakup.push(t);
      else istilah.push(t);
    }
    if (istilah.length > 0) hasil.push({ nama: b.nama, istilah, tercakup });
  }
  return hasil;
}

function grup(istilah: string[], f: (t: string) => string = kutip): string {
  const isi = istilah.map(f).join(' OR ');
  return istilah.length > 1 ? `(${isi})` : isi;
}

function catatanUmum(aktif: BlokAktif[], semuaBlok: BlokKonsep[]): string[] {
  const catatan: string[] = [];
  const kosong = semuaBlok.filter((b) => !aktif.some((a) => a.nama === b.nama)).map((b) => b.nama);
  if (kosong.length > 0) catatan.push(`Blok tanpa istilah terpilih dilewati: ${kosong.join(', ')}.`);
  const tercakup = aktif.flatMap((a) => a.tercakup);
  if (tercakup.length > 0) {
    catatan.push(`Tidak dimasukkan karena sudah tercakup istilah lebih pendek: ${tercakup.join(', ')}.`);
  }
  return catatan;
}

export function susunStringOpenAlex(blok: BlokKonsep[]): string {
  const tanpaWildcard = (t: string) => kutip(t.replace(/\*/g, ''));
  return blokAktif(blok)
    .map((b) => grup(b.istilah, tanpaWildcard))
    .join(' AND ');
}

export function susunSemuaString(blok: BlokKonsep[]): StringBasisData[] {
  const aktif = blokAktif(blok);
  if (aktif.length === 0) return [];
  const umum = catatanUmum(aktif, blok);
  const inti = aktif.map((b) => grup(b.istilah)).join(' AND ');
  const adaWildcard = aktif.some((b) => b.istilah.some((t) => t.includes('*')));

  const hasil: StringBasisData[] = [
    {
      basisData: 'openalex',
      label: 'OpenAlex',
      string: susunStringOpenAlex(blok),
      catatan: [
        'Dicari di judul, abstrak, dan full teks yang tersedia; bentuk jamak otomatis tercakup (stemming).',
        ...(adaWildcard ? ['Tanda * dihapus karena OpenAlex tidak mendukung wildcard.'] : []),
        ...umum,
      ],
    },
    {
      basisData: 'scopus',
      label: 'Scopus',
      string: `TITLE-ABS-KEY(${inti})`,
      catatan: [
        'Tempel di Advanced Search. Frasa dalam tanda kutip otomatis mencakup bentuk jamak dan varian ejaan.',
        'Saat ekspor: pilih format CSV atau BibTeX dan centang "Abstract & keywords" agar abstrak ikut terunduh.',
        ...umum,
      ],
    },
    {
      basisData: 'wos',
      label: 'Web of Science',
      string: `TS=(${inti})`,
      catatan: [
        'Tempel di Advanced Search. TS = judul, abstrak, kata kunci penulis, dan Keywords Plus.',
        'Saat ekspor: pilih "BibTeX" atau "Tab delimited file" dengan isi rekaman "Full Record" agar abstrak ikut.',
        ...umum,
      ],
    },
  ];

  // Google Scholar: maksimal 256 karakter. Istilah diambil bergiliran per blok
  // (urut hit terbanyak bila sudah dihitung) sampai batas tercapai.
  const aktifHits = blokAktif(blok, true).map((b) => b.istilah.map((t) => t.replace(/\*/g, '')));
  const terpakai: string[][] = aktifHits.map((b) => (b.length > 0 ? [b[0]] : []));
  const render = (bagian: string[][]) =>
    bagian
      .filter((b) => b.length > 0)
      .map((b) => (b.length > 1 ? `(${b.map((t) => `"${t}"`).join(' OR ')})` : `"${b[0]}"`))
      .join(' ');
  let bertambah = true;
  while (bertambah) {
    bertambah = false;
    for (let i = 0; i < aktifHits.length; i++) {
      const berikut = aktifHits[i][terpakai[i].length];
      if (!berikut) continue;
      const coba = terpakai.map((b, j) => (j === i ? [...b, berikut] : b));
      if (render(coba).length <= BATAS_SCHOLAR) {
        terpakai[i].push(berikut);
        bertambah = true;
      }
    }
  }
  const dimuat = terpakai.reduce((n, b) => n + b.length, 0);
  const total = aktifHits.reduce((n, b) => n + b.length, 0);
  hasil.push({
    basisData: 'scholar',
    label: 'Google Scholar',
    string: render(terpakai),
    catatan: [
      `Google Scholar membatasi ${BATAS_SCHOLAR} karakter${
        dimuat < total ? `; ${total - dimuat} istilah tidak muat (istilah dengan hit terbanyak diprioritaskan).` : '.'
      }`,
      'Scholar tidak transparan dan tidak reprodusibel — gunakan sebagai sumber pelengkap, bukan utama.',
    ],
  });

  const blokIndonesia = blok.map((b) => b.istilahIndonesia.map((t) => t.trim()).filter(Boolean)).filter((b) => b.length > 0);
  if (blokIndonesia.length > 0) {
    const kombinasi = blokIndonesia.map((b) => b[0]).join(' ');
    hasil.push({
      basisData: 'indonesia',
      label: 'Literatur Indonesia (Garuda / SINTA / Scholar)',
      string: blokIndonesia.map((b) => grup(b, (t) => `"${t}"`)).join(' AND '),
      catatan: [
        'String Boolean ini untuk Google Scholar berbahasa Indonesia.',
        `Portal seperti Garuda umumnya lebih cocok dengan kata kunci sederhana, mis.: ${kombinasi}`,
        ...(blokIndonesia.length < blok.length ? ['Sebagian blok belum punya padanan Indonesia.'] : []),
      ],
    });
  }

  return hasil;
}
