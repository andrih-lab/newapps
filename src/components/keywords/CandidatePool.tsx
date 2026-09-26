import type { BlokKonsep, KandidatTersimpan } from '../../types/keywords';
import { PilihBlokChip } from './PilihBlokChip';

interface Props {
  kandidat: KandidatTersimpan[];
  jumlahSampel?: number;
  blok: BlokKonsep[];
  onTambah: (k: KandidatTersimpan, blokId: string) => void;
  onAbaikan: (k: KandidatTersimpan) => void;
}

/** Kandidat istilah hasil penambangan literatur — satu klik untuk memasukkannya ke konsep. */
export function CandidatePool({ kandidat, jumlahSampel, blok, onTambah, onAbaikan }: Props) {
  if (kandidat.length === 0) return null;
  const namaBlok = new Map(blok.map((b) => [b.id, b.nama]));

  return (
    <div className="rounded-md border border-sky-200 bg-sky-50/50 p-3">
      <h3 className="text-sm font-semibold text-gray-900">Saran dari literatur</h3>
      <p className="mt-0.5 text-xs text-gray-600">
        Istilah yang sering dipakai di {jumlahSampel ?? 'sampel'} artikel OpenAlex paling relevan dan belum ada di
        strategi Anda. Angka = jumlah artikel yang memuatnya. Klik untuk memasukkan.
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {kandidat.map((k) => (
          <li key={k.teks} className="inline-flex items-center overflow-hidden rounded-full bg-white text-xs ring-1 ring-sky-200">
            <span className="py-1 pl-2.5 pr-1.5 text-gray-800">
              {k.teks} <span className="tabular-nums text-gray-400">{k.df}</span>
            </span>
            {k.blokSaran && namaBlok.has(k.blokSaran) ? (
              <button
                type="button"
                onClick={() => onTambah(k, k.blokSaran as string)}
                className="border-l border-sky-100 px-2 py-1 font-medium text-sky-700 hover:bg-sky-100"
                title={`Tambahkan ke konsep "${namaBlok.get(k.blokSaran)}"`}
              >
                + {namaBlok.get(k.blokSaran)}
              </button>
            ) : null}
            <PilihBlokChip
              blok={blok}
              onPilih={(id) => onTambah(k, id)}
              label={<span className="px-2 py-1 text-sky-700">{k.blokSaran ? '⋯' : '+ ke…'}</span>}
              className="border-l border-sky-100 hover:bg-sky-100"
              judul={`Pilih konsep untuk ${k.teks}`}
            />
            <button
              type="button"
              onClick={() => onAbaikan(k)}
              className="border-l border-sky-100 px-2 py-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              aria-label={`Abaikan ${k.teks}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
