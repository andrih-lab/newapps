import { useEffect, useMemo, useState } from 'react';
import { useProjectContext } from '../hooks/useProjectContext';
import { gatherReportData, type ReportData } from '../report/gatherReportData';
import {
  cakupanBawaan,
  LABEL_TUJUAN,
  studiUntukCakupan,
  susunPaketKonten,
  type BahasaKonten,
  type CakupanStudi,
  type TujuanKonten,
} from '../contentPack/buildContentPack';
import { downloadBlob } from '../lib/exportCsv';
import { Button } from '../components/common/Button';

const DESKRIPSI_TUJUAN: Record<TujuanKonten, string> = {
  artikel: 'Kerangka, tabel sintesis tema, draf Hasil, poin argumen Diskusi, dan celah penelitian.',
  blog: '1.200–1.800 kata, bahasa populer, judul & meta description, daftar pustaka ber-DOI.',
  video: 'Naskah 8–10 menit dalam tabel Waktu | Narasi | Visual, plus judul, thumbnail, deskripsi.',
};

const IKON_TUJUAN: Record<TujuanKonten, string> = { artikel: '📄', blog: '✍️', video: '🎬' };

// Perkiraan kasar: ±4 karakter per token untuk teks campuran Indonesia/Inggris.
const KARAKTER_PER_TOKEN = 4;
const BATAS_NYAMAN_TOKEN = 60_000;

function namaFile(nama: string, tujuan: TujuanKonten): string {
  const slug = nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'proyek';
  return `paket-konten-${tujuan}-${slug}.md`;
}

export function ContentPackPage() {
  const { project } = useProjectContext();
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tujuan, setTujuan] = useState<TujuanKonten>('blog');
  const [bahasa, setBahasa] = useState<BahasaKonten>('id');
  const [cakupan, setCakupan] = useState<CakupanStudi>('semua');
  const [maksStudi, setMaksStudi] = useState(30);
  const [sertakanAbstrak, setSertakanAbstrak] = useState(true);
  const [tersalin, setTersalin] = useState(false);

  useEffect(() => {
    gatherReportData(project.id)
      .then((d) => {
        setData(d);
        setCakupan(cakupanBawaan(d));
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [project.id]);

  const paket = useMemo(
    () => (data ? susunPaketKonten(data, { tujuan, bahasa, cakupan, maksStudi, sertakanAbstrak }) : null),
    [data, tujuan, bahasa, cakupan, maksStudi, sertakanAbstrak],
  );

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data || !paket) return <p className="text-sm text-gray-500">Menyiapkan data proyek…</p>;

  if (data.nonDuplicateRecords.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        Belum ada record di proyek ini. Impor hasil pencarian dulu (halaman Impor Data), lalu kembali ke sini.
      </p>
    );
  }

  const opsiCakupan: Array<{ nilai: CakupanStudi; label: string; jumlah: number }> = [
    { nilai: 'disertakan', label: 'Studi yang disertakan (lolos full teks)', jumlah: data.includedRecords.length },
    { nilai: 'lolos-abstrak', label: 'Lolos skrining abstrak', jumlah: studiUntukCakupan(data, 'lolos-abstrak').length },
    { nilai: 'semua', label: 'Semua record, urut sitasi terbanyak', jumlah: data.nonDuplicateRecords.length },
  ];

  const token = Math.round(paket.markdown.length / KARAKTER_PER_TOKEN);

  async function salin() {
    if (!paket) return;
    try {
      await navigator.clipboard.writeText(paket.markdown);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2000);
    } catch {
      setError('Peramban menolak akses clipboard. Gunakan tombol Unduh.');
    }
  }

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-gray-600">
        Satu file berisi data terverifikasi proyek ini — temuan bibliometrik, bukti per studi bernomor, dan daftar
        pustaka — plus instruksi siap pakai. Bawa ke asisten AI (mis. Claude) agar tulisan yang dihasilkan tetap
        berpijak pada sumber nyata.
      </p>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-900">1. Mau membuat apa?</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(LABEL_TUJUAN) as TujuanKonten[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTujuan(t)}
              className={`rounded-md border-2 p-3 text-left transition-colors ${
                tujuan === t ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="text-xl" aria-hidden>
                {IKON_TUJUAN[t]}
              </span>
              <span className="mt-1 block text-sm font-semibold text-gray-900">{LABEL_TUJUAN[t]}</span>
              <span className="mt-1 block text-xs text-gray-600">{DESKRIPSI_TUJUAN[t]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-gray-200 bg-white p-4 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">2. Bahasa tulisan</h2>
          <div className="mt-2 flex gap-2">
            {(['id', 'en'] as BahasaKonten[]).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBahasa(b)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  bahasa === b ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-600'
                }`}
              >
                {b === 'id' ? 'Indonesia' : 'English'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">3. Studi yang dimasukkan</h2>
          <div className="mt-2 space-y-1.5">
            {opsiCakupan.map((c) => (
              <label key={c.nilai} className={`flex items-center gap-2 text-sm ${c.jumlah === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                <input
                  type="radio"
                  name="cakupan"
                  checked={cakupan === c.nilai}
                  disabled={c.jumlah === 0}
                  onChange={() => setCakupan(c.nilai)}
                  className="accent-indigo-600"
                />
                {c.label} <span className="text-xs text-gray-400">({c.jumlah})</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              Maks. studi
              <input
                type="number"
                min={1}
                max={500}
                value={maksStudi}
                onChange={(e) => setMaksStudi(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                className="w-20 rounded border border-gray-300 px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sertakanAbstrak}
                onChange={(e) => setSertakanAbstrak(e.target.checked)}
                className="accent-indigo-600"
              />
              Sertakan abstrak
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => downloadBlob(namaFile(project.nama, tujuan), new Blob([paket.markdown], { type: 'text/markdown;charset=utf-8' }))}>
            Unduh Paket (.md)
          </Button>
          <Button type="button" variant="secondary" onClick={salin}>
            {tersalin ? '✓ Tersalin' : 'Salin ke clipboard'}
          </Button>
          <span className="text-xs text-gray-500">
            {paket.jumlahStudi} studi · ±{token.toLocaleString('id-ID')} token
          </span>
        </div>
        {token > BATAS_NYAMAN_TOKEN && (
          <p className="text-xs text-amber-700">
            Paket cukup besar. Kurangi “Maks. studi” atau matikan abstrak bila asisten AI Anda kesulitan memproses semuanya.
          </p>
        )}
        <div className="rounded-md border border-indigo-100 bg-indigo-50/60 p-3 text-sm text-indigo-900">
          <strong>Cara pakai:</strong> buka Claude (atau asisten AI lain), unggah file .md ini atau tempel isinya, lalu tulis:{' '}
          <em>“Ikuti instruksi di Bagian 1.”</em> Periksa kembali setiap angka dan rujukan [n] sebelum dipublikasikan.
        </div>
        <details className="rounded-md border border-gray-200 bg-white">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-700">Pratinjau isi paket</summary>
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words border-t border-gray-100 p-3 font-mono text-xs text-gray-800">
            {paket.markdown}
          </pre>
        </details>
      </section>
    </div>
  );
}
