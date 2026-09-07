export interface FaqItem {
  id: string;
  kategori: string;
  pertanyaan: string;
  jawaban: string[];
}

/**
 * Basis pengetahuan troubleshooting mandiri (self-service) — dirancang agar
 * pengguna bisa memecahkan masalah sendiri tanpa perlu bertanya ke pengembang.
 */
export const FAQ_ITEMS: FaqItem[] = [
  // --- Umum & Penyimpanan Data ---
  {
    id: 'umum-data-hilang',
    kategori: 'Umum & Penyimpanan Data',
    pertanyaan: 'Data proyek saya hilang setelah menutup dan membuka lagi browser',
    jawaban: [
      'Semua data tersimpan di penyimpanan browser (IndexedDB) di perangkat Anda, bukan di server — menutup tab atau browser TIDAK menghapus data secara normal.',
      'Penyebab paling umum: (1) Anda memakai mode penyamaran/private browsing, yang memang menghapus semua data begini sesi ditutup; (2) Anda atau ekstensi browser membersihkan "Clear browsing data / Site data / Cookies dan data situs"; (3) Anda membuka aplikasi dari alamat (URL) yang berbeda dari sebelumnya — browser menganggap folder/domain berbeda sebagai penyimpanan yang berbeda pula.',
      'Pencegahan ke depan: unduh Cadangan (JSON) secara berkala dari halaman Ekspor pada tiap proyek penting.',
    ],
  },
  {
    id: 'umum-pindah-perangkat',
    kategori: 'Umum & Penyimpanan Data',
    pertanyaan: 'Saya pindah ke laptop/browser lain, proyek saya tidak ada di sana',
    jawaban: [
      'Ini bukan bug — data memang tersimpan lokal per perangkat/per browser, bukan di server.',
      'Solusi: di perangkat lama, buka proyek → halaman Ekspor → "Unduh Cadangan (JSON)". Di perangkat/browser baru, buka halaman Proyek Saya → "Pulihkan dari Cadangan" → pilih file JSON tadi.',
    ],
  },
  {
    id: 'umum-layar-putih',
    kategori: 'Umum & Penyimpanan Data',
    pertanyaan: 'Muncul layar putih/kosong saat membuka aplikasi',
    jawaban: [
      'Coba berurutan: (1) refresh keras dengan Ctrl+Shift+R (Windows/Linux) atau Cmd+Shift+R (Mac); (2) pastikan memakai browser modern versi terbaru (Chrome, Edge, Firefox, atau Safari); (3) matikan sementara ekstensi browser (khususnya pemblokir skrip/iklan) lalu coba lagi; (4) tekan F12 untuk membuka Console browser dan lihat apakah ada pesan error berwarna merah.',
      'Jika ini instalasi hosting sendiri: pastikan seluruh isi folder dist (termasuk folder assets di dalamnya) sudah tersalin utuh ke server, bukan cuma file index.html.',
    ],
  },
  {
    id: 'umum-lambat',
    kategori: 'Umum & Penyimpanan Data',
    pertanyaan: 'Aplikasi terasa lambat saat data banyak',
    jawaban: [
      'Daftar record memakai virtualisasi (tidak semua baris dirender sekaligus), tapi proses seperti deduplikasi, skrining, dan bibliometrik tetap memproses seluruh data di memori.',
      'Coba: tutup tab/aplikasi lain yang berat, hindari satu proyek dengan lebih dari puluhan ribu record untuk saat ini, dan biarkan proses (mis. "Jalankan Deduplikasi") selesai tanpa menutup tab.',
    ],
  },
  {
    id: 'umum-hapus-proyek',
    kategori: 'Umum & Penyimpanan Data',
    pertanyaan: 'Saya tidak sengaja menghapus data, bisa dikembalikan?',
    jawaban: [
      'Aplikasi ini belum memiliki tempat sampah/undo untuk data yang dihapus.',
      'Jika Anda sempat mengunduh Cadangan (JSON) sebelumnya, pulihkan dari file tersebut lewat halaman Proyek Saya. Jika belum pernah, data tidak dapat dikembalikan — jadikan ini alasan untuk membiasakan ekspor cadangan berkala.',
    ],
  },

  // --- Impor Data ---
  {
    id: 'impor-entri-bermasalah',
    kategori: 'Impor Data',
    pertanyaan: 'Banyak entri dilaporkan "bermasalah" saat impor BibTeX/RIS',
    jawaban: [
      'Parser memang dirancang toleran: entri yang rusak parah (misalnya tanpa judul sama sekali) dilewati dan dilaporkan, bukan menggagalkan seluruh file.',
      'Buka bagian "Riwayat Impor" untuk melihat detail pesan error per entri, perbaiki bagian yang bermasalah di file sumber (mis. di Zotero/Mendeley/EndNote sebelum ekspor ulang), lalu impor lagi.',
    ],
  },
  {
    id: 'impor-kolom-csv-salah',
    kategori: 'Impor Data',
    pertanyaan: 'Kolom CSV terpetakan ke tempat yang salah',
    jawaban: [
      'Saat mengunggah file .csv, dialog "Pemetaan Kolom" akan muncul dengan tebakan otomatis. Periksa tiap baris, dan ganti pilihan dropdown ke nama kolom asli file Anda bila tebakan otomatisnya salah, sebelum menekan tombol Impor.',
      'Jika sumbernya bukan Scopus/Web of Science standar, pilih jenis "CSV Generik" agar Anda memetakan semua kolom secara manual.',
    ],
  },
  {
    id: 'impor-openalex-kosong',
    kategori: 'Impor Data',
    pertanyaan: 'Pencarian OpenAlex tidak menghasilkan apa-apa atau error',
    jawaban: [
      'Periksa koneksi internet Anda — pencarian ini memanggil api.openalex.org langsung dari browser.',
      'Periksa string pencarian tidak kosong, dan coba longgarkan filter tahun/bahasa/jenis dokumen yang mungkin terlalu sempit.',
      'Jika Anda men-deploy aplikasi ini sendiri: variabel VITE_OPENALEX_API_KEY / VITE_OPENALEX_MAILTO di file .env hanya terbaca saat proses build — pastikan sudah build ulang (npm run build) setelah mengubah .env.',
    ],
  },
  {
    id: 'impor-scopus-wos-gagal-deteksi',
    kategori: 'Impor Data',
    pertanyaan: 'Impor CSV Scopus/Web of Science tidak mendeteksi kolom dengan benar',
    jawaban: [
      'Nama kolom pada file ekspor bisa sedikit berbeda tergantung versi/lokasi akses database sumbernya.',
      'Gunakan jenis "CSV Generik" pada dialog pemetaan kolom, lalu petakan setiap kolom secara manual sesuai judul kolom asli pada file Anda.',
    ],
  },

  // --- Deduplikasi ---
  {
    id: 'dedup-tidak-terdeteksi',
    kategori: 'Deduplikasi',
    pertanyaan: 'Tidak ada duplikat terdeteksi padahal seharusnya ada',
    jawaban: [
      'Deduplikasi tidak berjalan otomatis saat impor — buka halaman Deduplikasi dan tekan tombol "Jalankan Deduplikasi" terlebih dahulu.',
      'Jika DOI kosong/berbeda format dan judulnya agak berbeda, kemiripannya mungkin di bawah ambang yang dipakai (Jaro-Winkler ≥ 0,90 untuk judul, dikonfirmasi tahun dan penulis pertama). Anda bisa meninjau dan menandai manual lewat perbandingan record yang ditampilkan berdampingan.',
    ],
  },
  {
    id: 'dedup-terlalu-banyak-kandidat',
    kategori: 'Deduplikasi',
    pertanyaan: 'Terlalu banyak kandidat duplikat yang sebenarnya bukan duplikat',
    jawaban: [
      'Ini wajar untuk korpus dengan banyak judul yang mirip (mis. seri studi tahunan yang sama). Tinjau tiap kandidat satu per satu di halaman Deduplikasi dan klik "Bukan Duplikat" — ini tidak memengaruhi record lain.',
    ],
  },
  {
    id: 'dedup-muncul-lagi',
    kategori: 'Deduplikasi',
    pertanyaan: 'Record yang sudah saya tandai "Bukan Duplikat" muncul lagi sebagai kandidat',
    jawaban: [
      'Menjalankan ulang deduplikasi menghitung ulang semua kandidat dari awal; keputusan penolakan sebelumnya tidak "diingat" secara permanen dalam versi ini, sehingga record dengan kemiripan tinggi bisa terdeteksi lagi. Tandai kembali "Bukan Duplikat" bila memang bukan duplikat.',
    ],
  },

  // --- Skrining ---
  {
    id: 'skrining-keyboard-tidak-jalan',
    kategori: 'Skrining',
    pertanyaan: 'Tombol pintasan keyboard (Y/N/?/←) tidak merespons',
    jawaban: [
      'Pintasan keyboard dinonaktifkan sementara saat fokus keyboard berada di kotak isian teks (misalnya kolom "Nama penilai"). Klik area kosong pada halaman terlebih dahulu, lalu coba lagi — atau gunakan tombol di layar sebagai alternatif.',
    ],
  },
  {
    id: 'skrining-urutan-berubah',
    kategori: 'Skrining',
    pertanyaan: 'Urutan artikel yang ditampilkan berubah-ubah',
    jawaban: [
      'Ini memang cara kerja active learning aplikasi: skor relevansi dihitung ulang setiap kali ada keputusan baru (fase awal memakai campuran acak + kemiripan pertanyaan penelitian, setelah sekitar 25 keputusan berpindah ke model Naive Bayes). Urutan berikutnya bisa berubah karena model terus belajar dari keputusan Anda — bukan bug.',
    ],
  },
  {
    id: 'skrining-progress-hilang',
    kategori: 'Skrining',
    pertanyaan: 'Progres skrining terlihat kembali ke 0',
    jawaban: [
      'Setiap keputusan tersimpan otomatis dan seketika ke penyimpanan lokal. Jika progres terlihat hilang, periksa apakah Anda membuka proyek yang sama (bukan proyek lain dengan nama mirip), dan pastikan tidak sedang memakai mode penyamaran/private browsing.',
    ],
  },
  {
    id: 'skrining-label-kosong',
    kategori: 'Skrining',
    pertanyaan: 'Tidak ada pilihan label saat menolak artikel (hanya "tanpa label")',
    jawaban: [
      'Tambahkan kriteria eksklusi terlebih dahulu di halaman Kriteria proyek ini. Label yang Anda buat di sana akan otomatis muncul sebagai pilihan satu-klik saat menolak artikel.',
    ],
  },

  // --- Full Teks & Ekstraksi ---
  {
    id: 'ekstraksi-pdf-hilang',
    kategori: 'Full Teks & Ekstraksi',
    pertanyaan: 'PDF yang sudah saya unggah hilang setelah memuat ulang halaman',
    jawaban: [
      'Ini sengaja: file PDF tidak pernah disimpan ke penyimpanan aplikasi, hanya nama file dan teks hasil ekstraksinya yang tersimpan. Ini untuk menjaga file Anda tidak pernah meninggalkan komputer secara permanen di penyimpanan aplikasi.',
      'Pilih ulang file PDF yang sama; teks untuk pencarian dalam dokumen akan diekstrak ulang secara otomatis dalam beberapa detik.',
    ],
  },
  {
    id: 'ekstraksi-artikel-tidak-muncul',
    kategori: 'Full Teks & Ekstraksi',
    pertanyaan: 'Artikel yang saya cari tidak muncul di halaman Full Teks & Ekstraksi',
    jawaban: [
      'Hanya artikel dengan status skrining "masuk" yang tampil di halaman ini. Selesaikan skrining abstrak untuk artikel tersebut terlebih dahulu di halaman Skrining.',
    ],
  },
  {
    id: 'ekstraksi-pencarian-pdf-gagal',
    kategori: 'Full Teks & Ekstraksi',
    pertanyaan: 'Pencarian di dalam PDF tidak menemukan kata yang jelas-jelas ada di dokumen',
    jawaban: [
      'Pencarian bekerja pada teks yang diekstrak pdf.js dari lapisan teks PDF. Jika PDF Anda adalah hasil pindai/scan (gambar halaman tanpa lapisan teks asli), tidak ada teks yang bisa diekstrak sehingga pencarian tidak akan menemukan apa pun — ini keterbatasan format file, bukan aplikasi.',
    ],
  },
  {
    id: 'ekstraksi-kolom-dihapus',
    kategori: 'Full Teks & Ekstraksi',
    pertanyaan: 'Saya menghapus satu kolom matriks, apakah datanya ikut hilang?',
    jawaban: [
      'Menghapus kolom lewat "Kustomisasi kolom matriks" hanya menyembunyikannya dari tampilan/ekspor berikutnya. Data yang pernah diisi untuk kolom itu tidak langsung terhapus dari penyimpanan, tapi juga tidak akan terlihat lagi kecuali Anda menambahkan kembali kolom dengan nama yang sama persis.',
    ],
  },
  {
    id: 'ekstraksi-template-ditolak',
    kategori: 'Full Teks & Ekstraksi',
    pertanyaan: 'Template CSV yang saya isi dan unggah kembali ditolak/tidak cocok',
    jawaban: [
      'Kolom "judul" pada CSV harus cukup mirip (kemiripan ≥ 85%) dengan judul asli artikel di aplikasi. Jangan mengetik ulang judul dari ingatan — salin-tempel langsung dari daftar artikel di aplikasi ke file template.',
    ],
  },

  // --- Bibliometrik ---
  {
    id: 'biblio-kosong',
    kategori: 'Bibliometrik',
    pertanyaan: 'Halaman Bibliometrik kosong / grafik tidak muncul',
    jawaban: [
      'Halaman ini butuh minimal satu record berstatus non-duplikat. Impor data terlebih dahulu di halaman Impor Data; menjalankan Deduplikasi bersifat opsional tapi disarankan agar duplikat tidak menggandakan hitungan.',
    ],
  },
  {
    id: 'biblio-institusi-kurang',
    kategori: 'Bibliometrik',
    pertanyaan: 'Data institusi/negara terasa tidak lengkap di grafik',
    jawaban: [
      'Field institusi dan negara hanya terisi otomatis dari hasil pencarian OpenAlex. Record yang diimpor dari BibTeX/RIS/CSV biasanya tidak membawa data institusi/negara terstruktur, sehingga tidak ikut terhitung pada grafik tersebut.',
    ],
  },

  // --- PRISMA ---
  {
    id: 'prisma-angka-tidak-sesuai',
    kategori: 'PRISMA',
    pertanyaan: 'Angka pada diagram PRISMA tidak sesuai perkiraan saya',
    jawaban: [
      'Periksa catatan peringatan berwarna kuning di atas diagram — bila masih ada record yang belum dinilai pada tahap skrining atau full teks, angka pada tahap berikutnya memang belum final dan akan berubah setelah Anda menyelesaikan penilaian tersebut.',
    ],
  },
  {
    id: 'prisma-unduh-gagal',
    kategori: 'PRISMA',
    pertanyaan: 'Tombol unduh PNG/SVG/PDF diagram PRISMA tidak bereaksi',
    jawaban: [
      'Periksa apakah browser Anda memblokir pop-up atau unduhan otomatis dari situs ini (biasanya ada ikon peringatan di address bar); izinkan unduhan, lalu coba lagi.',
    ],
  },

  // --- Draf Laporan, Ekspor & Cadangan ---
  {
    id: 'laporan-docx-tidak-terbuka',
    kategori: 'Draf Laporan, Ekspor & Cadangan',
    pertanyaan: 'File .docx hasil unduhan tidak bisa dibuka',
    jawaban: [
      'Pastikan file selesai terunduh sepenuhnya (ukurannya wajar, bukan 0 KB) — jaringan yang terputus di tengah unduhan bisa merusak file. Coba unduh ulang.',
      'Buka dengan Microsoft Word atau LibreOffice Writer. Pratinjau bawaan sebagian browser terkadang tidak menampilkan format .docx secara penuh.',
    ],
  },
  {
    id: 'laporan-terlalu-generik',
    kategori: 'Draf Laporan, Ekspor & Cadangan',
    pertanyaan: 'Draf Bab Metode & Hasil isinya terasa kosong atau terlalu umum',
    jawaban: [
      'Generator hanya menyusun kalimat dari data yang benar-benar sudah Anda catat. Lengkapi kriteria inklusi/eksklusi, selesaikan skrining, isi matriks ekstraksi, dan lakukan penilaian full teks agar draf yang dihasilkan lebih detail dan spesifik.',
    ],
  },
  {
    id: 'cadangan-gagal-pulih',
    kategori: 'Draf Laporan, Ekspor & Cadangan',
    pertanyaan: 'Gagal memulihkan file cadangan (backup)',
    jawaban: [
      'Pastikan file yang diunggah adalah file JSON yang diunduh langsung dari halaman Ekspor aplikasi ini, tanpa diedit manual, dan bukan dari versi aplikasi yang jauh berbeda.',
      'Jika pesan error tetap muncul, coba buka file JSON tersebut dengan editor teks untuk memastikan isinya tidak rusak/terpotong akibat unduhan yang gagal.',
    ],
  },
  {
    id: 'cadangan-proyek-dobel',
    kategori: 'Draf Laporan, Ekspor & Cadangan',
    pertanyaan: 'Setelah memulihkan cadangan, proyek dengan nama sama muncul dua kali',
    jawaban: [
      'Ini perilaku normal: pemulihan cadangan selalu membuat PROYEK BARU, tidak pernah menimpa proyek yang sudah ada — ini untuk mencegah data tertimpa tanpa sengaja. Hapus salah satu proyek secara manual dari halaman Proyek Saya bila memang duplikat.',
    ],
  },

  // --- Deploy ke Hosting ---
  {
    id: 'deploy-blank',
    kategori: 'Deploy ke Hosting Sendiri',
    pertanyaan: 'Setelah upload ke shared hosting, halaman blank atau 404',
    jawaban: [
      'Pastikan SELURUH isi folder dist (termasuk subfolder assets di dalamnya) tersalin ke server, bukan hanya file index.html.',
      'Aplikasi memakai HashRouter sehingga tidak memerlukan rewrite rule/.htaccess khusus apa pun — jika sebelumnya ada .htaccess dari aplikasi lain di folder yang sama, itu bisa mengganggu dan sebaiknya dihapus.',
    ],
  },
  {
    id: 'deploy-css-berantakan',
    kategori: 'Deploy ke Hosting Sendiri',
    pertanyaan: 'Setelah upload, tampilan berantakan atau gaya (CSS) tidak termuat',
    jawaban: [
      'Biasanya karena proses upload belum selesai sepenuhnya (folder assets belum lengkap ter-upload) atau ada file yang gagal tersalin. Bandingkan daftar file di folder dist lokal dengan yang ada di server, lalu upload ulang bila ada yang kurang.',
    ],
  },
  {
    id: 'deploy-env-tidak-jalan',
    kategori: 'Deploy ke Hosting Sendiri',
    pertanyaan: 'API key OpenAlex di .env tidak berfungsi setelah di-deploy',
    jawaban: [
      'Variabel di file .env hanya dibaca sekali saat proses "npm run build" dijalankan di komputer Anda, lalu nilainya "dipanggang" ke dalam file hasil build. Mengubah .env di server hosting setelah itu tidak berpengaruh — Anda harus mengubah .env, menjalankan npm run build lagi, lalu mengunggah ulang folder dist yang baru.',
    ],
  },
];

export const FAQ_CATEGORIES = Array.from(new Set(FAQ_ITEMS.map((item) => item.kategori)));
