import type { OpenAlexSearchParams, OpenAlexWork, OpenAlexWorksResponse } from '../types/openalex';
import type { ParsedEntry } from '../parsers/normalize';

/**
 * Klien OpenAlex Works API, dipanggil LANGSUNG dari browser (tanpa proxy),
 * sesuai keputusan Pekan 1: key ditaruh di .env (VITE_OPENALEX_API_KEY),
 * proxy serverless menyusul nanti (Bagian 3 dokumen rancang-bangun).
 *
 * CATATAN (Bagian 9): ketentuan API key OpenAlex berubah awal 2026 — periksa
 * https://docs.openalex.org sebelum rilis produksi, tautan ini juga
 * dirujuk di halaman metodologi aplikasi.
 */

const OPENALEX_BASE_URL = 'https://api.openalex.org/works';
const MAX_PER_PAGE = 200;

export interface OpenAlexProgress {
  diambil: number;
  total: number;
}

function buildFilter(params: OpenAlexSearchParams): string {
  const clauses: string[] = [];
  if (params.tahunMulai) clauses.push(`from_publication_date:${params.tahunMulai}-01-01`);
  if (params.tahunAkhir) clauses.push(`to_publication_date:${params.tahunAkhir}-12-31`);
  if (params.jenisDokumen && params.jenisDokumen.length > 0) {
    clauses.push(`type:${params.jenisDokumen.join('|')}`);
  }
  if (params.bahasa && params.bahasa.length > 0) {
    clauses.push(`language:${params.bahasa.join('|')}`);
  }
  return clauses.join(',');
}

function buildUrl(query: string, filter: string, perPage: number, cursor: string): string {
  const url = new URL(OPENALEX_BASE_URL);
  if (query.trim()) url.searchParams.set('search', query.trim());
  if (filter) url.searchParams.set('filter', filter);
  url.searchParams.set('per-page', String(perPage));
  url.searchParams.set('cursor', cursor);

  const apiKey = import.meta.env.VITE_OPENALEX_API_KEY;
  const mailto = import.meta.env.VITE_OPENALEX_MAILTO;
  if (apiKey) url.searchParams.set('api_key', apiKey);
  if (mailto) url.searchParams.set('mailto', mailto);

  return url.toString();
}

async function safeErrorText(res: Response): Promise<string> {
  try {
    const body = await res.text();
    return body.slice(0, 300);
  } catch {
    return '(tidak bisa membaca isi respons)';
  }
}

/**
 * Rekonstruksi abstract_inverted_index OpenAlex menjadi teks biasa.
 * Format: { "kata": [posisi0, posisi1, ...], ... } -> urutkan berdasar posisi.
 */
export function reconstructAbstract(invertedIndex: Record<string, number[]> | null): string {
  if (!invertedIndex) return '';
  const positions: Array<[number, string]> = [];
  for (const [word, idxs] of Object.entries(invertedIndex)) {
    for (const i of idxs) positions.push([i, word]);
  }
  positions.sort((a, b) => a[0] - b[0]);
  return positions.map(([, w]) => w).join(' ');
}

export function openAlexWorkToParsedEntry(work: OpenAlexWork): ParsedEntry {
  const negaraSet = new Set<string>();
  const institusiSet = new Set<string>();
  for (const authorship of work.authorships) {
    for (const code of authorship.countries ?? []) negaraSet.add(code);
    for (const inst of authorship.institutions) {
      if (inst.country_code) negaraSet.add(inst.country_code);
      if (inst.display_name) institusiSet.add(inst.display_name);
    }
  }

  return {
    doi: work.doi,
    judul: work.title ?? work.display_name ?? '',
    abstrak: reconstructAbstract(work.abstract_inverted_index),
    penulis: work.authorships.map((a) => a.author.display_name).filter(Boolean),
    tahun: work.publication_year,
    jurnal: work.primary_location?.source?.display_name ?? '',
    penerbit: work.primary_location?.source?.host_organization_name ?? '',
    negara: Array.from(negaraSet),
    institusi: Array.from(institusiSet),
    kataKunci: (work.keywords ?? []).map((k) => k.display_name),
    jumlahSitasi: work.cited_by_count,
  };
}

/**
 * Ambil seluruh hasil pencarian OpenAlex Works dengan paginasi cursor,
 * dipanggil bertahap dengan callback progres (Bagian 4, Modul 1a).
 */
export async function searchOpenAlex(
  params: OpenAlexSearchParams,
  onProgress?: (p: OpenAlexProgress) => void,
  signal?: AbortSignal,
): Promise<OpenAlexWork[]> {
  const perPage = Math.min(params.perPage ?? MAX_PER_PAGE, MAX_PER_PAGE);
  const filter = buildFilter(params);
  const results: OpenAlexWork[] = [];
  let cursor: string | null = '*';
  let total = 0;

  while (cursor) {
    const url = buildUrl(params.query, filter, perPage, cursor);
    const res = await fetch(url, { signal });
    if (!res.ok) {
      throw new Error(`OpenAlex mengembalikan status ${res.status}: ${await safeErrorText(res)}`);
    }
    const data = (await res.json()) as OpenAlexWorksResponse;
    total = data.meta.count;
    results.push(...data.results);
    onProgress?.({ diambil: results.length, total });

    if (data.results.length === 0) break;
    cursor = data.meta.next_cursor;
  }

  return results;
}
