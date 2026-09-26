import { useState, type FormEvent, type KeyboardEvent } from 'react';
import type { BlokKonsep, Istilah, SumberIstilah } from '../../types/keywords';

const LABEL_SUMBER: Record<SumberIstilah, { label: string; kelas: string }> = {
  topik: { label: 'topik', kelas: 'bg-gray-100 text-gray-700' },
  manual: { label: 'manual', kelas: 'bg-gray-100 text-gray-700' },
  agrovoc: { label: 'AGROVOC', kelas: 'bg-emerald-50 text-emerald-700' },
  openalex: { label: 'literatur', kelas: 'bg-sky-50 text-sky-700' },
  varian: { label: 'varian', kelas: 'bg-amber-50 text-amber-700' },
  wilayah: { label: 'wilayah', kelas: 'bg-violet-50 text-violet-700' },
  'paper-kunci': { label: 'paper kunci', kelas: 'bg-rose-50 text-rose-700' },
  ai: { label: 'AI', kelas: 'bg-fuchsia-50 text-fuchsia-700' },
};

const fmt = new Intl.NumberFormat('id-ID');

function Hits({ istilah }: { istilah: Istilah }) {
  if (istilah.hits === undefined) return null;
  if (istilah.hits === 0) return <span className="text-xs font-medium text-red-600">0 hit</span>;
  return (
    <span
      className={`text-xs tabular-nums ${istilah.hits > 1_000_000 ? 'font-medium text-amber-700' : 'text-gray-500'}`}
      title={istilah.hits > 1_000_000 ? 'Sangat umum — bisa membuat hasil terlalu luas' : 'Jumlah hasil OpenAlex untuk istilah ini saja'}
    >
      {fmt.format(istilah.hits)}
    </span>
  );
}

interface Props {
  blok: BlokKonsep;
  nomor: number;
  semuaBlok: BlokKonsep[];
  onUbahNama: (nama: string) => void;
  onHapusBlok: () => void;
  onToggle: (istilahId: string, dipilih: boolean) => void;
  onHapusIstilah: (istilahId: string) => void;
  onPindah: (istilahId: string, keBlokId: string) => void;
  onTambahIstilah: (teks: string) => void;
  onTambahIndonesia: (teks: string[]) => void;
  onHapusIndonesia: (teks: string) => void;
}

export function BlockCard(props: Props) {
  const { blok, nomor, semuaBlok } = props;
  const [baru, setBaru] = useState('');
  const [baruId, setBaruId] = useState('');
  const jumlahDipilih = blok.istilah.filter((i) => i.dipilih).length;

  function kirimBaru(e: FormEvent) {
    e.preventDefault();
    const daftar = baru.split(/[;\n]/).map((t) => t.trim()).filter(Boolean);
    daftar.forEach((t) => props.onTambahIstilah(t));
    setBaru('');
  }

  function tambahIndonesia(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const daftar = baruId.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
    if (daftar.length > 0) props.onTambahIndonesia(daftar);
    setBaruId('');
  }

  const saranMelayu = (blok.petunjukMelayu ?? []).filter(
    (t) => !blok.istilahIndonesia.some((x) => x.toLowerCase() === t.toLowerCase()),
  );

  return (
    <div className="flex flex-col rounded-md border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-xs font-semibold text-white">{nomor}</span>
        <input
          value={blok.nama}
          onChange={(e) => props.onUbahNama(e.target.value)}
          className="min-w-0 flex-1 rounded border border-transparent px-1 py-0.5 text-sm font-semibold hover:border-gray-200 focus:border-indigo-300 focus:outline-none"
          aria-label="Nama konsep"
        />
        <span className="shrink-0 text-xs text-gray-500">{jumlahDipilih} dipakai</span>
        <button
          type="button"
          onClick={props.onHapusBlok}
          className="shrink-0 rounded px-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
          title="Hapus konsep ini"
        >
          ×
        </button>
      </div>

      <ul className="max-h-80 divide-y divide-gray-50 overflow-y-auto">
        {blok.istilah.map((i) => {
          const s = LABEL_SUMBER[i.sumber];
          return (
            <li key={i.id} className="flex items-center gap-2 px-3 py-1.5 text-sm" title={i.keterangan}>
              <input
                type="checkbox"
                checked={i.dipilih}
                onChange={(e) => props.onToggle(i.id, e.target.checked)}
                className="h-4 w-4 shrink-0 accent-indigo-600"
                aria-label={`Pakai istilah ${i.teks}`}
              />
              <span className={`min-w-0 flex-1 truncate ${i.dipilih ? 'text-gray-900' : 'text-gray-400'}`}>{i.teks}</span>
              <Hits istilah={i} />
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${s.kelas}`}>
                {s.label}
              </span>
              {semuaBlok.length > 1 && (
                <select
                  value=""
                  onChange={(e) => e.target.value && props.onPindah(i.id, e.target.value)}
                  className="w-6 shrink-0 cursor-pointer appearance-none rounded border-0 bg-transparent text-center text-xs text-gray-400 hover:bg-gray-100"
                  title="Pindahkan ke konsep lain"
                  aria-label="Pindahkan ke konsep lain"
                >
                  <option value="">⇄</option>
                  {semuaBlok
                    .filter((b) => b.id !== blok.id)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        → {b.nama}
                      </option>
                    ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => props.onHapusIstilah(i.id)}
                className="shrink-0 rounded px-1 text-gray-300 hover:bg-red-50 hover:text-red-600"
                aria-label={`Hapus ${i.teks}`}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      <form onSubmit={kirimBaru} className="flex gap-2 border-t border-gray-100 px-3 py-2">
        <input
          value={baru}
          onChange={(e) => setBaru(e.target.value)}
          placeholder="Tambah istilah sendiri…"
          className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <button type="submit" className="rounded bg-gray-100 px-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
          +
        </button>
      </form>

      <div className="space-y-1.5 border-t border-gray-100 bg-gray-50 px-3 py-2">
        <span className="text-xs font-medium text-gray-600">Padanan Indonesia</span>
        <div className="flex flex-wrap gap-1">
          {blok.istilahIndonesia.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-gray-200">
              {t}
              <button type="button" onClick={() => props.onHapusIndonesia(t)} className="text-gray-400 hover:text-red-600" aria-label={`Hapus ${t}`}>
                ×
              </button>
            </span>
          ))}
          <input
            value={baruId}
            onChange={(e) => setBaruId(e.target.value)}
            onKeyDown={tambahIndonesia}
            placeholder="ketik lalu Enter"
            className="w-28 flex-1 rounded border border-gray-300 bg-white px-2 py-0.5 text-xs"
          />
        </div>
        {saranMelayu.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
            <span title="AGROVOC tidak punya label bahasa Indonesia; label Melayu ini hanya petunjuk">Petunjuk (Melayu):</span>
            {saranMelayu.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => props.onTambahIndonesia([t])}
                className="rounded-full border border-dashed border-gray-300 px-2 py-0.5 hover:border-indigo-400 hover:text-indigo-700"
              >
                + {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
