const DOI_URL_PREFIXES = [
  'https://doi.org/',
  'http://doi.org/',
  'https://dx.doi.org/',
  'http://dx.doi.org/',
  'doi:',
];

/**
 * Normalisasi DOI untuk pencocokan: huruf kecil, buang prefiks URL/skema,
 * dan buang spasi di ujung. Mengembalikan null bila input kosong.
 * Sesuai Modul 2 tahap 1 (Bagian 4).
 */
export function normalizeDoi(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value = raw.trim();
  if (!value) return null;

  const lower = value.toLowerCase();
  for (const prefix of DOI_URL_PREFIXES) {
    if (lower.startsWith(prefix)) {
      value = value.slice(prefix.length);
      break;
    }
  }

  value = value.trim().toLowerCase();
  return value || null;
}
