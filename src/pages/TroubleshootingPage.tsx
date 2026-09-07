import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FAQ_ITEMS, FAQ_CATEGORIES } from '../guide/troubleshootingData';
import { AccordionItem } from '../components/common/AccordionItem';

export function TroubleshootingPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_ITEMS;
    return FAQ_ITEMS.filter(
      (item) =>
        item.pertanyaan.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.jawaban.some((p) => p.toLowerCase().includes(q)),
    );
  }, [query]);

  const kategoriTerlihat = query.trim() ? Array.from(new Set(filtered.map((i) => i.kategori))) : FAQ_CATEGORIES;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/panduan" className="text-sm text-indigo-600 underline">
          ← Kembali ke Panduan
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">Troubleshooting</h1>
        <p className="mt-2 text-sm text-gray-600">
          Kumpulan masalah yang paling sering ditemui dan cara mengatasinya sendiri. Ketik kata kunci di bawah
          untuk mencari — misalnya "data hilang", "PDF", atau "cadangan".
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari masalah Anda..."
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        autoFocus
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">
          Tidak ditemukan hasil untuk "{query}". Coba kata kunci lain, atau lihat semua topik dengan mengosongkan
          kotak pencarian.
        </p>
      ) : (
        <div className="space-y-6">
          {kategoriTerlihat.map((kategori) => {
            const items = filtered.filter((i) => i.kategori === kategori);
            if (items.length === 0) return null;
            return (
              <section key={kategori} className="rounded-md border border-gray-200 bg-white p-4">
                <h2 className="mb-1 text-sm font-semibold text-gray-900">{kategori}</h2>
                <div>
                  {items.map((item) => (
                    <AccordionItem key={item.id} question={item.pertanyaan} defaultOpen={filtered.length <= 3}>
                      {item.jawaban.map((paragraf, i) => (
                        <p key={i}>{paragraf}</p>
                      ))}
                    </AccordionItem>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        Tidak menemukan jawaban di sini? Data proyek Anda tersimpan sepenuhnya di browser Anda sendiri, jadi
        selalu unduh <strong>Cadangan (JSON)</strong> dari halaman Ekspor sebelum mencoba langkah perbaikan yang
        berisiko (mis. membersihkan data situs di browser).
      </div>
    </div>
  );
}
