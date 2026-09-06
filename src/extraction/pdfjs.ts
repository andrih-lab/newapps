import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

/**
 * PDF dibaca dengan pdf.js (Bagian 3 & 4, Modul 5). Parsing berat sudah
 * didelegasikan pdf.js sendiri ke worker internalnya (pdf.worker.min.mjs) —
 * memanggilnya dari thread utama di sini TIDAK melanggar aturan "parsing
 * berat di Web Worker", karena parsing dokumen tetap berjalan di luar
 * thread utama.
 */
GlobalWorkerOptions.workerSrc = workerSrc;

export { getDocument };
export type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

/** Ekstrak teks tiap halaman secara terpisah (untuk cache pencarian dalam dokumen). */
export async function extractPagesText(doc: import('pdfjs-dist').PDFDocumentProxy): Promise<string[]> {
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    pages.push(text);
  }
  return pages;
}

/** Gabungkan teks per halaman menjadi satu teks dengan penanda halaman, untuk disimpan (RecordItem.pdfTeksEkstraksi). */
export function joinPagesWithMarkers(pages: string[]): string {
  return pages.map((text, i) => `\n[Halaman ${i + 1}]\n${text}`).join('\n');
}
