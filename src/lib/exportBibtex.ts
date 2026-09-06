import type { RecordItem } from '../types/record';

function escapeBibtex(value: string): string {
  return value.replace(/[{}]/g, '');
}

function citationKey(r: RecordItem, index: number): string {
  const lastName = r.penulis[0]?.split(' ').pop()?.replace(/[^a-zA-Z]/g, '') || 'anon';
  const year = r.tahun ?? 'nd';
  return `${lastName}${year}_${index}`;
}

/** Tulis larik RecordItem sebagai teks BibTeX (Bagian 4, Modul 8 — daftar artikel terpilih). */
export function recordsToBibtex(records: RecordItem[]): string {
  return records
    .map((r, i) => {
      const fields: string[] = [];
      if (r.penulis.length > 0) fields.push(`  author = {${escapeBibtex(r.penulis.join(' and '))}}`);
      if (r.judul) fields.push(`  title = {${escapeBibtex(r.judul)}}`);
      if (r.tahun != null) fields.push(`  year = {${r.tahun}}`);
      if (r.jurnal) fields.push(`  journal = {${escapeBibtex(r.jurnal)}}`);
      if (r.penerbit) fields.push(`  publisher = {${escapeBibtex(r.penerbit)}}`);
      if (r.doi) fields.push(`  doi = {${r.doi}}`);
      if (r.abstrak) fields.push(`  abstract = {${escapeBibtex(r.abstrak)}}`);
      if (r.kataKunci.length > 0) fields.push(`  keywords = {${r.kataKunci.join(', ')}}`);
      return `@article{${citationKey(r, i)},\n${fields.join(',\n')}\n}`;
    })
    .join('\n\n');
}
