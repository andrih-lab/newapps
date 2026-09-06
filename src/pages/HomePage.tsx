import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Telaah</h1>
      <p className="mt-3 text-gray-600">
        Bantu proses identifikasi, skrining, dan pelaporan Systematic Literature Review, sekaligus
        analisis bibliometrik dari korpus yang sama. Semua pemrosesan berjalan di peramban Anda —
        tanpa model bahasa, dan file tidak pernah meninggalkan komputer Anda.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/proyek"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Mulai / Lihat Proyek
        </Link>
        <Link
          to="/metodologi"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Metodologi
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Akuisisi Data</h2>
          <p className="mt-1 text-xs text-gray-500">
            Unggah BibTeX/RIS/CSV Scopus/CSV WoS, atau cari langsung di OpenAlex.
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Deduplikasi</h2>
          <p className="mt-1 text-xs text-gray-500">
            DOI lebih dulu, lalu kemiripan judul Jaro-Winkler dengan tinjauan manual.
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900">Bibliometrik</h2>
          <p className="mt-1 text-xs text-gray-500">
            Produksi tahunan, Lotka, Bradford, jaringan co-word & co-authorship.
          </p>
        </div>
      </div>
    </div>
  );
}
