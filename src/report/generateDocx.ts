import { Document, HeadingLevel, Packer, Paragraph } from 'docx';
import type { ReportData } from './gatherReportData';
import { buildMethodsSection } from './buildMethodsSection';
import { buildResultsSection } from './buildResultsSection';
import { p, pBold } from './reportHelpers';

/**
 * Rakit Bab Metode & Hasil menjadi satu file .docx (Bagian 4, Modul 7).
 * Berbasis template, deterministik, tanpa model bahasa — hanya menyusun
 * kalimat dari data yang sudah tercatat di aplikasi.
 */
export async function generateReportDocx(data: ReportData): Promise<Blob> {
  const pembuka: Paragraph[] = [
    new Paragraph({ text: data.project.nama, heading: HeadingLevel.TITLE }),
    pBold('Draf Bab Metode & Hasil — dihasilkan otomatis oleh aplikasi Telaah'),
    p(
      'PENTING: Dokumen ini hanya memuat draf Bab Metode dan Bab Hasil deskriptif, disusun deterministik dari ' +
        'data yang tercatat di aplikasi, tanpa model bahasa apa pun. Bab Pendahuluan, Diskusi, dan Kesimpulan ' +
        'sengaja tidak dibuat otomatis — bagian-bagian tersebut adalah kontribusi intelektual penulis, dan ' +
        'pembuatan otomatis untuk bagian itu berisiko menimbulkan fabrikasi. Tinjau, sunting, dan lengkapi ' +
        'draf ini sebelum digunakan.',
    ),
  ];

  const doc = new Document({
    sections: [
      {
        children: [...pembuka, ...buildMethodsSection(data), ...buildResultsSection(data)],
      },
    ],
  });

  return Packer.toBlob(doc);
}
