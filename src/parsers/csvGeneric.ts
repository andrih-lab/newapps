import Papa from 'papaparse';
import type { ParseIssue } from './normalize';

export interface CsvParseResult {
  headers: string[];
  rows: Array<Record<string, string>>;
  issues: ParseIssue[];
}

/**
 * Parsing CSV mentah dengan PapaParse (deteksi delimiter otomatis, toleran
 * kutip/koma di dalam sel). Baris yang gagal diparse dilaporkan sebagai issue
 * tapi tidak menggagalkan keseluruhan file.
 */
export function parseCsvRows(text: string): CsvParseResult {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const issues: ParseIssue[] = result.errors.map((e) => ({
    posisi: (e.row ?? 0) + 1,
    pesan: `${e.message} (kode: ${e.code})`,
  }));

  return {
    headers: result.meta.fields ?? [],
    rows: result.data.filter((r) => Object.values(r).some((v) => (v ?? '').toString().trim() !== '')),
    issues,
  };
}

/**
 * Baca header CSV secara cepat (preview 1 baris) tanpa memparse seluruh file.
 * Dipakai di main thread untuk menampilkan dialog pemetaan kolom sebelum
 * parsing penuh dijalankan di Web Worker.
 */
export function previewCsvHeaders(text: string): string[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    preview: 1,
    skipEmptyLines: true,
  });
  return result.meta.fields ?? [];
}

/** Cari nama kolom aktual yang paling cocok dengan salah satu kandidat (case-insensitive). */
export function findColumn(headers: string[], candidates: string[]): string | null {
  const normalized = headers.map((h) => ({ original: h, lower: h.trim().toLowerCase() }));
  for (const candidate of candidates) {
    const target = candidate.trim().toLowerCase();
    const found = normalized.find((h) => h.lower === target);
    if (found) return found.original;
  }
  return null;
}

export function splitSemicolonList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}
