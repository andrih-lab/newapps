import type { ReactNode } from 'react';

function Formula({ children }: { children: ReactNode }) {
  return <pre className="my-2 overflow-x-auto rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-800">{children}</pre>;
}

function Ref({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs text-gray-500">{children}</p>;
}

export function MethodologyPage() {
  return (
    <article className="max-w-3xl space-y-8 text-sm leading-relaxed text-gray-700">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Metodologi</h1>
        <p className="mt-2">
          Halaman ini menjelaskan rumus dan algoritma yang dipakai aplikasi, agar hasilnya dapat
          dipertanggungjawabkan dan dikutip di bagian Metode publikasi Anda. Seluruh perhitungan berjalan
          di peramban (client-side), deterministik, dan tidak memakai model bahasa apa pun.
        </p>
      </div>

      <section>
        <h2 className="text-base font-semibold text-gray-900">Deduplikasi</h2>

        <h3 className="mt-3 font-medium text-gray-900">Tahap 1 — Kecocokan DOI</h3>
        <p className="mt-1">
          DOI dinormalisasi sebelum dibandingkan: diubah ke huruf kecil, prefiks URL/skema
          (<code className="rounded bg-gray-100 px-1">https://doi.org/</code>,{' '}
          <code className="rounded bg-gray-100 px-1">doi:</code>, dsb.) dibuang, dan spasi di ujung
          dirapikan. Dua record dengan DOI ternormalisasi yang sama otomatis ditandai duplikat.
        </p>

        <h3 className="mt-3 font-medium text-gray-900">Tahap 2 — Kemiripan Judul (Jaro-Winkler)</h3>
        <p className="mt-1">Rumus Jaro:</p>
        <Formula>Jaro(s1, s2) = (1/3) * (m/|s1| + m/|s2| + (m - t)/m)</Formula>
        <p>
          dengan <em>m</em> = jumlah karakter yang cocok (matching characters) dan <em>t</em> = jumlah
          transposisi dibagi 2.
        </p>
        <p className="mt-2">Rumus Jaro-Winkler:</p>
        <Formula>JW = Jaro + L * p * (1 - Jaro)</Formula>
        <p>
          dengan <em>L</em> = panjang prefiks yang sama persis (maksimum 4 karakter) dan <em>p</em> =
          konstanta skala prefiks (0,1 — nilai baku Winkler).
        </p>
        <p className="mt-2">
          Dua record dianggap <strong>kandidat</strong> duplikat bila kemiripan judul ≥ 0,90{' '}
          <strong>dan</strong> tahun publikasinya sama <strong>dan</strong> kemiripan nama penulis
          pertama ≥ 0,70. Kandidat tidak digabung otomatis — pengguna meninjau dan memutuskan di halaman
          Deduplikasi.
        </p>
        <Ref>
          Referensi: Winkler, W. E. (1990). "String Comparator Metrics and Enhanced Decision Rules in
          the Fellegi-Sunter Model of Record Linkage."
        </Ref>
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-900">Hukum Lotka</h2>
        <p className="mt-1">
          Mengukur distribusi produktivitas penulis: berapa banyak penulis yang menghasilkan tepat n
          publikasi.
        </p>
        <Formula>A_n = A_1 / n^C</Formula>
        <p>
          dengan A_n = jumlah penulis berpublikasi n kali, A_1 = jumlah penulis berpublikasi sekali, dan
          C = eksponen (nilai teoritis Lotka, 1926: C = 2).
        </p>
        <p className="mt-2">
          Aplikasi juga mengestimasi ulang eksponen C dari data melalui regresi linear atas{' '}
          <code className="rounded bg-gray-100 px-1">log10(n)</code> vs{' '}
          <code className="rounded bg-gray-100 px-1">log10(A_n)</code> (metode Pao, 1985):
        </p>
        <Formula>log(A_n) = log(A_1) - C * log(n)</Formula>
        <Ref>
          Referensi: Lotka, A. J. (1926). "The frequency distribution of scientific productivity." Pao,
          M. L. (1985). "Lotka's law: A testing procedure."
        </Ref>
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-900">Hukum Bradford</h2>
        <p className="mt-1">
          Mengukur zonasi jurnal inti: jurnal diurutkan menurun berdasarkan jumlah artikel, lalu dibagi
          menjadi beberapa zona (bawaan: 3) sedemikian rupa sehingga tiap zona memuat jumlah artikel
          kumulatif yang kurang-lebih sama. Rasio jumlah jurnal antar zona berurutan (multiplier)
          idealnya mendekati konstanta yang sama di setiap batas zona.
        </p>
        <Ref>Referensi: Bradford, S. C. (1934). "Sources of information on specific subjects."</Ref>
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-900">Jaringan Co-occurrence</h2>
        <p className="mt-1">
          Dipakai untuk jaringan co-word kata kunci dan co-authorship penulis/negara. Dua item (kata
          kunci, penulis, atau negara) dihubungkan sebuah edge bila keduanya muncul bersama pada record
          yang sama; bobot edge = jumlah record tempat keduanya muncul bersama. Ukuran node sebanding
          dengan frekuensi kemunculan item tersebut di seluruh korpus. Untuk keterbacaan, graf dibatasi
          ke 50 item terfrekuensi.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-900">Verifikasi</h2>
        <p className="mt-1">
          Keluaran Hukum Lotka dan Bradford wajib dibandingkan dengan Bibliometrix/Biblioshiny memakai
          dataset yang sama sebelum aplikasi dirilis ke pengguna produksi.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-900">Pencarian OpenAlex</h2>
        <p className="mt-1">
          Pencarian dipanggil langsung dari peramban ke{' '}
          <code className="rounded bg-gray-100 px-1">api.openalex.org</code> (tanpa proxy pada tahap
          ini). Abstrak OpenAlex disimpan sebagai inverted index dan direkonstruksi menjadi teks biasa
          dengan mengurutkan kata berdasarkan posisinya.
        </p>
        <Ref>
          Catatan: ketentuan API key OpenAlex berubah pada awal 2026. Periksa status terbaru di{' '}
          <a href="https://docs.openalex.org" target="_blank" rel="noreferrer" className="text-indigo-600 underline">
            docs.openalex.org
          </a>{' '}
          sebelum rilis produksi.
        </Ref>
      </section>
    </article>
  );
}
