import type { ReportData } from '../report/gatherReportData';
import type { RecordItem } from '../types/record';
import { normalizeDoi } from '../lib/doi';
import { susunSemuaString } from '../keywords/buildQueries';
import { kataKunciBermakna } from '../keywords/mining';

/**
 * Paket Bahan Konten: satu file Markdown berisi data terverifikasi dari
 * proyek (bibliometrik, bukti per studi, daftar pustaka) plus instruksi siap
 * pakai untuk asisten AI — agar artikel, blog, atau naskah video yang ditulis
 * dengan bantuan AI tetap berpijak pada sumber nyata dan bernomor [n].
 *
 * Telaah sendiri tidak memanggil AI di sini; file ini dibawa pengguna ke
 * asisten pilihannya. Seluruh isi disusun deterministik dari data proyek.
 */

export type TujuanKonten = 'artikel' | 'blog' | 'video';
export type CakupanStudi = 'disertakan' | 'lolos-abstrak' | 'semua';
export type BahasaKonten = 'id' | 'en';

export interface OpsiPaket {
  tujuan: TujuanKonten;
  bahasa: BahasaKonten;
  cakupan: CakupanStudi;
  maksStudi: number;
  sertakanAbstrak: boolean;
}

export const LABEL_TUJUAN: Record<TujuanKonten, string> = {
  artikel: 'Artikel ilmiah (SLR/bibliometrik)',
  blog: 'Artikel blog populer',
  video: 'Naskah video YouTube (faceless, narasi)',
};

const BATAS_ABSTRAK = 1500;

export function studiUntukCakupan(data: ReportData, cakupan: CakupanStudi): RecordItem[] {
  if (cakupan === 'disertakan') return data.includedRecords;
  if (cakupan === 'lolos-abstrak') return data.nonDuplicateRecords.filter((r) => r.statusSkrining === 'termasuk');
  return [...data.nonDuplicateRecords].sort((a, b) => b.jumlahSitasi - a.jumlahSitasi);
}

/** Cakupan bawaan: yang paling "matang" yang tersedia. */
export function cakupanBawaan(data: ReportData): CakupanStudi {
  if (data.includedRecords.length > 0) return 'disertakan';
  if (studiUntukCakupan(data, 'lolos-abstrak').length > 0) return 'lolos-abstrak';
  return 'semua';
}

function namaBelakang(nama: string): string {
  const n = nama.trim();
  if (n.includes(',')) return n.split(',')[0].trim();
  const bagian = n.split(/\s+/);
  return bagian[bagian.length - 1] ?? n;
}

function labelPenulis(penulis: string[]): string {
  if (penulis.length === 0) return 'Anonim';
  if (penulis.length === 1) return namaBelakang(penulis[0]);
  if (penulis.length === 2) return `${namaBelakang(penulis[0])} & ${namaBelakang(penulis[1])}`;
  return `${namaBelakang(penulis[0])} et al.`;
}

function daftarPenulisPustaka(penulis: string[]): string {
  if (penulis.length === 0) return 'Anonim';
  if (penulis.length <= 3) return penulis.join(', ');
  return `${penulis.slice(0, 3).join(', ')}, et al.`;
}

function tautanDoi(doi: string | null): string {
  const d = normalizeDoi(doi);
  return d ? `https://doi.org/${d}` : '';
}

function potong(teks: string, batas: number): string {
  const t = teks.replace(/\s+/g, ' ').trim();
  return t.length > batas ? `${t.slice(0, batas).replace(/\s\S*$/, '')} …` : t;
}

function hitungKataKunci(records: RecordItem[]): Map<string, { teks: string; n: number }> {
  const hasil = new Map<string, { teks: string; n: number }>();
  for (const r of records) {
    // Label disiplin umum/salah-bidang dari OpenAlex ("Geography", "Corporate governance") dibuang.
    const unik = new Map(r.kataKunci.filter(kataKunciBermakna).map((k) => [k.trim().toLowerCase(), k.trim()]));
    for (const [kunci, teks] of unik) {
      if (!kunci) continue;
      const e = hasil.get(kunci) ?? { teks, n: 0 };
      e.n += 1;
      hasil.set(kunci, e);
    }
  }
  return hasil;
}

/**
 * Kata kunci yang proporsinya naik: bandingkan persentase record yang memuatnya
 * pada 3 tahun terakhir vs sebelumnya. Hanya kata kunci yang muncul ≥ 3 kali.
 */
function kataKunciNaik(records: RecordItem[], jumlah = 6): Array<{ teks: string; dulu: number; kini: number }> {
  const bertahun = records.filter((r) => r.tahun != null);
  if (bertahun.length < 20) return [];
  const maks = Math.max(...bertahun.map((r) => r.tahun as number));
  const kini = bertahun.filter((r) => (r.tahun as number) > maks - 3);
  const dulu = bertahun.filter((r) => (r.tahun as number) <= maks - 3);
  if (kini.length < 5 || dulu.length < 5) return [];
  const semua = hitungKataKunci(bertahun);
  const kKini = hitungKataKunci(kini);
  const kDulu = hitungKataKunci(dulu);
  return Array.from(semua.entries())
    .filter(([, v]) => v.n >= 3)
    .map(([k, v]) => ({
      teks: v.teks,
      kini: ((kKini.get(k)?.n ?? 0) / kini.length) * 100,
      dulu: ((kDulu.get(k)?.n ?? 0) / dulu.length) * 100,
    }))
    .filter((x) => x.kini > x.dulu)
    .sort((a, b) => b.kini - b.dulu - (a.kini - a.dulu))
    .slice(0, jumlah);
}

/** Kode negara ISO (dari OpenAlex) → nama negara sesuai bahasa paket; teks lain dibiarkan. */
function namaNegara(kode: string, bahasa: BahasaKonten): string {
  if (!/^[A-Z]{2}$/.test(kode)) return kode;
  try {
    return new Intl.DisplayNames([bahasa], { type: 'region' }).of(kode) ?? kode;
  } catch {
    return kode;
  }
}

const persen = (x: number) => `${x.toFixed(1).replace('.', ',')}%`;

function instruksi(o: OpsiPaket, jumlahStudi: number): string {
  const bahasa = o.bahasa === 'id' ? 'Bahasa Indonesia' : 'bahasa Inggris';
  const aturan = [
    'Gunakan HANYA fakta, angka, dan studi yang ada di paket ini. Jangan menambah studi, statistik, atau kutipan dari luar paket.',
    `Setiap klaim faktual diberi rujukan nomor studi dalam kurung siku, mis. [3] atau [2, 5], sesuai Bagian 4 dan 5 (ada ${jumlahStudi} studi).`,
    'Bila paket tidak cukup untuk mendukung sebuah pernyataan, tulis [perlu dicek] alih-alih menebak.',
    'Bedakan temuan satu studi dari pola lintas studi; jangan menggeneralisasi dari 1–2 studi.',
    'Kutipan langsung hanya boleh diambil dari bagian "Kutipan verbatim", lengkap dengan nomor halamannya.',
    'Angka bibliometrik (Bagian 3) menggambarkan kumpulan data pencarian ini, bukan seluruh literatur dunia — sampaikan dengan kalimat seperti "dalam data yang dianalisis".',
  ];

  let tugas: string;
  if (o.tujuan === 'artikel') {
    tugas = `Bantu saya menyusun artikel ilmiah (systematic literature review/bibliometrik) dalam ${bahasa}.
1. Usulkan 2–3 alternatif judul dan kerangka artikel (Pendahuluan, Metode, Hasil, Diskusi, Kesimpulan).
2. Susun tabel sintesis: kelompokkan studi ke dalam 3–6 tema, sebutkan nomor studi per tema dan temuan intinya.
3. Tulis draf paragraf Hasil berdasarkan Bagian 3 dan 4.
4. Untuk Pendahuluan dan Diskusi, berikan poin-poin argumen beserta rujukan [n] — BUKAN teks jadi; saya akan menulisnya sendiri.
5. Tutup dengan daftar celah penelitian (research gaps) yang terlihat dari data, masing-masing dengan rujukan [n].
Catatan: banyak jurnal mewajibkan pengungkapan penggunaan AI; draf ini akan saya tulis ulang dan periksa.`;
  } else if (o.tujuan === 'blog') {
    // Kerangka TANYA milik penulis (lihat repo konten: docs/framework-tanya.md).
    tugas = `Tulis artikel blog keilmuan dalam ${bahasa} dengan kerangka TANYA: "Satu pertanyaan, jawab di depan, buktikan dengan tautan, akui batasnya, akhiri dengan ajakan." Ini kebalikan IMRAD — jawaban di depan.
Format: Markdown, 800–1.200 kata, subjudul tiap 200–300 kata, kalimat rata-rata < 20 kata, satu paragraf satu gagasan. Jangan menulis label T/A/N/Y/A di teks.
1. JUDUL: pertanyaan yang sudah ada di kepala pembaca awam (atau memuat ketegangan); bukan judul jurnal, bukan topik klise. Beri juga 2 alternatif (satu aman untuk mesin pencari, satu lebih memancing).
2. T — Tanya: buka dari SATU pertanyaan pembaca awam (nelayan, mahasiswa, pejabat desa, orang tua), bukan dari topik; tanpa "dan" yang menjadikannya dua pertanyaan. Pertanyaan lain hanya pelayan.
3. A — Awali dengan jawaban: pesan utama selesai di paragraf 2–3, bisa dinyatakan dalam satu kalimat < 25 kata. Dilarang: pembukaan latar belakang gaya jurnal, "janji jawaban" tanpa mekanisme konkret, kalimat meta tentang tulisan.
4. N — Nyatakan bukti: pilih 3–7 studi TERKUAT dari Bagian 4 (utamakan artikel tinjauan/review), kelompokkan bukti per masalah. Di badan tulisan pakai tautan Markdown langsung ke DOI sebagai "tautan diam-diam" (bukan [n] dan bukan Nama, Tahun); penyebutan naratif maksimal 1–2 kali dengan nama jurnal/lembaga. Setiap angka bertautan dan dikalibrasi persis pada cakupan sumbernya; hindari generalisasi; jelaskan istilah teknis saat pertama muncul.
5. Y — Yakinkan dengan nuansa: satu paragraf jujur tentang yang belum diketahui, perdebatan, atau keteralihan konteks (pakai Bagian 3 dan 6).
6. A — Ajak bertindak: satu hal konkret dan proporsional yang bisa dilakukan pembaca biasa; tanpa penutup klise.
7. "## Sumber dan bacaan lanjutan": studi yang dipakai, masing-masing diawali satu baris keterangan ("Untuk …: sitasi. DOI"). Minimal satu sumber open access — bila status akses tidak diketahui dari paket, tandai [cek open access].
8. Setelah tulisan, beri bagian terpisah "--- CATATAN PENYUNTING (jangan diterbitkan) ---": daftar periksa TANYA (✅/⚠️ + alasan) dan tabel audit klaim (klaim | jenis: pengetahuan umum/butuh rujukan/angka | sumber [n] atau [perlu rujukan]).`;
  } else {
    tugas = `Tulis naskah video YouTube faceless (tanpa wajah, dengan narasi suara) dalam ${bahasa}, durasi 8–10 menit (±1.200–1.400 kata narasi).
1. Berikan 3 opsi judul, teks thumbnail (maks. 5 kata), deskripsi video dengan chapter/penanda waktu, dan 10 tag.
2. Naskah dalam tabel dengan kolom: Waktu | Narasi | Visual. Narasi ditulis untuk diucapkan (kalimat pendek, ritme lisan); JANGAN membacakan nomor rujukan [n] di narasi — cantumkan [n] di kolom Visual/catatan saja.
3. 15 detik pertama berisi hook yang kuat; akhiri dengan ringkasan dan ajakan (subscribe/komentar) yang wajar.
4. Kolom Visual: sarankan b-roll stok, peta, animasi teks, atau grafik yang dibuat dari angka Bagian 3. Jangan menyarankan memakai gambar/figur dari artikel kecuali berlisensi terbuka (mis. CC BY) dan diberi atribusi.
5. Setelah naskah, tulis daftar sumber lengkap (dengan DOI) untuk deskripsi video.
Catatan: bila memakai suara sintetis (TTS) yang realistis, periksa kebijakan pengungkapan konten sintetis YouTube.`;
  }

  return `## 1. Instruksi untuk asisten AI

**Tujuan:** ${LABEL_TUJUAN[o.tujuan]}

### Tugas
${tugas}

### Aturan wajib
${aturan.map((a) => `- ${a}`).join('\n')}
`;
}

function bagianKonteks(data: ReportData, studi: RecordItem[], o: OpsiPaket): string {
  const p = data.project;
  const semua = data.nonDuplicateRecords;
  const tahun = semua.map((r) => r.tahun).filter((t): t is number => t != null);
  const baris: string[] = ['## 2. Konteks', ''];
  if (p.pertanyaanPenelitian) baris.push(`- **Topik / pertanyaan penelitian:** ${p.pertanyaanPenelitian}`);
  baris.push(
    `- **Kumpulan data:** ${semua.length} record unik${tahun.length > 0 ? `, terbit ${Math.min(...tahun)}–${Math.max(...tahun)}` : ''}.`,
  );
  const cakupan =
    o.cakupan === 'disertakan'
      ? 'studi yang lolos skrining abstrak dan penilaian full teks'
      : o.cakupan === 'lolos-abstrak'
        ? 'studi yang lolos skrining judul/abstrak (full teks belum dinilai)'
        : `${studi.length} record paling banyak disitasi (belum melalui skrining)`;
  baris.push(`- **Studi di Bagian 4:** ${studi.length} ${o.cakupan === 'semua' ? 'record' : 'studi'} — ${cakupan}.`);

  const strat = p.strategiPencarian ? susunSemuaString(p.strategiPencarian.blok).find((x) => x.basisData === 'scopus') : null;
  if (strat) baris.push(`- **String pencarian (Scopus):** \`${strat.string}\``);
  for (const q of data.searchQueries.slice(0, 3)) {
    baris.push(`- **Pencarian ${q.sumber}** (${q.tanggal.slice(0, 10)}): \`${q.stringQuery}\` → ${q.jumlahHasil} record`);
  }

  const pr = data.prisma;
  if (pr.disaring > 0 && pr.belumDinilai < pr.disaring) {
    baris.push(
      `- **Alur seleksi (PRISMA):** ${pr.identifikasi.total} teridentifikasi → ${pr.duplikatDibuang} duplikat dibuang → ` +
        `${pr.disaring} disaring → ${pr.dieksklusiSkrining.total} dieksklusi di skrining abstrak → ` +
        `${pr.dinilaiFullText} dinilai full teks → ${pr.dieksklusiFullText.total} dieksklusi → ${pr.disertakan} disertakan.`,
    );
  }
  return `${baris.join('\n')}\n`;
}

function bagianBibliometrik(data: ReportData, nomorStudi: Map<string, number>, bahasa: BahasaKonten): string {
  const semua = data.nonDuplicateRecords;
  if (semua.length === 0) return '';
  const b = data.bibliometrics;
  const baris: string[] = [`## 3. Temuan bibliometrik (dari ${semua.length} record unik)`, ''];

  if (b.annualProduction.length > 0) {
    const puncak = b.annualProduction.reduce((x, y) => (y.jumlah > x.jumlah ? y : x));
    baris.push(`**Produksi tahunan:** ${b.annualProduction.map((t) => `${t.tahun}: ${t.jumlah}`).join(' · ')}`);
    baris.push(`- Tahun terbanyak: ${puncak.tahun} (${puncak.jumlah} publikasi).`);
    const maks = Math.max(...b.annualProduction.map((t) => t.tahun));
    const jml = (dari: number, sampai: number) =>
      b.annualProduction.filter((t) => t.tahun >= dari && t.tahun <= sampai).reduce((n, t) => n + t.jumlah, 0);
    const lima = jml(maks - 4, maks);
    const limaSebelum = jml(maks - 9, maks - 5);
    if (limaSebelum > 0) {
      baris.push(`- ${maks - 4}–${maks}: ${lima} publikasi, dibanding ${limaSebelum} pada ${maks - 9}–${maks - 5}.`);
    }
    baris.push('');
  }

  const daftar = (judul: string, items: Array<{ nama: string; jumlah: number }>) => {
    if (items.length === 0) return;
    baris.push(`**${judul}:** ${items.map((i) => `${i.nama} (${i.jumlah})`).join('; ')}`);
  };
  daftar('Negara afiliasi paling produktif', b.topCountries.map((c) => ({ ...c, nama: namaNegara(c.nama, bahasa) })));
  daftar('Jurnal paling produktif', b.topJournals);
  daftar('Penulis paling produktif', b.topAuthors);

  const kk = Array.from(hitungKataKunci(semua).values()).sort((x, y) => y.n - x.n).slice(0, 15);
  if (kk.length > 0) baris.push(`**Kata kunci terbanyak:** ${kk.map((k) => `${k.teks} (${k.n})`).join('; ')}`);

  const naik = kataKunciNaik(semua);
  if (naik.length > 0) {
    baris.push(
      `**Kata kunci yang proporsinya naik (3 tahun terakhir vs sebelumnya):** ${naik
        .map((k) => `${k.teks} (${persen(k.dulu)} → ${persen(k.kini)} record)`)
        .join('; ')}`,
    );
  }

  if (b.mostCited.length > 0) {
    baris.push('', '**Paling banyak disitasi:**');
    for (const m of b.mostCited) {
      const n = nomorStudi.get(m.id);
      baris.push(
        `- ${labelPenulis(m.penulis)} (${m.tahun ?? 't.t.'}). ${m.judul}. *${m.jurnal}* — ${m.jumlahSitasi} sitasi${n ? ` [${n}]` : ''}`,
      );
    }
  }
  return `${baris.join('\n')}\n`;
}

function bagianStudi(data: ReportData, studi: RecordItem[], o: OpsiPaket): string {
  const kolom = data.matrixColumns.filter((c) => c.key !== 'penulis' && c.key !== 'tahun');
  const baris: string[] = ['## 4. Bukti per studi', ''];
  studi.forEach((r, i) => {
    const ext = data.extractionByRecordId.get(r.id);
    baris.push(`### [${i + 1}] ${labelPenulis(r.penulis)} (${r.tahun ?? 't.t.'}) — ${r.judul || '(tanpa judul)'}`);
    const meta = [r.jurnal && `*${r.jurnal}*`, tautanDoi(r.doi), r.jumlahSitasi ? `${r.jumlahSitasi} sitasi` : ''].filter(Boolean);
    if (meta.length > 0) baris.push(meta.join(' · '));
    if (r.negara.length > 0) baris.push(`- **Negara (afiliasi):** ${r.negara.map((n) => namaNegara(n, o.bahasa)).join(', ')}`);
    if (ext) {
      for (const c of kolom) {
        const v = ext.kolom[c.key]?.trim();
        if (v) baris.push(`- **${c.label}:** ${v}`);
      }
      if (ext.kutipan.length > 0) {
        baris.push('- **Kutipan verbatim:**');
        for (const k of ext.kutipan) baris.push(`  > "${k.teks.trim()}"${k.halaman != null ? ` (hlm. ${k.halaman})` : ''}`);
      }
    }
    const kk = r.kataKunci.filter(kataKunciBermakna);
    if (kk.length > 0) baris.push(`- **Kata kunci:** ${kk.join('; ')}`);
    if (r.abstrak && (o.sertakanAbstrak || !ext)) baris.push(`- **Abstrak:** ${potong(r.abstrak, BATAS_ABSTRAK)}`);
    baris.push('');
  });
  return baris.join('\n');
}

function bagianPustaka(studi: RecordItem[]): string {
  const baris = ['## 5. Daftar pustaka', ''];
  studi.forEach((r, i) => {
    const doi = tautanDoi(r.doi);
    baris.push(
      `[${i + 1}] ${daftarPenulisPustaka(r.penulis)} (${r.tahun ?? 't.t.'}). ${r.judul}.${r.jurnal ? ` *${r.jurnal}*.` : ''}${doi ? ` ${doi}` : ''}`,
    );
  });
  return `${baris.join('\n')}\n`;
}

function bagianKeterbatasan(data: ReportData, studi: RecordItem[], o: OpsiPaket): string {
  const catatan: string[] = [];
  const tanpaAbstrak = studi.filter((r) => !r.abstrak).length;
  const tanpaEkstraksi = studi.filter((r) => !data.extractionByRecordId.has(r.id)).length;
  if (o.cakupan !== 'disertakan') {
    catatan.push('Studi belum melalui penilaian full teks — sebagian mungkin tidak relevan; perlakukan sebagai bahan awal.');
  }
  if (tanpaEkstraksi > 0) catatan.push(`${tanpaEkstraksi} dari ${studi.length} studi belum punya matriks ekstraksi; isinya hanya dari abstrak/metadata.`);
  if (tanpaAbstrak > 0) catatan.push(`${tanpaAbstrak} studi tidak memiliki abstrak di data impor.`);
  catatan.push('Jumlah sitasi berasal dari basis data sumber pada saat impor dan dapat berubah.');
  catatan.push('Negara di data bibliometrik adalah negara afiliasi penulis, bukan selalu lokasi penelitian.');
  return `## 6. Keterbatasan data\n\n${catatan.map((c) => `- ${c}`).join('\n')}\n`;
}

export function susunPaketKonten(data: ReportData, o: OpsiPaket): { markdown: string; jumlahStudi: number } {
  const studi = studiUntukCakupan(data, o.cakupan).slice(0, Math.max(1, o.maksStudi));
  const nomorStudi = new Map(studi.map((r, i) => [r.id, i + 1]));
  const tanggal = new Date().toISOString().slice(0, 10);

  const markdown = [
    `# Paket Bahan Konten — ${data.project.nama}`,
    '',
    `> Disusun otomatis oleh Telaah pada ${tanggal} dari data proyek. Unggah atau tempel seluruh file ini ke asisten AI, lalu minta: "Ikuti instruksi di Bagian 1."`,
    '',
    instruksi(o, studi.length),
    bagianKonteks(data, studi, o),
    bagianBibliometrik(data, nomorStudi, o.bahasa),
    bagianStudi(data, studi, o),
    bagianPustaka(studi),
    bagianKeterbatasan(data, studi, o),
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return { markdown, jumlahStudi: studi.length };
}
