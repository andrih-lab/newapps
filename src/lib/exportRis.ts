import type { RecordItem } from '../types/record';

function line(tag: string, value: string): string {
  return `${tag}  - ${value}`;
}

/** Tulis larik RecordItem sebagai teks RIS (Bagian 4, Modul 8 — daftar artikel terpilih). */
export function recordsToRis(records: RecordItem[]): string {
  const blocks = records.map((r) => {
    const lines: string[] = [line('TY', 'JOUR')];
    for (const author of r.penulis) lines.push(line('AU', author));
    if (r.judul) lines.push(line('TI', r.judul));
    if (r.tahun != null) lines.push(line('PY', String(r.tahun)));
    if (r.jurnal) lines.push(line('JO', r.jurnal));
    if (r.penerbit) lines.push(line('PB', r.penerbit));
    if (r.doi) lines.push(line('DO', r.doi));
    if (r.abstrak) lines.push(line('AB', r.abstrak));
    for (const kw of r.kataKunci) lines.push(line('KW', kw));
    lines.push(line('ER', ''));
    return lines.join('\n');
  });
  return blocks.join('\n\n');
}
