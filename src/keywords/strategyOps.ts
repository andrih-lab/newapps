import type { BlokKonsep, Istilah, StrategiPencarian } from '../types/keywords';
import { pecahTopik } from './conceptSplit';
import { kunciStem } from './text';

/**
 * Operasi murni (immutable) atas StrategiPencarian — dipakai halaman
 * Perancang Kata Kunci agar logika penambahan/deduplikasi istilah terpusat.
 */

export type IstilahBaru = Omit<Istilah, 'id'>;

function stempel(s: StrategiPencarian): StrategiPencarian {
  return { ...s, diubah: new Date().toISOString() };
}

export function strategiKosong(topik = ''): StrategiPencarian {
  return { topik, blok: [], paperKunci: [], diubah: new Date().toISOString() };
}

export function blokBaru(nama: string, istilah: IstilahBaru[] = []): BlokKonsep {
  return {
    id: crypto.randomUUID(),
    nama,
    istilah: istilah.map((i) => ({ ...i, id: crypto.randomUUID() })),
    istilahIndonesia: [],
  };
}

/** Buat blok dari topik; tiap potongan topik menjadi istilah pertama bloknya. */
export function blokDariTopik(topik: string): BlokKonsep[] {
  return pecahTopik(topik).map((t) => blokBaru(t, [{ teks: t, sumber: 'topik', dipilih: true }]));
}

/** Semua istilah (teks) di seluruh blok — untuk menyaring kandidat yang sudah ada. */
export function semuaIstilah(s: StrategiPencarian): string[] {
  return s.blok.flatMap((b) => b.istilah.map((i) => i.teks));
}

function ubahBlok(s: StrategiPencarian, blokId: string, f: (b: BlokKonsep) => BlokKonsep): StrategiPencarian {
  return stempel({ ...s, blok: s.blok.map((b) => (b.id === blokId ? f(b) : b)) });
}

/** Tambah istilah ke blok; istilah yang bentuk dasarnya sudah ada di blok dilewati. */
export function tambahIstilah(s: StrategiPencarian, blokId: string, baru: IstilahBaru[]): StrategiPencarian {
  return ubahBlok(s, blokId, (b) => {
    const ada = new Set(b.istilah.map((i) => kunciStem(i.teks)));
    const ditambah: Istilah[] = [];
    for (const i of baru) {
      const k = kunciStem(i.teks);
      if (!k || ada.has(k)) continue;
      ada.add(k);
      ditambah.push({ ...i, teks: i.teks.trim(), id: crypto.randomUUID() });
    }
    return { ...b, istilah: [...b.istilah, ...ditambah] };
  });
}

export function perbaruiIstilah(
  s: StrategiPencarian,
  blokId: string,
  istilahId: string,
  patch: Partial<Istilah>,
): StrategiPencarian {
  return ubahBlok(s, blokId, (b) => ({
    ...b,
    istilah: b.istilah.map((i) => (i.id === istilahId ? { ...i, ...patch } : i)),
  }));
}

export function hapusIstilah(s: StrategiPencarian, blokId: string, istilahId: string): StrategiPencarian {
  return ubahBlok(s, blokId, (b) => ({ ...b, istilah: b.istilah.filter((i) => i.id !== istilahId) }));
}

export function pindahIstilah(s: StrategiPencarian, dariId: string, keId: string, istilahId: string): StrategiPencarian {
  const istilah = s.blok.find((b) => b.id === dariId)?.istilah.find((i) => i.id === istilahId);
  if (!istilah || dariId === keId) return s;
  const { id: _id, ...tanpaId } = istilah;
  return tambahIstilah(hapusIstilah(s, dariId, istilahId), keId, [tanpaId]);
}

export function perbaruiBlok(s: StrategiPencarian, blokId: string, patch: Partial<BlokKonsep>): StrategiPencarian {
  return ubahBlok(s, blokId, (b) => ({ ...b, ...patch }));
}

export function hapusBlok(s: StrategiPencarian, blokId: string): StrategiPencarian {
  return stempel({ ...s, blok: s.blok.filter((b) => b.id !== blokId) });
}

export function tambahBlok(s: StrategiPencarian, nama: string): StrategiPencarian {
  return stempel({ ...s, blok: [...s.blok, blokBaru(nama)] });
}

/** Tambah padanan Indonesia (tanpa duplikat, tidak peka huruf besar). */
export function tambahIstilahIndonesia(s: StrategiPencarian, blokId: string, baru: string[]): StrategiPencarian {
  return ubahBlok(s, blokId, (b) => {
    const ada = new Set(b.istilahIndonesia.map((t) => t.toLowerCase()));
    const tambahan = baru.map((t) => t.trim()).filter((t) => t && !ada.has(t.toLowerCase()) && (ada.add(t.toLowerCase()), true));
    return { ...b, istilahIndonesia: [...b.istilahIndonesia, ...tambahan] };
  });
}
