import type { SumberData } from '../types/project';
import type { RecordItem } from '../types/record';
import { normalizeDoi } from '../lib/doi';

/**
 * Bentuk longgar hasil satu entri dari parser format apa pun (BibTeX/RIS/CSV),
 * sebelum dijadikan RecordItem kanonik. Field opsional karena sumber data
 * sering tidak lengkap.
 */
export interface ParsedEntry {
  doi?: string | null;
  judul?: string | null;
  abstrak?: string | null;
  penulis?: string[];
  tahun?: number | null;
  jurnal?: string | null;
  penerbit?: string | null;
  negara?: string[];
  institusi?: string[];
  kataKunci?: string[];
  jumlahSitasi?: number | null;
}

export interface ParseIssue {
  /** Nomor entri/baris (1-based) yang bermasalah, untuk ditampilkan ke pengguna. */
  posisi: number;
  pesan: string;
  cuplikan?: string;
}

export interface ParseResult {
  entries: ParsedEntry[];
  issues: ParseIssue[];
  /** Jumlah entri mentah yang coba diparse (berhasil + gagal), untuk laporan "N dari M". */
  totalMentah: number;
}

/** Ubah satu ParsedEntry menjadi RecordItem siap simpan ke Dexie. */
export function toRecordItem(
  entry: ParsedEntry,
  projectId: string,
  sumber: SumberData,
  sourceFile: string | null,
): RecordItem {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    projectId,
    doi: normalizeDoi(entry.doi ?? null),
    judul: (entry.judul ?? '').trim(),
    abstrak: (entry.abstrak ?? '').trim(),
    penulis: entry.penulis ?? [],
    tahun: entry.tahun ?? null,
    jurnal: (entry.jurnal ?? '').trim(),
    penerbit: (entry.penerbit ?? '').trim(),
    negara: entry.negara ?? [],
    institusi: entry.institusi ?? [],
    kataKunci: entry.kataKunci ?? [],
    jumlahSitasi: entry.jumlahSitasi ?? 0,
    sumber,

    statusDuplikat: 'unik',
    statusSkrining: 'belum',
    labelEksklusi: null,
    catatan: '',
    skorRelevansi: null,
    tanggalKeputusan: null,
    penilai: null,

    duplicateOfId: null,
    similarityScore: null,
    sourceFile,
    diimporPada: now,

    statusFullText: 'belum',
    labelEksklusiFullText: null,
    tanggalKeputusanFullText: null,
    pdfFileName: null,
    pdfTeksEkstraksi: null,
  };
}

/** "Terakhir, Depan" -> "Depan Terakhir". Nama tanpa koma dikembalikan apa adanya. */
export function normalizeAuthorName(raw: string): string {
  const name = raw.trim().replace(/\s+/g, ' ');
  const commaIndex = name.indexOf(',');
  if (commaIndex === -1) return name;
  const last = name.slice(0, commaIndex).trim();
  const first = name.slice(commaIndex + 1).trim();
  if (!first) return last;
  return `${first} ${last}`;
}

/** Ekstrak 4 digit tahun pertama dari string bebas (mis. "2020/05/13" atau "c2019"). */
export function extractYear(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const match = raw.match(/\d{4}/);
  if (!match) return null;
  const year = Number.parseInt(match[0], 10);
  if (year < 1400 || year > 2200) return null;
  return year;
}

/** Pisah string daftar kata kunci dengan pemisah ; atau , menjadi larik bersih. */
export function splitKeywordList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
