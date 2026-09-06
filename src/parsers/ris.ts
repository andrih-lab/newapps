import type { ParseIssue, ParseResult, ParsedEntry } from './normalize';
import { extractYear, normalizeAuthorName } from './normalize';

/**
 * Parser RIS ditulis sendiri, toleran terhadap variasi spasi di sekitar tanda
 * '-' dan baris lanjutan tanpa tag (umum terjadi pada field abstrak panjang).
 */

const TAG_LINE = /^([A-Z][A-Z0-9])\s*-\s?(.*)$/;

interface RawTag {
  tag: string;
  value: string;
}

function splitEntries(text: string): { blocks: RawTag[][]; issues: ParseIssue[] } {
  const issues: ParseIssue[] = [];
  const lines = text.split(/\r\n|\r|\n/);
  const blocks: RawTag[][] = [];
  let current: RawTag[] = [];
  let entryIndex = 0;
  let lastTagIndex = -1;

  for (const rawLine of lines) {
    const line = rawLine.replace(/﻿/g, '');
    if (!line.trim()) continue;

    const match = line.match(TAG_LINE);
    if (match) {
      const tag = match[1].toUpperCase();
      const value = match[2].trim();

      if (tag === 'TY') {
        if (current.length > 0) {
          entryIndex++;
          issues.push({
            posisi: entryIndex,
            pesan: 'Entri baru (TY) ditemukan sebelum penanda akhir (ER) entri sebelumnya; entri sebelumnya tetap disimpan apa adanya.',
          });
          blocks.push(current);
        }
        current = [];
        current.push({ tag, value });
        lastTagIndex = current.length - 1;
        continue;
      }

      if (tag === 'ER') {
        entryIndex++;
        blocks.push(current);
        current = [];
        lastTagIndex = -1;
        continue;
      }

      current.push({ tag, value });
      lastTagIndex = current.length - 1;
      continue;
    }

    // Baris lanjutan tanpa tag: gabungkan ke value tag terakhir.
    if (lastTagIndex >= 0 && current[lastTagIndex]) {
      current[lastTagIndex].value = `${current[lastTagIndex].value} ${line.trim()}`.trim();
    }
  }

  if (current.length > 0) {
    entryIndex++;
    issues.push({
      posisi: entryIndex,
      pesan: 'Entri terakhir tidak memiliki penanda akhir (ER), tetap dicoba diparse.',
    });
    blocks.push(current);
  }

  return { blocks, issues };
}

export function parseRis(text: string): ParseResult {
  const { blocks, issues } = splitEntries(text);
  const entries: ParsedEntry[] = [];

  blocks.forEach((tags, idx) => {
    const posisi = idx + 1;
    const fields = new Map<string, string[]>();
    for (const { tag, value } of tags) {
      if (!value) continue;
      const list = fields.get(tag) ?? [];
      list.push(value);
      fields.set(tag, list);
    }

    const get = (tag: string): string | undefined => fields.get(tag)?.[0];
    const judul = get('TI') ?? get('T1') ?? '';
    if (!judul) {
      issues.push({ posisi, pesan: 'Entri tidak memiliki field judul (TI/T1), entri dilewati.' });
      return;
    }

    const authorTags = ['AU', 'A1', 'A2', 'A3'].flatMap((t) => fields.get(t) ?? []);
    const penulis = authorTags.map((a) => normalizeAuthorName(a)).filter(Boolean);

    const tahunRaw = get('PY') ?? get('Y1') ?? get('DA');

    entries.push({
      doi: get('DO') ?? get('DOI') ?? null,
      judul,
      abstrak: get('AB') ?? get('N2') ?? '',
      penulis,
      tahun: extractYear(tahunRaw),
      jurnal: get('JO') ?? get('JF') ?? get('T2') ?? get('J2') ?? '',
      penerbit: get('PB') ?? '',
      negara: [],
      kataKunci: fields.get('KW') ?? [],
      jumlahSitasi: null,
    });
  });

  return { entries, issues, totalMentah: blocks.length };
}
