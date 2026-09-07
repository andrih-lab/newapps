import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="mt-1 space-y-2 text-sm text-gray-600">{children}</div>
    </div>
  );
}

export function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Panduan Penggunaan</h1>
        <p className="mt-2 text-sm text-gray-600">
          Urutan penggunaan Telaah dari awal sampai draf Bab Metode &amp; Hasil siap diunduh. Setiap tahap
          bekerja sepenuhnya di peramban Anda — tidak ada data yang dikirim ke server mana pun.
        </p>
      </div>

      <Link
        to="/panduan/troubleshooting"
        className="block rounded-md border-2 border-indigo-200 bg-indigo-50 p-4 hover:border-indigo-300"
      >
        <span className="text-sm font-semibold text-indigo-900">Mengalami masalah? →</span>
        <span className="mt-1 block text-sm text-indigo-700">
          Buka halaman Troubleshooting — kumpulan masalah umum dan cara mengatasinya sendiri, bisa dicari
          dengan kata kunci.
        </span>
      </Link>

      <div className="space-y-4">
        <Step title="1. Buat Proyek">
          <p>
            Buka halaman <strong>Proyek Saya</strong>, isi nama proyek dan (opsional tapi disarankan)
            pertanyaan penelitian Anda — teks ini nantinya juga dipakai untuk menyusun urutan awal artikel
            saat skrining.
          </p>
        </Step>

        <Step title="2. Impor Data">
          <p>Ada dua jalur, bisa dipakai bergantian dalam satu proyek:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Unggah file</strong>: BibTeX (.bib), RIS (.ris), atau CSV (Scopus/Web of
              Science/generik) di halaman Impor Data.
            </li>
            <li>
              <strong>Cari OpenAlex</strong>: susun string pencarian, atur filter tahun/jenis
              dokumen/bahasa, lalu klik Cari &amp; Impor.
            </li>
          </ul>
        </Step>

        <Step title="3. Deduplikasi">
          <p>
            Di halaman Deduplikasi, klik <strong>Jalankan Deduplikasi</strong>. Kecocokan DOI ditandai
            otomatis; kandidat berdasarkan kemiripan judul akan muncul untuk Anda tinjau dan putuskan
            (Tandai Duplikat / Bukan Duplikat) satu per satu.
          </p>
        </Step>

        <Step title="4. Bibliometrik (bisa kapan saja)">
          <p>
            Begitu ada data, halaman Bibliometrik langsung menampilkan produksi tahunan, penulis/jurnal/negara
            paling produktif, Hukum Lotka, Hukum Bradford, jaringan co-word &amp; co-authorship, dan tren kata
            kunci. Semua grafik bisa diunduh PNG/SVG, semua tabel sebagai CSV.
          </p>
        </Step>

        <Step title="5. Tetapkan Kriteria">
          <p>
            Sebelum skrining, isi kriteria inklusi dan eksklusi di halaman Kriteria. Label eksklusi yang Anda
            buat akan muncul sebagai pilihan satu-klik saat menolak artikel.
          </p>
        </Step>

        <Step title="6. Skrining Abstrak">
          <p>
            Di halaman Skrining, nilai satu artikel per layar dengan pintasan keyboard:{' '}
            <kbd className="rounded bg-gray-100 px-1">Y</kbd> masuk,{' '}
            <kbd className="rounded bg-gray-100 px-1">N</kbd> tolak (lalu pilih label),{' '}
            <kbd className="rounded bg-gray-100 px-1">?</kbd> ragu,{' '}
            <kbd className="rounded bg-gray-100 px-1">←</kbd> mundur. Urutan artikel makin lama makin
            "cerdas" — setelah sekitar 25 keputusan, sistem mulai memprioritaskan artikel yang mirip dengan
            pola keputusan "masuk" Anda sejauh ini.
          </p>
        </Step>

        <Step title="7. Full Teks & Ekstraksi">
          <p>
            Artikel yang lolos skrining abstrak muncul di halaman ini. Unggah PDF-nya untuk membaca &amp;
            mencari teks di dalamnya, isi matriks ekstraksi (kolom bisa dikustomisasi) beserta kutipan
            verbatim, lalu putuskan kelayakan full teksnya (Sertakan/Eksklusi).
          </p>
        </Step>

        <Step title="8. Diagram PRISMA">
          <p>
            Halaman PRISMA menghitung dan menggambar diagram alur secara otomatis dari data yang sudah Anda
            proses di tahap-tahap sebelumnya — tidak perlu digambar manual. Bisa diunduh PNG/SVG/PDF.
          </p>
        </Step>

        <Step title="9. Draf Bab Metode & Hasil">
          <p>
            Halaman Draf Metode &amp; Hasil menyusun draf .docx dari seluruh data yang sudah tercatat. Bab
            Pendahuluan, Diskusi, dan Kesimpulan sengaja tidak dibuat otomatis — itu bagian yang harus Anda
            tulis sendiri.
          </p>
        </Step>

        <Step title="10. Ekspor & Cadangan">
          <p>
            Di halaman Ekspor: unduh artikel terpilih (RIS/BibTeX), log keputusan (CSV), matriks ekstraksi
            (CSV), seluruh record (CSV), dan yang terpenting —{' '}
            <strong>Cadangan Proyek (JSON)</strong> untuk backup atau pindah ke perangkat lain.
          </p>
        </Step>
      </div>

      <p className="text-sm text-gray-500">
        Rumus dan algoritma yang dipakai (Jaro-Winkler, Naive Bayes, Hukum Lotka/Bradford, dll.) dijelaskan di
        halaman <Link to="/metodologi" className="text-indigo-600 underline">Metodologi</Link>.
      </p>
    </div>
  );
}
