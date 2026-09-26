import { useState } from 'react';
import type { BlokKonsep, HasilUjiRecall } from '../../types/keywords';
import { Button } from '../common/Button';
import { kataKunciBermakna } from '../../keywords/mining';
import { PilihBlokChip } from './PilihBlokChip';

interface Props {
  paperKunci: string[];
  hasil?: HasilUjiRecall;
  stringSaatIni: string;
  blok: BlokKonsep[];
  busy: boolean;
  onUbahPaperKunci: (dois: string[]) => void;
  onUji: (dois: string[]) => void;
  onTambahIstilah: (teks: string, blokId: string) => void;
}

/**
 * Uji "paper kunci": apakah string menjaring artikel yang PASTI relevan?
 * Praktik baku validasi strategi pencarian; hasilnya dilaporkan di Bab Metode.
 */
export function RecallTest({ paperKunci, hasil, stringSaatIni, blok, busy, onUbahPaperKunci, onUji, onTambahIstilah }: Props) {
  const [teks, setTeks] = useState(paperKunci.join('\n'));
  const usang = hasil && hasil.stringDiuji !== stringSaatIni;
  const diuji = hasil ? hasil.totalDoi - hasil.tidakTerindeks.length : 0;
  const persen = hasil && diuji > 0 ? Math.round((hasil.ditemukan.length / diuji) * 100) : null;

  function simpanDanUji() {
    const dois = teks.split(/[\s,;]+/).map((d) => d.trim()).filter(Boolean);
    onUji(dois);
  }

  return (
    <div className="space-y-3 rounded-md border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-600">
        Tempel 5–10 DOI artikel yang Anda yakin <em>harus</em> ikut terjaring (satu per baris). Telaah mengecek berapa yang
        terjaring oleh string OpenAlex saat ini, lalu menyarankan istilah dari artikel yang terlewat.
      </p>
      <textarea
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        onBlur={() => onUbahPaperKunci(teks.split(/[\s,;]+/).map((d) => d.trim()).filter(Boolean))}
        rows={4}
        placeholder={'10.1038/ngeo1123\nhttps://doi.org/10.1038/s41558-018-0090-4'}
        className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
      />
      <Button type="button" onClick={simpanDanUji} disabled={busy || !teks.trim() || !stringSaatIni}>
        {busy ? 'Menguji… (OpenAlex bisa 5–15 detik)' : 'Uji string'}
      </Button>

      {hasil && (
        <div className={`space-y-2 rounded-md p-3 ${usang ? 'bg-gray-50 opacity-70' : 'bg-indigo-50/50'}`}>
          {usang && <p className="text-xs font-medium text-amber-700">String sudah berubah sejak diuji — uji ulang.</p>}
          <p className="text-sm">
            Terjaring{' '}
            <strong>
              {hasil.ditemukan.length} dari {diuji}
            </strong>{' '}
            paper kunci{persen !== null && <> ({persen}%)</>}.
            {persen !== null && persen < 80 && <span className="text-amber-700"> Target lazim ≥ 80–90%.</span>}
          </p>
          {hasil.tidakTerindeks.length > 0 && (
            <p className="text-xs text-gray-500">Tidak ada di OpenAlex (tidak dihitung): {hasil.tidakTerindeks.join(', ')}</p>
          )}
          {hasil.terlewat.map((t) => (
            <div key={t.doi} className="rounded border border-amber-200 bg-white p-2">
              <p className="text-xs font-medium text-gray-900">Terlewat: {t.judul || t.doi}</p>
              <p className="text-[11px] text-gray-500">{t.doi}</p>
              {t.kataKunci.length > 0 && blok.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                  <span className="text-gray-500">Kata kuncinya:</span>
                  {t.kataKunci
                    .filter(kataKunciBermakna)
                    .slice(0, 10)
                    .map((k) => (
                      <PilihBlokChip
                        key={k}
                        blok={blok}
                        onPilih={(id) => onTambahIstilah(k, id)}
                        label={<span>+ {k}</span>}
                        awalanOpsi="ke: "
                        className="rounded-full border border-dashed border-gray-300 bg-white px-2 py-0.5 hover:border-indigo-400"
                        judul="Tambahkan ke konsep…"
                      />
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
