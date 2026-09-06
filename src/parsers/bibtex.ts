import type { ParseIssue, ParseResult, ParsedEntry } from './normalize';
import { extractYear, normalizeAuthorName, splitKeywordList } from './normalize';

/**
 * Parser BibTeX ditulis sendiri (tanpa library eksternal) agar bisa toleran
 * terhadap file rusak: entri yang gagal diparse dilewati dan dilaporkan,
 * bukan menggagalkan seluruh impor (Catatan Bagian 9).
 */

interface RawEntry {
  posisi: number;
  type: string;
  body: string;
}

function stripComments(text: string): string {
  // Buang baris komentar '%' di luar entri (heuristik: baris yang diawali '%').
  return text
    .split('\n')
    .map((line) => (line.trimStart().startsWith('%') ? '' : line))
    .join('\n');
}

function splitEntries(text: string): { raws: RawEntry[]; issues: ParseIssue[] } {
  const issues: ParseIssue[] = [];
  const raws: RawEntry[] = [];
  const entryStart = /@\s*([a-zA-Z]+)\s*\{/g;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = entryStart.exec(text)) !== null) {
    index++;
    const type = match[1].toLowerCase();
    if (type === 'comment' || type === 'string' || type === 'preamble') {
      continue;
    }
    const bodyStart = entryStart.lastIndex;
    let depth = 1;
    let i = bodyStart;
    for (; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) {
      issues.push({
        posisi: index,
        pesan: `Entri @${type} tidak memiliki kurung kurawal penutup yang seimbang, entri dilewati.`,
        cuplikan: text.slice(match.index, Math.min(match.index + 80, text.length)),
      });
      break; // sisa teks tidak bisa diandalkan strukturnya
    }
    raws.push({ posisi: index, type, body: text.slice(bodyStart, i) });
    entryStart.lastIndex = i + 1;
  }

  return { raws, issues };
}

/** Pecah body entri menjadi potongan-potongan level-atas berdasarkan koma,
 * dengan menghormati nesting {} dan string "..." agar koma di dalam judul
 * tidak ikut memecah. */
function splitTopLevel(body: string): string[] {
  const chunks: string[] = [];
  let depth = 0;
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '"' && depth === 0) {
      inQuotes = !inQuotes;
      current += ch;
      continue;
    }
    if (!inQuotes) {
      if (ch === '{') depth++;
      else if (ch === '}') depth = Math.max(0, depth - 1);
    }
    if (ch === ',' && depth === 0 && !inQuotes) {
      chunks.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

function stripDelimiters(value: string): string {
  let v = value.trim();
  if (v.length >= 2 && v.startsWith('{') && v.endsWith('}')) {
    v = v.slice(1, -1);
  } else if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    v = v.slice(1, -1);
  }
  // Buang sisa kurung kurawal proteksi-kapital (mis. {D}eep -> Deep) dan rapikan spasi.
  v = v.replace(/[{}]/g, '');
  v = v.replace(/\s+/g, ' ').trim();
  return v;
}

function parseFields(body: string): Map<string, string> {
  const fields = new Map<string, string>();
  const chunks = splitTopLevel(body);
  // Chunk pertama adalah citation key jika tidak mengandung '=' di level atas.
  const start = chunks.length > 0 && !chunks[0].includes('=') ? 1 : 0;

  for (let i = start; i < chunks.length; i++) {
    const chunk = chunks[i];
    const eqIndex = chunk.indexOf('=');
    if (eqIndex === -1) continue;
    const name = chunk.slice(0, eqIndex).trim().toLowerCase();
    const rawValue = chunk.slice(eqIndex + 1);
    if (!name) continue;
    fields.set(name, stripDelimiters(rawValue));
  }
  return fields;
}

export function parseBibtex(text: string): ParseResult {
  const cleaned = stripComments(text);
  const { raws, issues } = splitEntries(cleaned);
  const entries: ParsedEntry[] = [];

  for (const raw of raws) {
    try {
      const fields = parseFields(raw.body);
      const judul = fields.get('title') ?? '';
      if (!judul) {
        issues.push({
          posisi: raw.posisi,
          pesan: `Entri @${raw.type} tidak memiliki field "title", entri dilewati.`,
        });
        continue;
      }

      const authorField = fields.get('author') ?? '';
      const penulis = authorField
        ? authorField
            .split(/\s+and\s+/i)
            .map((a) => normalizeAuthorName(a))
            .filter(Boolean)
        : [];

      entries.push({
        doi: fields.get('doi') ?? null,
        judul,
        abstrak: fields.get('abstract') ?? '',
        penulis,
        tahun: extractYear(fields.get('year')),
        jurnal: fields.get('journal') ?? fields.get('booktitle') ?? '',
        penerbit: fields.get('publisher') ?? '',
        negara: [],
        kataKunci: splitKeywordList(fields.get('keywords')),
        jumlahSitasi: null,
      });
    } catch (err) {
      issues.push({
        posisi: raw.posisi,
        pesan: `Gagal memparse entri @${raw.type}: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return { entries, issues, totalMentah: raws.length };
}
