import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjectContext } from '../hooks/useProjectContext';
import { getProject, updateSearchStrategy } from '../db/repositories/projectRepo';
import type { KandidatTersimpan, StrategiPencarian } from '../types/keywords';
import { Button } from '../components/common/Button';
import { BlockCard } from '../components/keywords/BlockCard';
import { CandidatePool } from '../components/keywords/CandidatePool';
import { QueryOutputs } from '../components/keywords/QueryOutputs';
import { RecallTest } from '../components/keywords/RecallTest';
import { AiSettings } from '../components/keywords/AiSettings';
import { bacaPengaturanAi, type PengaturanAi } from '../keywords/ai';
import { jalankanOtomatis } from '../keywords/autoBuild';
import { susunSemuaString, susunStringOpenAlex } from '../keywords/buildQueries';
import { dengarKuota, hitungHasil, kuotaSaatIni, ujiRecall, type KuotaOpenAlex } from '../keywords/openalexApi';
import { kunciStem } from '../keywords/text';
import {
  blokDariTopik,
  hapusBlok,
  hapusIstilah,
  perbaruiBlok,
  perbaruiIstilah,
  pindahIstilah,
  strategiKosong,
  tambahBlok,
  tambahIstilah,
  tambahIstilahIndonesia,
} from '../keywords/strategyOps';

const BIAYA_PENCARIAN_USD = 0.001;

function Langkah({ nomor, judul, children, aksi }: { nomor: number; judul: string; children: React.ReactNode; aksi?: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            {nomor}
          </span>
          {judul}
        </h2>
        {aksi}
      </div>
      {children}
    </section>
  );
}

function KuotaBadge({ kuota }: { kuota: KuotaOpenAlex | null }) {
  if (!kuota) return null;
  const sisaPencarian = Math.floor(kuota.sisaUsd / BIAYA_PENCARIAN_USD);
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs ${sisaPencarian < 15 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}
      title="Kuota harian OpenAlex (reset tiap ±24 jam). Isi VITE_OPENALEX_API_KEY di .env untuk kuota lebih besar."
    >
      Kuota OpenAlex hari ini: ±{sisaPencarian} pencarian lagi
    </span>
  );
}

export function KeywordBuilderPage() {
  const { project } = useProjectContext();
  const navigate = useNavigate();
  const [s, setS] = useState<StrategiPencarian | null>(null);
  const [ai, setAi] = useState<PengaturanAi | null>(() => bacaPengaturanAi());
  const [opsi, setOpsi] = useState({ agrovoc: true, tambang: true, ai: false });
  const [proses, setProses] = useState<string | null>(null);
  const [peringatan, setPeringatan] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyTotal, setBusyTotal] = useState(false);
  const [busyRecall, setBusyRecall] = useState(false);
  const [kuota, setKuota] = useState<KuotaOpenAlex | null>(() => kuotaSaatIni());
  const abortRef = useRef<AbortController | null>(null);
  const dimuat = useRef(false);

  useEffect(() => dengarKuota(setKuota), []);

  useEffect(() => {
    dimuat.current = false;
    getProject(project.id).then((p) => {
      setS(p?.strategiPencarian ?? strategiKosong(project.pertanyaanPenelitian));
    });
  }, [project.id, project.pertanyaanPenelitian]);

  // Simpan otomatis (debounce) setiap strategi berubah — kecuali saat pertama dimuat.
  useEffect(() => {
    if (!s) return;
    if (!dimuat.current) {
      dimuat.current = true;
      return;
    }
    const t = setTimeout(() => updateSearchStrategy(project.id, s), 400);
    return () => clearTimeout(t);
  }, [s, project.id]);

  const strings = useMemo(() => (s ? susunSemuaString(s.blok) : []), [s]);
  const stringOpenAlex = useMemo(() => (s ? susunStringOpenAlex(s.blok) : ''), [s]);

  if (!s) return <p className="text-sm text-gray-500">Memuat…</p>;
  const strategi = s;

  const belumDihitung = strategi.blok.flatMap((b) => b.istilah.filter((i) => i.hits === undefined && i.dipilih));

  function ubah(f: (x: StrategiPencarian) => StrategiPencarian) {
    setS((prev) => (prev ? f(prev) : prev));
  }

  async function jalankan<T>(tugas: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> {
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      return await tugas(controller.signal);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : String(err));
      }
      return undefined;
    } finally {
      abortRef.current = null;
      setProses(null);
    }
  }

  async function buatOtomatis() {
    if (!strategi.topik.trim()) {
      setError('Tulis topik penelitian dulu.');
      return;
    }
    setPeringatan([]);
    setProses('Memecah topik menjadi konsep…');
    const hasil = await jalankan((signal) =>
      jalankanOtomatis(
        strategi,
        { pakaiAgrovoc: opsi.agrovoc, pakaiTambang: opsi.tambang, ai: opsi.ai ? ai : null },
        setProses,
        signal,
      ),
    );
    if (hasil) {
      setS(hasil.strategi);
      setPeringatan(hasil.peringatan);
    }
  }

  function mulaiUlang() {
    if (strategi.blok.length > 0 && !window.confirm('Hapus semua konsep dan istilah, lalu susun ulang dari topik?')) return;
    ubah((x) => ({ ...strategiKosong(x.topik), paperKunci: x.paperKunci, blok: blokDariTopik(x.topik) }));
    setPeringatan([]);
  }

  async function hitungHits() {
    const n = belumDihitung.length;
    if (n === 0) return;
    const biaya = (n * BIAYA_PENCARIAN_USD).toFixed(3);
    if (n > 5 && !window.confirm(`Menghitung hit untuk ${n} istilah memakai ${n} pencarian OpenAlex (±$${biaya} dari kuota harian). Lanjutkan?`)) {
      return;
    }
    await jalankan(async (signal) => {
      let selesai = 0;
      for (const b of strategi.blok) {
        for (const i of b.istilah) {
          if (i.hits !== undefined || !i.dipilih) continue;
          setProses(`Menghitung hit ${++selesai}/${n}: ${i.teks}`);
          const hits = await hitungHasil(i.teks.includes(' ') || i.teks.includes('-') ? `"${i.teks.replace(/\*/g, '')}"` : i.teks, signal);
          ubah((x) => perbaruiIstilah(x, b.id, i.id, { hits }));
        }
      }
    });
  }

  async function hitungTotal() {
    setBusyTotal(true);
    setProses(null);
    const nilai = await jalankan((signal) => hitungHasil(stringOpenAlex, signal));
    setBusyTotal(false);
    if (nilai !== undefined) {
      ubah((x) => ({ ...x, totalHasilOpenAlex: { nilai, tanggal: new Date().toISOString(), stringQuery: stringOpenAlex } }));
    }
  }

  async function ujiPaperKunci(dois: string[]) {
    ubah((x) => ({ ...x, paperKunci: dois }));
    if (dois.length === 0 || !stringOpenAlex) return;
    setBusyRecall(true);
    const hasil = await jalankan((signal) => ujiRecall(stringOpenAlex, dois, signal));
    setBusyRecall(false);
    if (hasil) {
      ubah((x) => ({
        ...x,
        ujiRecall: {
          ...hasil,
          tanggal: new Date().toISOString(),
          stringDiuji: stringOpenAlex,
          totalDoi: hasil.ditemukan.length + hasil.tidakTerindeks.length + hasil.terlewat.length,
        },
      }));
    }
  }

  function tambahKandidat(k: KandidatTersimpan, blokId: string) {
    ubah((x) => ({
      ...tambahIstilah(x, blokId, [
        { teks: k.teks, sumber: 'openalex', dipilih: true, keterangan: `muncul di ${k.df} dari ${x.jumlahSampelTambang ?? '?'} artikel (${k.asal})` },
      ]),
      kandidat: (x.kandidat ?? []).filter((c) => c.teks !== k.teks),
    }));
  }

  function abaikanKandidat(k: KandidatTersimpan) {
    ubah((x) => ({ ...x, kandidat: (x.kandidat ?? []).filter((c) => c.teks !== k.teks) }));
  }

  function tambahDariPaperKunci(teks: string, blokId: string) {
    ubah((x) => tambahIstilah(x, blokId, [{ teks, sumber: 'paper-kunci', dipilih: true, keterangan: 'kata kunci paper kunci yang terlewat' }]));
  }

  const adaBlok = strategi.blok.length > 0;
  const kandidat = (strategi.kandidat ?? []).filter(
    (k) => !strategi.blok.some((b) => b.istilah.some((i) => kunciStem(i.teks) === kunciStem(k.teks))),
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-gray-600">
          Susun kata kunci pencarian dari topik, dengan satu klik. Setiap istilah punya asal yang jelas (tesaurus,
          literatur, varian ejaan) sehingga bisa dipertanggungjawabkan di Bab Metode.
        </p>
        <KuotaBadge kuota={kuota} />
      </div>

      <Langkah nomor={1} judul="Topik">
        <div className="space-y-3 rounded-md border border-gray-200 bg-white p-4">
          <textarea
            value={strategi.topik}
            onChange={(e) => ubah((x) => ({ ...x, topik: e.target.value }))}
            rows={2}
            placeholder="mis. local ecological knowledge of mangroves in Southeast Asia"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-500">
            Tulis dalam bahasa Inggris untuk hasil terbaik. Kata penghubung (of, in, on, and) dipakai untuk memecah topik
            menjadi konsep.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={opsi.agrovoc} onChange={(e) => setOpsi({ ...opsi, agrovoc: e.target.checked })} className="accent-indigo-600" />
              Sinonim tesaurus AGROVOC <span className="text-xs text-gray-400">(gratis)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={opsi.tambang} onChange={(e) => setOpsi({ ...opsi, tambang: e.target.checked })} className="accent-indigo-600" />
              Istilah dari literatur OpenAlex <span className="text-xs text-gray-400">(1–2 pencarian)</span>
            </label>
            <label className={`flex items-center gap-2 ${ai ? '' : 'text-gray-400'}`} title={ai ? '' : 'Atur kunci API di bagian bawah halaman'}>
              <input
                type="checkbox"
                checked={opsi.ai && !!ai}
                disabled={!ai}
                onChange={(e) => setOpsi({ ...opsi, ai: e.target.checked })}
                className="accent-indigo-600"
              />
              Saran AI (Gemini)
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={buatOtomatis} disabled={!!proses}>
              {adaBlok ? 'Perluas lagi secara otomatis' : 'Buat Kata Kunci Otomatis'}
            </Button>
            {adaBlok && (
              <Button type="button" variant="secondary" onClick={mulaiUlang} disabled={!!proses}>
                Susun ulang dari topik
              </Button>
            )}
            {proses && (
              <>
                <span className="text-sm text-gray-600">{proses}</span>
                <Button type="button" variant="ghost" onClick={() => abortRef.current?.abort()}>
                  Batalkan
                </Button>
              </>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {peringatan.length > 0 && (
            <ul className="list-disc pl-5 text-xs text-amber-700">
              {peringatan.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      </Langkah>

      {adaBlok && (
        <Langkah
          nomor={2}
          judul="Periksa istilah"
          aksi={
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={hitungHits} disabled={!!proses || belumDihitung.length === 0}>
                Hitung hit{belumDihitung.length > 0 ? ` (${belumDihitung.length} istilah)` : ''}
              </Button>
              <Button type="button" variant="secondary" onClick={() => ubah((x) => tambahBlok(x, `Konsep ${x.blok.length + 1}`))}>
                + Konsep
              </Button>
            </div>
          }
        >
          <p className="text-sm text-gray-600">
            Istilah dalam satu kotak digabung dengan <strong>OR</strong>, antar-kotak dengan <strong>AND</strong>. Hilangkan
            centang istilah yang tidak cocok. Arahkan kursor ke istilah untuk melihat asalnya.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {strategi.blok.map((b, idx) => (
              <BlockCard
                key={b.id}
                blok={b}
                nomor={idx + 1}
                semuaBlok={strategi.blok}
                onUbahNama={(nama) => ubah((x) => perbaruiBlok(x, b.id, { nama }))}
                onHapusBlok={() => ubah((x) => hapusBlok(x, b.id))}
                onToggle={(id, dipilih) => ubah((x) => perbaruiIstilah(x, b.id, id, { dipilih }))}
                onHapusIstilah={(id) => ubah((x) => hapusIstilah(x, b.id, id))}
                onPindah={(id, ke) => ubah((x) => pindahIstilah(x, b.id, ke, id))}
                onTambahIstilah={(teks) => ubah((x) => tambahIstilah(x, b.id, [{ teks, sumber: 'manual', dipilih: true }]))}
                onTambahIndonesia={(daftar) => ubah((x) => tambahIstilahIndonesia(x, b.id, daftar))}
                onHapusIndonesia={(t) =>
                  ubah((x) => perbaruiBlok(x, b.id, { istilahIndonesia: b.istilahIndonesia.filter((y) => y !== t) }))
                }
              />
            ))}
          </div>
          <CandidatePool
            kandidat={kandidat}
            jumlahSampel={strategi.jumlahSampelTambang}
            blok={strategi.blok}
            onTambah={tambahKandidat}
            onAbaikan={abaikanKandidat}
          />
        </Langkah>
      )}

      {adaBlok && (
        <Langkah nomor={3} judul="Salin string pencarian">
          <QueryOutputs
            strings={strings}
            totalOpenAlex={strategi.totalHasilOpenAlex}
            busyHitung={busyTotal}
            onHitungTotal={hitungTotal}
            onPakaiDiImpor={(query) => navigate('../impor', { state: { openAlexQuery: query } })}
          />
          <div className="rounded-md border border-indigo-100 bg-indigo-50/60 p-3 text-sm text-indigo-900">
            <strong>Berikutnya:</strong> jalankan string di Scopus/Web of Science, ekspor hasilnya (CSV/BibTeX{' '}
            <em>dengan abstrak</em>), lalu unggah di{' '}
            <Link to="../impor" className="font-medium underline">
              Impor Data
            </Link>
            . Atau klik <em>Cari &amp; Impor</em> untuk mengambil langsung dari OpenAlex.
          </div>
        </Langkah>
      )}

      {adaBlok && (
        <Langkah nomor={4} judul="Uji dengan paper kunci (disarankan)">
          <RecallTest
            paperKunci={strategi.paperKunci}
            hasil={strategi.ujiRecall}
            stringSaatIni={stringOpenAlex}
            blok={strategi.blok}
            busy={busyRecall}
            onUbahPaperKunci={(dois) => ubah((x) => ({ ...x, paperKunci: dois }))}
            onUji={ujiPaperKunci}
            onTambahIstilah={tambahDariPaperKunci}
          />
        </Langkah>
      )}

      <AiSettings
        pengaturan={ai}
        onUbah={(p) => {
          setAi(p);
          if (!p) setOpsi((o) => ({ ...o, ai: false }));
        }}
      />
    </div>
  );
}
