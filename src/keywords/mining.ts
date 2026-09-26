import { kunciStem, normalisasi, STOPWORD_FRASA } from './text';

/**
 * Penambangan istilah dari sampel literatur (pendekatan "objective search
 * strategy" berbasis frekuensi): istilah yang sering muncul di judul, abstrak,
 * dan kata kunci artikel-artikel paling relevan adalah kandidat sinonim yang
 * dipakai penulis sungguhan. Murni deterministik, tanpa model bahasa.
 */

export interface SampelArtikel {
  judul: string;
  abstrak: string;
  kataKunci: string[];
}

export interface KandidatIstilah {
  teks: string;
  /** Jumlah artikel (dari sampel) yang memuat istilah ini. */
  df: number;
  asal: 'kata kunci' | 'judul/abstrak';
}

/**
 * Kata kunci OpenAlex dihasilkan otomatis dan kadang salah bidang, mis.
 * "Carbon fibers", "Stock (firearms)", "Deforestation (computer science)".
 * Yang berkurung dan nama disiplin umum dibuang.
 */
const KATA_KUNCI_UMUM = new Set(
  [
    'environmental science', 'biology', 'geography', 'ecology', 'computer science', 'engineering',
    'agroforestry', 'forestry', 'political science', 'economics', 'sociology', 'business', 'medicine',
    'chemistry', 'physics', 'mathematics', 'geology', 'psychology', 'oceanography', 'fishery',
    'environmental resource management', 'environmental protection', 'environmental planning',
    'botany', 'zoology', 'agronomy', 'soil science', 'hydrology', 'law', 'history', 'philosophy',
    'art', 'materials science', 'carbon fibers', 'global warming', 'tropics', 'latitude',
    'corporate governance', 'the internet', 'world wide web', 'internet privacy', 'computer security', 'finance',
    'psychological resilience', 'citizen journalism', 'marketing', 'management', 'operations management', 'public relations', 'knowledge management', 'accounting', 'archaeology', 'biochemistry', 'physical geography',
    'natural resource economics', 'socioeconomics', 'geomorphology', 'remote sensing', 'cartography',
  ].map((k) => kunciStem(k)),
);

/** Kata kunci OpenAlex yang layak diusulkan sebagai istilah (bukan salah-bidang/nama disiplin umum). */
export function kataKunciBermakna(k: string): boolean {
  if (/[(<]/.test(k)) return false;
  const kunci = kunciStem(k);
  return !!kunci && !KATA_KUNCI_UMUM.has(kunci);
}

function tokenFrasa(teks: string): string[] {
  return normalisasi(teks).match(/[a-z][a-z0-9-]*[a-z0-9]|[a-z]/g) ?? [];
}

function ngramDokumen(teks: string): Set<string> {
  const token = tokenFrasa(teks);
  const hasil = new Set<string>();
  // Hanya frasa 2–3 kata dari judul/abstrak: kata tunggal di teks bebas hampir selalu terlalu umum
  // ("management", "community"). Kata tunggal yang khas tetap masuk lewat kata kunci OpenAlex.
  for (let n = 2; n <= 3; n++) {
    for (let i = 0; i + n <= token.length; i++) {
      const potong = token.slice(i, i + n);
      if (STOPWORD_FRASA.has(potong[0]) || STOPWORD_FRASA.has(potong[n - 1])) continue;
      if (potong.some((t) => t.length < 3 || /^\d/.test(t))) continue;
      hasil.add(potong.join(' '));
    }
  }
  return hasil;
}

/** true bila `frasa` memuat seluruh token `bagian` secara berurutan (berbasis kunci stem). */
export function memuatFrasa(frasa: string, bagian: string): boolean {
  const a = ` ${kunciStem(frasa)} `;
  const b = ` ${kunciStem(bagian)} `;
  return b.trim().length > 0 && a.includes(b);
}

/**
 * Tambang kandidat istilah dari sampel. `istilahAda` = istilah yang sudah
 * ada di strategi — kandidat yang sama atau yang MEMUAT istilah itu dibuang,
 * karena frasa yang lebih panjang ("blue carbon stocks") tidak menambah hasil
 * bila istilah pendeknya ("blue carbon") sudah dicari.
 */
export function tambangKandidat(
  sampel: SampelArtikel[],
  istilahAda: string[],
  batas = 40,
): KandidatIstilah[] {
  if (sampel.length === 0) return [];
  const minDf = Math.max(3, Math.ceil(sampel.length * 0.03));

  const dfKataKunci = new Map<string, { teks: string; df: number }>();
  const dfFrasa = new Map<string, { teks: string; df: number }>();

  for (const art of sampel) {
    const kk = new Map<string, string>();
    for (const k of art.kataKunci) {
      if (kataKunciBermakna(k)) kk.set(kunciStem(k), normalisasi(k));
    }
    for (const [kunci, teks] of kk) {
      const e = dfKataKunci.get(kunci) ?? { teks, df: 0 };
      e.df += 1;
      dfKataKunci.set(kunci, e);
    }

    const frasa = new Map<string, string>();
    for (const f of ngramDokumen(`${art.judul} . ${art.abstrak}`)) frasa.set(kunciStem(f), f);
    for (const [kunci, teks] of frasa) {
      const e = dfFrasa.get(kunci) ?? { teks, df: 0 };
      e.df += 1;
      dfFrasa.set(kunci, e);
    }
  }

  const ada = istilahAda.map((t) => t.replace(/\*/g, '')).filter(Boolean);
  const tokenAda = new Set(ada.flatMap((t) => kunciStem(t).split(' ')));
  // Terpakai bila sama/memuat istilah yang ada, atau seluruh katanya hanya potongan istilah yang ada
  // ("ecological knowledge" dari "local ecological knowledge").
  const terpakai = (teks: string) =>
    ada.some((t) => memuatFrasa(teks, t) || kunciStem(t) === kunciStem(teks)) ||
    kunciStem(teks).split(' ').every((tok) => tokenAda.has(tok));

  const kandidat: KandidatIstilah[] = [];
  const terlihat = new Set<string>();
  const dorong = (kunci: string, teks: string, df: number, asal: KandidatIstilah['asal']) => {
    if (df < minDf || terlihat.has(kunci) || terpakai(teks)) return;
    terlihat.add(kunci);
    kandidat.push({ teks, df, asal });
  };

  for (const [kunci, { teks, df }] of dfKataKunci) dorong(kunci, teks, df, 'kata kunci');

  // Buang n-gram yang selalu muncul sebagai bagian frasa lebih panjang dengan df hampir sama
  // ("ecological knowledge" ⊂ "local ecological knowledge").
  const frasaUrut = Array.from(dfFrasa.entries()).sort((a, b) => b[0].split(' ').length - a[0].split(' ').length);
  const frasaDiterima: Array<{ kunci: string; df: number }> = [];
  for (const [kunci, { teks, df }] of frasaUrut) {
    if (df < minDf) continue;
    const tertelan = frasaDiterima.some((f) => f.kunci.includes(kunci) && f.df >= df * 0.8);
    if (tertelan) continue;
    frasaDiterima.push({ kunci, df });
    dorong(kunci, teks, df, 'judul/abstrak');
  }

  return kandidat.sort((a, b) => b.df - a.df).slice(0, batas);
}

/**
 * Tebak blok tujuan kandidat: blok yang salah satu istilahnya berbagi token
 * bermakna dengan kandidat. null bila tidak ada yang cocok (pengguna memilih).
 */
export function tebakBlok(kandidat: string, blok: Array<{ id: string; istilah: string[] }>): string | null {
  const tokenKandidat = new Set(kunciStem(kandidat).split(' ').filter((t) => t.length >= 4 && !STOPWORD_FRASA.has(t)));
  let terbaik: { id: string; skor: number } | null = null;
  for (const b of blok) {
    let skor = 0;
    for (const istilah of b.istilah) {
      for (const t of kunciStem(istilah).split(' ')) if (tokenKandidat.has(t)) skor += 1;
    }
    if (skor > 0 && (!terbaik || skor > terbaik.skor)) terbaik = { id: b.id, skor };
  }
  return terbaik?.id ?? null;
}
