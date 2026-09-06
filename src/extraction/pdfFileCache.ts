/**
 * Cache in-memory (bukan IndexedDB) untuk File PDF yang dipilih pengguna,
 * berumur selama tab browser terbuka. Sesuai desain Bagian 4, Modul 5: PDF
 * tidak pernah disimpan ke penyimpanan persisten — begitu tab/browser
 * ditutup, pengguna perlu memilih ulang filenya. Selama sesi berjalan,
 * berpindah antar record di dalam aplikasi tidak kehilangan file yang
 * sudah dipilih.
 */
const cache = new Map<string, File>();

export function getCachedPdf(recordId: string): File | undefined {
  return cache.get(recordId);
}

export function setCachedPdf(recordId: string, file: File): void {
  cache.set(recordId, file);
}
