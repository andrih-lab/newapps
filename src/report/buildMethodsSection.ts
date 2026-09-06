import { Paragraph } from 'docx';
import type { ReportData } from './gatherReportData';
import type { SumberData, FilterPencarian } from '../types/project';
import { h1, h2, p, pBold, bullet, formatTanggal } from './reportHelpers';

const SUMBER_LABEL: Record<SumberData, string> = {
  openalex: 'OpenAlex',
  crossref: 'Crossref',
  semantic_scholar: 'Semantic Scholar',
  europe_pmc: 'Europe PMC',
  bibtex: 'file BibTeX',
  ris: 'file RIS',
  csv_scopus: 'file CSV Scopus',
  csv_wos: 'file CSV Web of Science',
  csv_generik: 'file CSV generik',
  manual: 'input manual',
};

const SUMBER_FILE: SumberData[] = ['bibtex', 'ris', 'csv_scopus', 'csv_wos', 'csv_generik', 'manual'];

function formatFilter(filter: FilterPencarian): string {
  const bagian: string[] = [];
  if (filter.tahunMulai || filter.tahunAkhir) {
    bagian.push(`tahun ${filter.tahunMulai ?? '…'}–${filter.tahunAkhir ?? '…'}`);
  }
  if (filter.jenisDokumen && filter.jenisDokumen.length > 0) {
    bagian.push(`jenis dokumen ${filter.jenisDokumen.join(', ')}`);
  }
  if (filter.bahasa && filter.bahasa.length > 0) {
    bagian.push(`bahasa ${filter.bahasa.join(', ')}`);
  }
  return bagian.length > 0 ? `, dibatasi ${bagian.join('; ')}` : '';
}

/** Bab Metode: desain review, sumber data, kriteria, prosedur seleksi & ekstraksi (Bagian 4, Modul 7). */
export function buildMethodsSection(data: ReportData): Paragraph[] {
  const out: Paragraph[] = [];

  out.push(h1('Metode'));

  out.push(h2('Desain Review'));
  out.push(
    p(
      'Kajian ini disusun mengikuti pedoman Preferred Reporting Items for Systematic Reviews and Meta-Analyses ' +
        '(PRISMA) 2020 (Page et al., 2021) untuk pelaporan proses identifikasi, penyaringan, dan penyertaan studi.',
    ),
  );
  if (data.project.pertanyaanPenelitian) {
    out.push(p(`Pertanyaan penelitian yang menjadi acuan pencarian dan penyaringan: "${data.project.pertanyaanPenelitian}"`));
  }

  out.push(h2('Sumber Data dan Strategi Pencarian'));
  if (data.searchQueries.length === 0) {
    out.push(p('Tidak ada pencarian basis data terintegrasi yang tercatat pada proyek ini.'));
  }
  for (const q of data.searchQueries) {
    out.push(
      p(
        `Pencarian pada database ${SUMBER_LABEL[q.sumber]} dilakukan pada ${formatTanggal(q.tanggal)}, menggunakan ` +
          `string pencarian: "${q.stringQuery}"${formatFilter(q.filter)}, menghasilkan ${q.jumlahHasil} record.`,
      ),
    );
  }
  const fileCounts = SUMBER_FILE.map((s) => ({ s, n: data.allRecords.filter((r) => r.sumber === s).length })).filter(
    (x) => x.n > 0,
  );
  if (fileCounts.length > 0) {
    out.push(
      p(
        `Selain pencarian basis data terintegrasi, record juga diimpor dari file eksternal: ${fileCounts
          .map((x) => `${x.n} record dari ${SUMBER_LABEL[x.s]}`)
          .join('; ')}.`,
      ),
    );
  }

  out.push(h2('Kriteria Inklusi dan Eksklusi'));
  const inklusi = data.criteria.filter((c) => c.tipe === 'inklusi');
  const eksklusi = data.criteria.filter((c) => c.tipe === 'eksklusi');
  out.push(pBold('Kriteria Inklusi:'));
  if (inklusi.length === 0) out.push(p('Belum ditetapkan pada proyek ini.'));
  for (const c of inklusi) out.push(bullet(c.deskripsi ? `${c.label} — ${c.deskripsi}` : c.label));
  out.push(pBold('Kriteria Eksklusi:'));
  if (eksklusi.length === 0) out.push(p('Belum ditetapkan pada proyek ini.'));
  for (const c of eksklusi) out.push(bullet(c.deskripsi ? `${c.label} — ${c.deskripsi}` : c.label));

  out.push(h2('Prosedur Deduplikasi dan Seleksi'));
  out.push(
    p(
      `Deduplikasi dilakukan dua tahap: (1) kecocokan DOI ternormalisasi, (2) kemiripan judul Jaro-Winkler ` +
        `(ambang ≥ 0,90) yang dikonfirmasi kesamaan tahun dan kemiripan nama penulis pertama (≥ 0,70); ` +
        `kandidat tahap kedua ditinjau manual sebelum ditandai duplikat. Proses ini mengeliminasi ` +
        `${data.prisma.duplikatDibuang} dari ${data.prisma.identifikasi.total} record hasil identifikasi.`,
    ),
  );
  const penilaiUnik = Array.from(
    new Set(data.screeningLogs.map((l) => l.penilai).filter((x): x is string => !!x && x.trim() !== '')),
  );
  const jumlahPenilai = penilaiUnik.length > 0 ? penilaiUnik.length : 1;
  out.push(
    p(
      `Skrining judul dan abstrak dilakukan oleh ${jumlahPenilai} penilai${
        penilaiUnik.length > 0 ? ` (${penilaiUnik.join(', ')})` : ''
      } terhadap ${data.prisma.disaring} record, mengeksklusi ${data.prisma.dieksklusiSkrining.total} record. ` +
        'Skrining ganda (dua penilai independen per record) beserta penghitungan kappa Cohen belum diterapkan ' +
        'pada versi aplikasi ini, sehingga penyelesaian ketidaksepakatan antar-penilai tidak berlaku di sini.',
    ),
  );

  out.push(h2('Metode Prioritisasi Skrining'));
  out.push(
    p(
      'Urutan artikel yang disajikan saat skrining ditentukan tanpa model bahasa apa pun, meniru pendekatan ' +
        'ASReview. Pada tahap awal (hingga sekitar 25 keputusan pertama), separuh urutan disusun dari kemiripan ' +
        'TF-IDF (cosine similarity) antara judul+abstrak setiap record dan teks gabungan pertanyaan penelitian ' +
        'beserta kriteria inklusi, dan separuh lagi disusun acak. Setelahnya, model Naive Bayes multinomial ' +
        '(bag-of-words, Laplace smoothing α=1) dilatih ulang di setiap keputusan baru dari data "masuk"/"tolak" ' +
        'yang terkumpul, dan sisa korpus diurutkan menurun berdasarkan probabilitas relevansi hasil model tersebut.',
    ),
  );

  out.push(h2('Prosedur Ekstraksi Data'));
  out.push(
    p(
      `Studi yang lolos skrining abstrak dan dinyatakan layak pada penilaian full teks diekstraksi ke dalam ` +
        `matriks dengan kolom: ${data.matrixColumns.map((c) => c.label).join(', ')}. Setiap isian penting ` +
        `disertai kutipan verbatim (potongan kalimat asli beserta nomor halaman) agar dapat ditelusuri kembali ` +
        `ke sumbernya. Sebagai alternatif, pengisian dapat dilakukan di luar aplikasi memakai template CSV yang ` +
        `divalidasi saat diunggah kembali (pencocokan judul dengan kemiripan Jaro-Winkler, ambang ≥ 0,85).`,
    ),
  );

  return out;
}
