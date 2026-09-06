/**
 * Implementasi Jaro-Winkler similarity, ditulis sendiri agar rumus bisa
 * dikutip di halaman metodologi (Bagian 4, Modul 2 tahap 2).
 *
 * Rumus Jaro:
 *   Jaro(s1, s2) = (1/3) * (m/|s1| + m/|s2| + (m - t)/m)
 * di mana m = jumlah karakter yang cocok (matching characters),
 * t = jumlah transposisi / 2.
 *
 * Rumus Jaro-Winkler:
 *   JW = Jaro + L * p * (1 - Jaro)
 * di mana L = panjang prefiks sama persis (maks 4), p = konstanta skala
 * prefiks (bawaan 0.1, standar Winkler 1990).
 *
 * Referensi: Winkler, W. E. (1990). "String Comparator Metrics and Enhanced
 * Decision Rules in the Fellegi-Sunter Model of Record Linkage."
 */

const PREFIX_SCALE = 0.1;
const MAX_PREFIX_LENGTH = 4;

function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matchDistance = Math.max(0, Math.floor(Math.max(len1, len2) / 2) - 1);

  const s1Matches = new Array<boolean>(len1).fill(false);
  const s2Matches = new Array<boolean>(len2).fill(false);

  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  transpositions = transpositions / 2;

  return (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3;
}

/** Kemiripan Jaro-Winkler antara dua string, 0..1. Tidak case-sensitive. */
export function jaroWinklerSimilarity(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const jaro = jaroSimilarity(s1, s2);

  let prefixLength = 0;
  const maxPrefix = Math.min(MAX_PREFIX_LENGTH, s1.length, s2.length);
  while (prefixLength < maxPrefix && s1[prefixLength] === s2[prefixLength]) {
    prefixLength++;
  }

  return jaro + prefixLength * PREFIX_SCALE * (1 - jaro);
}
