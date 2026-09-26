# Telaah — SLR & Bibliometrik

Aplikasi web untuk membantu proses identifikasi, skrining, dan pelaporan
Systematic Literature Review (SLR), sekaligus analisis bibliometrik. Seluruh
pemrosesan berjalan di peramban (client-side), tanpa model bahasa (satu
pengecualian opsional: saran istilah AI di Perancang Kata Kunci).

Status saat ini: **Pekan 1, 2 & 3 selesai, plus Modul 7, Modul 8, halaman
panduan dari Pekan 4, dan Perancang Kata Kunci** (lihat
`rancang-bangun-aplikasi-slr.md`, Bagian 7). Modul 9 (akun & langganan)
**ditunda**: aplikasi saat ini dipakai pribadi oleh pemiliknya.

## Paket Konten (artikel, blog, video)

Halaman **Paket Konten** menyusun satu file Markdown dari data proyek untuk
dibawa ke asisten AI pilihan pengguna: instruksi sesuai tujuan (artikel
ilmiah / blog populer / naskah video YouTube faceless) dan bahasa, konteks &
alur PRISMA, temuan bibliometrik (produksi tahunan, negara/jurnal/penulis
teratas, kata kunci terbanyak & yang proporsinya naik 3 tahun terakhir,
paling disitasi), bukti per studi bernomor [n] (matriks ekstraksi, kutipan
verbatim + halaman, abstrak), daftar pustaka ber-DOI, dan keterbatasan data.
Instruksi mewajibkan AI hanya memakai isi paket, memberi rujukan [n], dan
menulis [perlu dicek] bila bukti tidak cukup. Telaah tidak memanggil AI di
sini; seluruh isi disusun deterministik.

## Perancang Kata Kunci (halaman pertama tiap proyek)

Alur sekali klik dari topik ke string pencarian yang siap dipakai:

1. Topik dipecah menjadi **blok konsep** di kata penghubung (of, in, on, and…).
2. Tiap konsep diperluas otomatis dari: tesaurus **AGROVOC** (FAO, gratis,
   tanpa kunci), **varian** ejaan Inggris/Amerika & singkatan baku,
   **wilayah** (kawasan → negara/pulau), dan **penambangan literatur** —
   frasa 2–3 kata & kata kunci yang sering muncul di ≤ 200 artikel OpenAlex
   paling relevan (1–2 panggilan pencarian).
3. Pengguna mencentang/menghapus istilah; setiap istilah menyimpan asalnya
   (terlihat sebagai label & tooltip). "Hitung hit" mengecek jumlah hasil
   tiap istilah di OpenAlex (menandai istilah 0 hit atau terlalu umum).
4. String disusun untuk **OpenAlex, Scopus, Web of Science, Google Scholar**
   (≤ 256 karakter, istilah ber-hit terbanyak diprioritaskan), dan
   **literatur Indonesia** dari padanan Indonesia per konsep. Istilah yang
   tercakup istilah lebih pendek di konsep yang sama dibuang otomatis.
5. **Uji paper kunci**: tempel DOI artikel yang pasti relevan → recall
   string + kata kunci artikel yang terlewat untuk ditambahkan satu klik.
6. Tombol "Cari & Impor" mengisi form OpenAlex di halaman Impor; seluruh
   strategi, termasuk hasil uji recall, masuk otomatis ke draf Bab Metode.

**Saran AI (Gemini) bersifat opsional & mati secara bawaan.** Kunci API
disimpan hanya di `localStorage` peramban pengguna dan dikirim langsung ke
Google; usulan AI masuk tanpa tercentang dan diberi label "AI", dan bila
dipakai, Bab Metode menyebutkannya secara eksplisit.

**Kuota OpenAlex.** OpenAlex kini memakai kuota harian berbasis biaya
(pencarian ≈ $0,001, filter ≈ $0,0001; tanpa API key ≈ $0,10/hari). Sisa
kuota dibaca dari header `X-RateLimit-Remaining-USD` dan ditampilkan di
halaman; "Hitung hit" meminta konfirmasi bila lebih dari 5 pencarian.
Halaman ini dimuat sebagai chunk terpisah (`React.lazy`) agar bundle utama
tidak bertambah.

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
