# Telaah — SLR & Bibliometrik

Aplikasi web untuk membantu proses identifikasi, skrining, dan pelaporan
Systematic Literature Review (SLR), sekaligus analisis bibliometrik. Seluruh
pemrosesan berjalan di peramban (client-side), tanpa model bahasa.

Status saat ini: **Pekan 1** dari rencana empat pekan (lihat
`rancang-bangun-aplikasi-slr.md`, Bagian 7) — fondasi dan demo tercepat.

## Yang sudah ada di Pekan 1

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

Parsing berat (BibTeX/RIS/CSV) dan deduplikasi berjalan di Web Worker agar UI
tidak beku. Daftar record memakai virtualisasi agar tidak memuat ribuan baris
sekaligus ke DOM.

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
