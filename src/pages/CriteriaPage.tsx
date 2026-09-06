import { useEffect, useState, type FormEvent } from 'react';
import { useProjectContext } from '../hooks/useProjectContext';
import { addCriterion, deleteCriterion, listCriteria, updateCriterion } from '../db/repositories/criterionRepo';
import type { Criterion, TipeKriteria } from '../types/record';
import { Button } from '../components/common/Button';

function CriterionForm({
  tipe,
  onAdd,
}: {
  tipe: TipeKriteria;
  onAdd: (label: string, deskripsi: string) => Promise<void>;
}) {
  const [label, setLabel] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim() || busy) return;
    setBusy(true);
    try {
      await onAdd(label.trim(), deskripsi.trim());
      setLabel('');
      setDeskripsi('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 rounded-md border border-dashed border-gray-300 p-3">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={tipe === 'inklusi' ? 'mis. Studi empiris pendidikan tinggi' : 'mis. Bukan bahasa Inggris/Indonesia'}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        required
      />
      <textarea
        value={deskripsi}
        onChange={(e) => setDeskripsi(e.target.value)}
        placeholder="Deskripsi/penjelasan singkat (opsional)"
        rows={2}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <Button type="submit" variant="secondary" disabled={busy}>
        + Tambah {tipe === 'inklusi' ? 'Kriteria Inklusi' : 'Kriteria Eksklusi'}
      </Button>
    </form>
  );
}

function CriterionList({
  items,
  onEdit,
  onDelete,
}: {
  items: Criterion[];
  onEdit: (id: string, label: string, deskripsi: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [deskripsi, setDeskripsi] = useState('');

  function startEdit(c: Criterion) {
    setEditingId(c.id);
    setLabel(c.label);
    setDeskripsi(c.deskripsi);
  }

  async function saveEdit() {
    if (!editingId) return;
    await onEdit(editingId, label.trim(), deskripsi.trim());
    setEditingId(null);
  }

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Belum ada kriteria.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((c) => (
        <li key={c.id} className="rounded-md border border-gray-200 bg-white p-3 text-sm">
          {editingId === c.id ? (
            <div className="space-y-2">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              />
              <textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={saveEdit}>
                  Simpan
                </Button>
                <Button variant="ghost" onClick={() => setEditingId(null)}>
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-gray-900">{c.label}</div>
                {c.deskripsi && <div className="mt-0.5 text-gray-500">{c.deskripsi}</div>}
              </div>
              <div className="flex shrink-0 gap-1 text-xs">
                <button onClick={() => startEdit(c)} className="rounded border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50">
                  Ubah
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  className="rounded border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50"
                >
                  Hapus
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function CriteriaPage() {
  const { project } = useProjectContext();
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  async function refresh() {
    setCriteria(await listCriteria(project.id));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const inklusi = criteria.filter((c) => c.tipe === 'inklusi');
  const eksklusi = criteria.filter((c) => c.tipe === 'eksklusi');

  async function handleAdd(tipe: TipeKriteria, label: string, deskripsi: string) {
    await addCriterion(project.id, tipe, label, deskripsi);
    await refresh();
  }

  async function handleEdit(id: string, label: string, deskripsi: string) {
    await updateCriterion(id, label, deskripsi);
    await refresh();
  }

  async function handleDelete(id: string) {
    await deleteCriterion(id);
    await refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Kriteria Inklusi & Eksklusi</h2>
        <p className="mt-1 text-sm text-gray-600">
          Label eksklusi di bawah akan muncul sebagai pilihan satu-klik saat Anda menolak artikel di halaman
          Skrining. Pertanyaan penelitian proyek ini juga dipakai untuk menyusun urutan awal artikel skrining
          (kemiripan judul/abstrak terhadap pertanyaan &amp; kriteria inklusi).
        </p>
      </div>

      <section>
        <h3 className="text-base font-semibold text-gray-900">Kriteria Inklusi</h3>
        <div className="mt-2">
          <CriterionList items={inklusi} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
        <CriterionForm tipe="inklusi" onAdd={(label, deskripsi) => handleAdd('inklusi', label, deskripsi)} />
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-900">Kriteria Eksklusi</h3>
        <div className="mt-2">
          <CriterionList items={eksklusi} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
        <CriterionForm tipe="eksklusi" onAdd={(label, deskripsi) => handleAdd('eksklusi', label, deskripsi)} />
      </section>
    </div>
  );
}
