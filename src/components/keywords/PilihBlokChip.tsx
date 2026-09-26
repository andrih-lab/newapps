import type { ReactNode } from 'react';
import type { BlokKonsep } from '../../types/keywords';

interface Props {
  blok: BlokKonsep[];
  onPilih: (blokId: string) => void;
  label: ReactNode;
  className?: string;
  judul?: string;
  awalanOpsi?: string;
}

/**
 * Chip yang membuka daftar konsep saat diklik. <select> transparan ditumpuk di
 * atas label agar lebar chip mengikuti labelnya — bukan opsi terpanjang.
 */
export function PilihBlokChip({ blok, onPilih, label, className = '', judul, awalanOpsi = '' }: Props) {
  return (
    <span className={`relative inline-flex cursor-pointer items-center ${className}`} title={judul}>
      {label}
      <select
        value=""
        onChange={(e) => e.target.value && onPilih(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={judul ?? 'Pilih konsep'}
      >
        <option value="" disabled>
          Pilih konsep…
        </option>
        {blok.map((b) => (
          <option key={b.id} value={b.id}>
            {awalanOpsi}
            {b.nama}
          </option>
        ))}
      </select>
    </span>
  );
}
