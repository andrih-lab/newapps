import { kunciStem } from './text';

/**
 * Pecah topik bebas menjadi blok konsep, mis.
 * "local ecological knowledge of mangroves in Southeast Asia"
 *   → ["local ecological knowledge", "mangroves", "Southeast Asia"].
 *
 * Deterministik dan sengaja sederhana: memotong di kata penghubung dan tanda
 * baca, lalu membuang kata pembuka yang bukan konsep ("the effect of",
 * "pengaruh"). Pengguna selalu bisa mengganti nama, menggabung, atau menghapus
 * blok hasilnya — pemecahan ini hanya titik awal.
 */

const PEMISAH =
  /\s+(?:of|in|on|for|and|among|at|by|with|across|within|to|from|versus|vs\.?|terhadap|di|pada|dan|dalam|untuk|bagi|dengan|serta|antara|oleh|tentang)\s+|[,;:()?]/i;

const PEMBUKA = [
  'systematic literature review', 'systematic review', 'literature review', 'bibliometric analysis',
  'meta-analysis', 'the effects', 'the effect', 'effects', 'effect', 'the impacts', 'the impact', 'impacts',
  'impact', 'the role', 'role', 'the influence', 'influence', 'relationship', 'relationships',
  'assessment', 'analysis', 'review', 'studies', 'study', 'the', 'a', 'an', 'how', 'what',
  'tinjauan sistematis', 'analisis bibliometrik', 'pengaruh', 'dampak', 'peran', 'hubungan',
  'analisis', 'kajian', 'studi', 'tinjauan',
].sort((x, y) => y.length - x.length);

function buangPembuka(bagian: string): string {
  let s = bagian.trim();
  let berubah = true;
  while (berubah && s) {
    berubah = false;
    const lower = s.toLowerCase();
    for (const kata of PEMBUKA) {
      if (lower === kata) return '';
      if (lower.startsWith(`${kata} `)) {
        s = s.slice(kata.length).trim();
        berubah = true;
        break;
      }
    }
  }
  return s;
}

export function pecahTopik(topik: string): string[] {
  const hasil: string[] = [];
  const terlihat = new Set<string>();
  for (const mentah of topik.split(PEMISAH)) {
    const bersih = buangPembuka((mentah ?? '').replace(/["']/g, ''));
    if (bersih.length < 2) continue;
    const kunci = kunciStem(bersih);
    if (terlihat.has(kunci)) continue;
    terlihat.add(kunci);
    hasil.push(bersih);
  }
  return hasil;
}
