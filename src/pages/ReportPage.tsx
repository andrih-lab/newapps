import { useEffect, useState } from 'react';
import { useProjectContext } from '../hooks/useProjectContext';
import { gatherReportData, type ReportData } from '../report/gatherReportData';
import { generateReportDocx } from '../report/generateDocx';
import { downloadBlob } from '../lib/exportCsv';
import { Button } from '../components/common/Button';

export function ReportPage() {
  const { project } = useProjectContext();
  const [data, setData] = useState<ReportData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    gatherReportData(project.id).then(setData);
  }, [project.id]);

  async function handleGenerate() {
    if (!data) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await generateReportDocx(data);
      const safeName = project.nama.trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'proyek';
      downloadBlob(`draf-metode-hasil-${safeName}.docx`, blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat dokumen.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border-2 border-amber-300 bg-amber-50 p-4">
        <h2 className="text-sm font-semibold text-amber-900">Yang TIDAK dibuat aplikasi ini</h2>
        <p className="mt-1 text-sm text-amber-800">
          Dokumen yang dihasilkan hanya memuat draf <strong>Bab Metode</strong> dan <strong>Bab Hasil</strong>{' '}
          deskriptif, disusun deterministik dari data yang sudah Anda catat di aplikasi — tanpa model bahasa
          apa pun. Bab <strong>Pendahuluan</strong>, <strong>Diskusi</strong>, dan <strong>Kesimpulan</strong>{' '}
          sengaja <strong>tidak</strong> dibuat otomatis: bagian-bagian itu adalah kontribusi intelektual Anda
          sebagai penulis, dan pembuatan otomatis untuk bagian itu berisiko menimbulkan fabrikasi. Tinjau dan
          sunting draf ini sebelum digunakan.
        </p>
      </div>

      <section className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="text-base font-semibold text-gray-900">Draf Bab Metode &amp; Hasil</h2>
        {!data ? (
          <p className="mt-2 text-sm text-gray-500">Memuat data proyek...</p>
        ) : (
          <>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>Pencarian basis data tercatat: {data.searchQueries.length}</li>
              <li>Kriteria inklusi/eksklusi: {data.criteria.length}</li>
              <li>
                Hasil seleksi: {data.prisma.identifikasi.total} diidentifikasi → {data.prisma.disaring} disaring →{' '}
                {data.prisma.disertakan} disertakan
              </li>
              <li>Studi dengan matriks ekstraksi terisi: {data.extractionByRecordId.size}</li>
            </ul>
            <div className="mt-4">
              <Button onClick={handleGenerate} disabled={busy}>
                {busy ? 'Membuat dokumen...' : 'Buat & Unduh Draf (.docx)'}
              </Button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </>
        )}
      </section>
    </div>
  );
}
