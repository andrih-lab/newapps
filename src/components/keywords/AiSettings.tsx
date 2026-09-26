import { useState } from 'react';
import { MODEL_BAWAAN, simpanPengaturanAi, type PengaturanAi } from '../../keywords/ai';
import { Button } from '../common/Button';

interface Props {
  pengaturan: PengaturanAi | null;
  onUbah: (p: PengaturanAi | null) => void;
}

export function AiSettings({ pengaturan, onUbah }: Props) {
  const [apiKey, setApiKey] = useState(pengaturan?.apiKey ?? '');
  const [model, setModel] = useState(pengaturan?.model ?? MODEL_BAWAAN);

  function simpan() {
    const p = apiKey.trim() ? { apiKey: apiKey.trim(), model: model.trim() || MODEL_BAWAAN } : null;
    simpanPengaturanAi(p);
    onUbah(p);
  }

  function hapus() {
    simpanPengaturanAi(null);
    setApiKey('');
    onUbah(null);
  }

  return (
    <details className="rounded-md border border-gray-200 bg-white p-3 text-sm">
      <summary className="cursor-pointer font-medium text-gray-700">
        Pengaturan saran AI (opsional) — {pengaturan ? 'aktif' : 'tidak aktif'}
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-xs text-gray-600">
          AI hanya dipakai untuk <strong>mengusulkan istilah</strong>, tidak pernah menulis teks. Usulan AI masuk tanpa
          tercentang dan ditandai “AI”. Kunci API Gemini Anda disimpan hanya di peramban ini dan dikirim langsung ke
          Google. Jangan aktifkan di komputer bersama.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Kunci API Gemini</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700">Model</span>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 font-mono text-sm"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={simpan}>
            Simpan
          </Button>
          {pengaturan && (
            <Button type="button" variant="secondary" onClick={hapus}>
              Hapus kunci
            </Button>
          )}
        </div>
      </div>
    </details>
  );
}
