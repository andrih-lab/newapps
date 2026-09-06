# Telaah — SLR & Bibliometrik

Aplikasi web untuk membantu proses identifikasi, skrining, dan pelaporan
Systematic Literature Review (SLR), sekaligus analisis bibliometrik. Seluruh
pemrosesan berjalan di peramban (client-side), tanpa model bahasa.

Status saat ini: **Pekan 1 & 2** dari rencana empat pekan selesai (lihat
`rancang-bangun-aplikasi-slr.md`, Bagian 7).

## Yang sudah ada di Pekan 1 — fondasi & demo tercepat

- Parser BibTeX (`.bib`), RIS (`.ris`), CSV Scopus, CSV Web of Science, dan
  CSV generik — ditulis sendiri, toleran terhadap file rusak (entri
  bermasalah dilewati dan dilaporkan, bukan menggagalkan seluruh impor).
- Pencarian OpenAlex langsung dari peramban (tanpa proxy untuk saat ini),
  dengan paginasi cursor dan rekonstruksi abstrak dari inverted index.
- Deduplikasi: tahap 1 kecocokan DOI, tahap 2 kemiripan judul Jaro-Winkler
  (dikonfirmasi tahun dan penulis pertama), dengan tinjauan manual kandidat.
- Skema IndexedDB (Dexie) sesuai Bagian 5 dokumen rancang-bangun.
- Seluruh Modul 3 (bibliometrik): produksi tahunan, penulis/institusi/negara/
  jurnal paling produktif, artikel tersitasi, Hukum Lotka, Hukum Bradford,
  jaringan co-word kata kunci, jaringan co-authorship penulis & negara, tren
  kata kunci per tahun. Semua grafik bisa diunduh PNG/SVG, semua tabel CSV.
- Halaman Metodologi yang menjelaskan rumus yang dipakai.

## Yang sudah ada di Pekan 2 — inti SLR

- Kriteria inklusi/eksklusi (CRUD) per proyek.
- Antarmuka skrining satu-artikel-per-layar dengan pintasan keyboard
  (`Y`/`N`/`?`/`←`), label eksklusi satu-klik, highlight kata kunci kriteria
  di abstrak, dan autosave seketika ke IndexedDB.
- Active learning tanpa model bahasa: ~25 artikel pertama disusun dari
  campuran kemiripan TF-IDF (terhadap pertanyaan penelitian + kriteria
  inklusi) dan urutan acak stabil; setelahnya Naive Bayes multinomial
  dilatih ulang di Web Worker setiap ada keputusan baru untuk mengurutkan
  sisa korpus berdasarkan probabilitas relevansi. Indikator berhenti:
  penolakan beruntun & kurva penemuan relevan.
- Log keputusan skrining (siapa, kapan, alasan) tersimpan otomatis.
- Diagram PRISMA 2020 digambar sebagai SVG langsung dari data, dengan
  ekspor PNG/SVG/PDF. Tahap penilaian full teks masih placeholder (Modul 5
  belum dikerjakan) dan ditandai eksplisit di halaman, bukan disembunyikan.
- Ekspor: artikel terpilih sebagai RIS/BibTeX, log keputusan sebagai CSV,
  seluruh record sebagai CSV (bisa dibuka langsung di Excel).

Parsing berat (BibTeX/RIS/CSV), deduplikasi, dan pelatihan/skoring active
learning berjalan di Web Worker agar UI tidak beku. Daftar record memakai
virtualisasi agar tidak memuat ribuan baris sekaligus ke DOM.

## Keputusan teknis di luar tabel Bagian 3

- **Ekspor "Excel" berupa CSV**, bukan `.xlsx` asli via SheetJS seperti
  disebut di Bagian 3. Versi npm `xlsx` (SheetJS) yang tersedia punya CVE
  prototype-pollution & ReDoS tanpa perbaikan resmi di registry npm. Karena
  CSV dibuka native oleh Excel dan kebutuhan Pekan 2 hanya tabel datar,
  dependency berisiko ini sengaja tidak dipakai.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env   # isi VITE_OPENALEX_API_KEY / VITE_OPENALEX_MAILTO bila ada
npm run dev
```

## Build untuk produksi (shared hosting)

```bash
npm run build
```

Salin seluruh isi folder `dist/` ke `public_html` (atau subfolder mana pun)
di shared hosting Anda. Aplikasi memakai `HashRouter` dan `base: './'` di
`vite.config.ts`, sehingga jalan tanpa konfigurasi server tambahan (tidak
perlu rewrite rule) dan tetap berfungsi walau diletakkan di subfolder.

## Catatan

- Ketentuan API key OpenAlex berubah pada awal 2026 — periksa
  [docs.openalex.org](https://docs.openalex.org) sebelum rilis produksi
  (lihat juga halaman Metodologi di dalam aplikasi).
- Keluaran Hukum Lotka dan Bradford wajib diverifikasi terhadap
  Bibliometrix/Biblioshiny dengan dataset yang sama sebelum rilis.
- File `.env` tidak ikut ter-commit (lihat `.gitignore`); gunakan
  `.env.example` sebagai referensi.
