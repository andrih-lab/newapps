function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Ubah larik objek menjadi teks CSV (delimiter koma, header dari kunci objek pertama).
 * Parameter diketik sebagai `object` (bukan `Record<string, unknown>`) agar interface
 * kanonik seperti RecordItem/ProducerCount bisa dioper langsung tanpa cast.
 */
export function toCsv(rows: ReadonlyArray<object>, columns?: string[]): string {
  if (rows.length === 0) return '';
  const first = rows[0] as Record<string, unknown>;
  const cols = columns ?? Object.keys(first);
  const header = cols.map(escapeCsvCell).join(',');
  const lines = rows.map((row) => cols.map((c) => escapeCsvCell((row as Record<string, unknown>)[c])).join(','));
  return [header, ...lines].join('\r\n');
}

/** Unduh string CSV sebagai file di browser pengguna. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(filename, blob);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
