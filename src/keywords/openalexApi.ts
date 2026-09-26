import { applyOpenAlexAuth, reconstructAbstract } from '../services/openalex';
import { normalizeDoi } from '../lib/doi';
import type { SampelArtikel } from './mining';

/**
 * Panggilan OpenAlex khusus Perancang Kata Kunci: hitung hasil, ambil sampel
 * untuk ditambang, dan uji recall paper kunci.
 *
 * Sejak 2026 OpenAlex memakai kuota harian berbasis biaya (header
 * X-RateLimit-*-USD): pencarian (`search`) ≈ $0,001 per panggilan, filter
 * biasa ≈ $0,0001. Sisa kuota dibaca dari header dan disiarkan ke UI agar
 * pengguna tahu sebelum kehabisan.
 */

const BASE = 'https://api.openalex.org/works';

export interface KuotaOpenAlex {
  sisaUsd: number;
  batasUsd: number | null;
}

type Pendengar = (k: KuotaOpenAlex) => void;
const pendengar = new Set<Pendengar>();
let kuotaTerakhir: KuotaOpenAlex | null = null;

export function kuotaSaatIni(): KuotaOpenAlex | null {
  return kuotaTerakhir;
}

export function dengarKuota(cb: Pendengar): () => void {
  pendengar.add(cb);
  return () => pendengar.delete(cb);
}

function catatKuota(res: Response) {
  const sisa = res.headers.get('X-RateLimit-Remaining-USD');
  if (sisa == null) return;
  const batas = res.headers.get('X-RateLimit-Limit-USD');
  kuotaTerakhir = { sisaUsd: Number(sisa), batasUsd: batas != null ? Number(batas) : null };
  for (const cb of pendengar) cb(kuotaTerakhir);
}

async function panggil<T>(params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const url = new URL(BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  applyOpenAlexAuth(url);
  const res = await fetch(url, { signal });
  catatKuota(res);
  if (res.status === 429) {
    throw new Error(
      'Kuota harian OpenAlex habis. Tunggu reset (±24 jam) atau isi VITE_OPENALEX_API_KEY di .env untuk kuota lebih besar.',
    );
  }
  if (!res.ok) {
    const teks = await res.text().catch(() => '');
    throw new Error(`OpenAlex mengembalikan status ${res.status}: ${teks.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

/** OpenAlex tidak mendukung wildcard — tanda * membuat permintaan gagal. */
export function bersihkanUntukOpenAlex(query: string): string {
  return query.replace(/\*/g, '');
}

/** Jumlah hasil untuk sebuah string pencarian (1 panggilan search). */
export async function hitungHasil(query: string, signal?: AbortSignal): Promise<number> {
  const data = await panggil<{ meta: { count: number } }>(
    { search: bersihkanUntukOpenAlex(query), per_page: '1', select: 'id' },
    signal,
  );
  return data.meta.count;
}

interface KaryaMentah {
  title: string | null;
  keywords?: Array<{ display_name: string }>;
  abstract_inverted_index: Record<string, number[]> | null;
}

/** Ambil hingga 200 artikel paling relevan untuk ditambang istilahnya (1 panggilan search). */
export async function ambilSampel(query: string, signal?: AbortSignal): Promise<SampelArtikel[]> {
  const data = await panggil<{ results: KaryaMentah[] }>(
    {
      search: bersihkanUntukOpenAlex(query),
      per_page: '200',
      select: 'title,keywords,abstract_inverted_index',
    },
    signal,
  );
  return data.results.map((r) => ({
    judul: r.title ?? '',
    abstrak: reconstructAbstract(r.abstract_inverted_index),
    kataKunci: (r.keywords ?? []).map((k) => k.display_name),
  }));
}

export interface HasilRecallMentah {
  ditemukan: string[];
  tidakTerindeks: string[];
  terlewat: Array<{ doi: string; judul: string; kataKunci: string[] }>;
}

/**
 * Uji apakah string menjaring paper kunci. Per 50 DOI: 1 panggilan search
 * (DOI mana yang terjaring) + 1 panggilan filter (DOI mana yang ada di OpenAlex
 * sama sekali, beserta kata kuncinya untuk saran istilah).
 */
export async function ujiRecall(query: string, doiMentah: string[], signal?: AbortSignal): Promise<HasilRecallMentah> {
  const dois = Array.from(
    new Set(doiMentah.map((d) => normalizeDoi(d)).filter((d): d is string => !!d && !/[|,]/.test(d))),
  );
  const ditemukan = new Set<string>();
  const terindeks = new Map<string, { judul: string; kataKunci: string[] }>();

  for (let i = 0; i < dois.length; i += 50) {
    const kelompok = dois.slice(i, i + 50);
    const filter = `doi:${kelompok.join('|')}`;
    const [cocok, semua] = await Promise.all([
      panggil<{ results: Array<{ doi: string | null }> }>(
        { filter, search: bersihkanUntukOpenAlex(query), select: 'doi', per_page: '50' },
        signal,
      ),
      panggil<{ results: Array<{ doi: string | null; title: string | null; keywords?: Array<{ display_name: string }> }> }>(
        { filter, select: 'doi,title,keywords', per_page: '50' },
        signal,
      ),
    ]);
    for (const r of cocok.results) {
      const d = normalizeDoi(r.doi);
      if (d) ditemukan.add(d);
    }
    for (const r of semua.results) {
      const d = normalizeDoi(r.doi);
      if (d) terindeks.set(d, { judul: r.title ?? '', kataKunci: (r.keywords ?? []).map((k) => k.display_name) });
    }
  }

  return {
    ditemukan: dois.filter((d) => ditemukan.has(d)),
    tidakTerindeks: dois.filter((d) => !terindeks.has(d)),
    terlewat: dois
      .filter((d) => terindeks.has(d) && !ditemukan.has(d))
      .map((d) => ({ doi: d, ...(terindeks.get(d) as { judul: string; kataKunci: string[] }) })),
  };
}
