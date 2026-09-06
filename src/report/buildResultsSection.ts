import { Paragraph, Table } from 'docx';
import type { ReportData } from './gatherReportData';
import { h1, h2, p, simpleTable } from './reportHelpers';

function topN(map: Array<{ nama: string; jumlah: number }>, n: number): string {
  if (map.length === 0) return '(tidak ada data)';
  return map
    .slice(0, n)
    .map((x) => `${x.nama} (${x.jumlah})`)
    .join(', ');
}

function tally(items: string[]): Array<{ nama: string; jumlah: number }> {
  const map = new Map<string, number>();
  for (const raw of items) {
    const item = raw.trim();
    if (!item) continue;
    map.set(item, (map.get(item) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([nama, jumlah]) => ({ nama, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah);
}

/** Bab Hasil deskriptif: hasil seleksi, karakteristik studi, ringkasan bibliometrik (Bagian 4, Modul 7). */
export function buildResultsSection(data: ReportData): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [];
  const { prisma } = data;

  out.push(h1('Hasil'));

  out.push(h2('Hasil Seleksi'));
  out.push(
    p(
      `Proses seleksi menghasilkan total ${prisma.identifikasi.total} record dari tahap identifikasi. ` +
        `Sebanyak ${prisma.duplikatDibuang} record ditandai duplikat, sehingga ${prisma.disaring} record ` +
        `disaring pada tahap judul dan abstrak; ${prisma.dieksklusiSkrining.total} di antaranya dieksklusi. ` +
        `Dari ${prisma.dinilaiFullText} record yang dinilai kelayakan full teks, ${prisma.dieksklusiFullText.total} ` +
        `dieksklusi, sehingga ${prisma.disertakan} studi disertakan dalam sintesis akhir. Diagram alur PRISMA ` +
        `lengkap tersedia di halaman PRISMA aplikasi dan dapat diunduh sebagai PNG/SVG/PDF untuk disisipkan ` +
        `sebagai Gambar 1 pada dokumen ini.`,
    ),
  );
  out.push(
    simpleTable(
      ['Tahap', 'Jumlah'],
      [
        ['Identifikasi', String(prisma.identifikasi.total)],
        ['Duplikat dibuang', String(prisma.duplikatDibuang)],
        ['Disaring (judul & abstrak)', String(prisma.disaring)],
        ['Dieksklusi (skrining abstrak)', String(prisma.dieksklusiSkrining.total)],
        ['Dinilai kelayakan full teks', String(prisma.dinilaiFullText)],
        ['Dieksklusi (full teks)', String(prisma.dieksklusiFullText.total)],
        ['Disertakan dalam sintesis', String(prisma.disertakan)],
      ],
    ),
  );

  out.push(h2('Karakteristik Studi Terpilih'));
  if (data.includedRecords.length === 0) {
    out.push(
      p(
        'Belum ada studi yang dinyatakan disertakan (tahap penilaian full teks belum selesai, atau belum ada ' +
          'studi yang dinyatakan layak).',
      ),
    );
  } else {
    const tahunList = data.includedRecords.map((r) => r.tahun).filter((t): t is number => t != null);
    const rentangTahun =
      tahunList.length > 0 ? `${Math.min(...tahunList)}–${Math.max(...tahunList)}` : 'tidak diketahui';
    const negara = tally(data.includedRecords.flatMap((r) => r.negara));
    const jurnal = tally(data.includedRecords.map((r) => r.jurnal));
    const desain = tally(
      data.includedRecords.map((r) => data.extractionByRecordId.get(r.id)?.kolom.desainPenelitian ?? ''),
    );

    out.push(
      p(
        `Studi yang disertakan (n=${data.includedRecords.length}) diterbitkan pada rentang tahun ${rentangTahun}. ` +
          `Negara/lokasi yang paling sering muncul: ${topN(negara, 5)}. Jurnal yang paling banyak menyumbang ` +
          `studi: ${topN(jurnal, 5)}.` +
          (desain.length > 0 ? ` Desain penelitian yang tercatat pada matriks ekstraksi: ${topN(desain, 5)}.` : ''),
      ),
    );

    out.push(
      simpleTable(
        ['Penulis', 'Tahun', 'Negara', 'Jurnal', 'Desain Penelitian'],
        data.includedRecords.map((r) => [
          r.penulis[0] ? `${r.penulis[0]}${r.penulis.length > 1 ? ' dkk.' : ''}` : '(tidak diketahui)',
          r.tahun != null ? String(r.tahun) : '—',
          r.negara.join(', ') || '—',
          r.jurnal || '—',
          data.extractionByRecordId.get(r.id)?.kolom.desainPenelitian || '—',
        ]),
      ),
    );
  }

  out.push(h2('Ringkasan Bibliometrik'));
  if (data.nonDuplicateRecords.length === 0) {
    out.push(p('Tidak ada data untuk dianalisis secara bibliometrik.'));
  } else {
    const bm = data.bibliometrics;
    const tahunProduksi = bm.annualProduction.map((a) => a.tahun);
    const rentang = tahunProduksi.length > 0 ? `${Math.min(...tahunProduksi)}–${Math.max(...tahunProduksi)}` : '—';
    const mostCited = bm.mostCited[0];

    out.push(
      p(
        `Analisis bibliometrik terhadap ${data.nonDuplicateRecords.length} record non-duplikat menunjukkan ` +
          `produksi tahunan pada rentang ${rentang}. Penulis paling produktif: ${topN(bm.topAuthors, 3)}. ` +
          `Jurnal paling produktif: ${topN(bm.topJournals, 3)}. Negara paling produktif: ${topN(bm.topCountries, 3)}.` +
          (mostCited
            ? ` Artikel paling banyak disitasi: "${mostCited.judul}" (${mostCited.jumlahSitasi} sitasi).`
            : '') +
          ` Estimasi eksponen Hukum Lotka dari data: ${bm.lotka.eksponen.toFixed(2)} (nilai teoritis = 2,00). ` +
          `Zona inti Bradford memuat ${bm.bradford.jurnalPerZona[0] ?? 0} jurnal dari total ${bm.bradford.totalJurnal} ` +
          `jurnal. Rincian lengkap (grafik, tabel) tersedia di halaman Bibliometrik aplikasi.`,
      ),
    );
  }

  return out;
}
