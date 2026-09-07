# Telaah — SLR & Bibliometrik

Aplikasi web untuk membantu proses identifikasi, skrining, dan pelaporan
Systematic Literature Review (SLR), sekaligus analisis bibliometrik. Seluruh
pemrosesan berjalan di peramban (client-side), tanpa model bahasa.

Status saat ini: **Pekan 1, 2 & 3 selesai, plus Modul 7, Modul 8, dan
halaman panduan dari Pekan 4** (lihat `rancang-bangun-aplikasi-slr.md`,
Bagian 7). Yang tersisa dari Pekan 4: autentikasi/langganan (Modul 9 —
menunggu kredensial Supabase & Midtrans dari pemilik proyek) dan video
demo.

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
  ekspor PNG/SVG/PDF.
- Ekspor: artikel terpilih sebagai RIS/BibTeX, log keputusan sebagai CSV,
  seluruh record sebagai CSV (bisa dibuka langsung di Excel).

## Yang sudah ada di Pekan 3 — full teks & matriks ekstraksi

- Unggah PDF per artikel, dibaca dengan pdf.js langsung di peramban (parsing
  didelegasikan ke worker internal pdf.js sendiri). Tampilan berdampingan:
  PDF di kiri (navigasi halaman + pencarian teks dalam dokumen), formulir
  matriks di kanan. **PDF tidak pernah disimpan** ke IndexedDB — hanya nama
  file & teks hasil ekstraksi yang tersimpan; menutup tab berarti file perlu
  dipilih ulang (sesuai Bagian 4).
- Matriks ekstraksi dengan kolom bawaan (penulis, tahun, negara/lokasi,
  desain penelitian, ukuran sampel, variabel, metode analisis, temuan utama,
  keterbatasan) yang bisa dikustomisasi per proyek, plus kutipan verbatim
  (kalimat asli + nomor halaman) untuk tiap isian penting.
- Alternatif pengisian di luar aplikasi: unduh template CSV, isi di
  Excel/Sheets, unggah kembali — divalidasi dengan pencocokan judul
  (Jaro-Winkler, sama seperti Modul 2) dan pemeriksaan kelengkapan kolom.
- Keputusan kelayakan full teks (termasuk/dieksklusi + alasan) dicatat
  terpisah dari skrining abstrak, dan sekarang menjadi sumber data nyata
  bagi diagram PRISMA (bukan lagi placeholder seperti di Pekan 2).
- Ekspor matriks ekstraksi lengkap sebagai CSV.

## Yang sudah ada dari Pekan 4 — Modul 7, Modul 8 & Panduan

- **Generator Bab Metode & Hasil (.docx)**, berbasis template, deterministik,
  tanpa model bahasa — hanya menyusun kalimat dari data yang sudah tercatat
  (pencarian, kriteria, hasil seleksi, matriks ekstraksi, ringkasan
  bibliometrik). Halaman Draf Metode & Hasil menampilkan secara eksplisit —
  di dalam aplikasi, bukan cuma di dalam file — bahwa Bab Pendahuluan,
  Diskusi, dan Kesimpulan **sengaja tidak dibuat otomatis**, karena itu
  kontribusi intelektual penulis dan berisiko fabrikasi bila diotomasi.
- **Cadangan proyek sebagai JSON** (Modul 8): unduh seluruh data satu proyek
  (record, kriteria, matriks ekstraksi, log keputusan) dari halaman Ekspor,
  lalu pulihkan sebagai proyek baru dari halaman Proyek Saya — untuk cadangan
  atau pindah perangkat/peramban. ID internal di-generate ulang saat
  dipulihkan agar tidak bentrok dengan data yang sudah ada.
- **Halaman Panduan** (`/panduan`): ringkasan langkah pakai tiap modul secara
  berurutan, dari buat proyek sampai ekspor draf Word.
- **Halaman Troubleshooting terpisah** (`/panduan/troubleshooting`): basis
  pengetahuan mandiri (self-service) berisi ~25 masalah paling umum
  (data hilang, impor gagal, PDF tidak muncul lagi, cadangan gagal dipulihkan,
  deploy blank, dll.) dengan jawaban langsung, dikelompokkan per kategori dan
  bisa dicari dengan kata kunci — dirancang supaya pengguna bisa memecahkan
  masalah sendiri tanpa perlu bertanya ke pengembang.

Parsing berat (BibTeX/RIS/CSV), deduplikasi, dan pelatihan/skoring active
learning berjalan di Web Worker agar UI tidak beku. Daftar record memakai
virtualisasi agar tidak memuat ribuan baris sekaligus ke DOM.

## Keputusan teknis di luar tabel Bagian 3

- **Ekspor "Excel" berupa CSV**, bukan `.xlsx` asli via SheetJS seperti
  disebut di Bagian 3 — termasuk template matriks ekstraksi & validator
  impornya (Modul 5). Versi npm `xlsx` (SheetJS) yang tersedia punya CVE
  prototype-pollution & ReDoS tanpa perbaikan resmi di registry npm, justru
  di jalur *parse* yang persis dibutuhkan validator impor. Karena CSV dibuka
  native oleh Excel/Sheets, dependency berisiko ini sengaja tidak dipakai.
- **`pdfjs-dist` dikunci ke seri 4.x**, bukan versi 6.x terbaru. Versi 6.3
  memakai fitur JavaScript sangat baru (`Map.prototype.getOrInsertComputed`)
  yang memicu error tak tertangani di Chromium yang diuji — seri 4.x jauh
  lebih matang dan kompatibel luas untuk target shared hosting.

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
- Bundle JS utama sudah mencapai ~2 MB (util. ~640 KB gzip) karena semua
  halaman (termasuk pdf.js, docx, Cytoscape, D3) masih dimuat dalam satu
  chunk. Belum jadi masalah fungsional (tetap satu kali muat, ter-cache
  sesudahnya), tapi code-splitting per rute (`React.lazy`) adalah kandidat
  perbaikan berikutnya bila waktu muat awal jadi keluhan pengguna.
