/**
 * Tipe data Perancang Kata Kunci (strategi pencarian berbasis blok konsep).
 * Disimpan sebagai field opsional `strategiPencarian` pada Project, sehingga
 * ikut tersimpan di IndexedDB dan cadangan JSON tanpa perubahan skema Dexie.
 */

/** Asal sebuah istilah — dicatat agar setiap istilah bisa dipertanggungjawabkan di Bab Metode. */
export type SumberIstilah =
  | 'topik'
  | 'manual'
  | 'agrovoc'
  | 'openalex'
  | 'varian'
  | 'wilayah'
  | 'paper-kunci'
  | 'ai';

export interface Istilah {
  id: string;
  teks: string;
  sumber: SumberIstilah;
  dipilih: boolean;
  /** Jumlah hasil OpenAlex untuk istilah ini saja. undefined = belum dihitung. */
  hits?: number;
  /** Keterangan asal, mis. "sinonim AGROVOC" atau "muncul di 23 dari 200 artikel". */
  keterangan?: string;
}

/** Satu konsep pencarian: istilah di dalamnya digabung OR, antar-blok digabung AND. */
export interface BlokKonsep {
  id: string;
  nama: string;
  istilah: Istilah[];
  /** Padanan bahasa Indonesia (untuk Garuda/SINTA/Google Scholar berbahasa Indonesia). */
  istilahIndonesia: string[];
  /** Label bahasa Melayu dari AGROVOC — sekadar petunjuk padanan Indonesia, tidak otomatis dipakai. */
  petunjukMelayu?: string[];
}

export interface HasilUjiRecall {
  tanggal: string;
  stringDiuji: string;
  totalDoi: number;
  ditemukan: string[];
  tidakTerindeks: string[];
  terlewat: Array<{ doi: string; judul: string; kataKunci: string[] }>;
}

/** Kandidat hasil penambangan literatur yang belum dimasukkan ke blok mana pun. */
export interface KandidatTersimpan {
  teks: string;
  df: number;
  asal: 'kata kunci' | 'judul/abstrak';
  /** Blok tebakan (id) — null bila tidak ada yang cocok. */
  blokSaran: string | null;
}

export interface StrategiPencarian {
  topik: string;
  blok: BlokKonsep[];
  /** DOI paper yang pasti relevan, untuk uji recall string. */
  paperKunci: string[];
  ujiRecall?: HasilUjiRecall;
  /** Jumlah artikel OpenAlex yang ditambang istilahnya (untuk dilaporkan di Bab Metode). */
  jumlahSampelTambang?: number;
  kandidat?: KandidatTersimpan[];
  totalHasilOpenAlex?: { nilai: number; tanggal: string; stringQuery: string };
  diubah: string;
}
