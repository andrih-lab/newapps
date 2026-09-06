import { useRef, useState, type DragEvent } from 'react';

interface Props {
  onFiles: (files: File[]) => void;
  accept?: string;
  disabled?: boolean;
}

export function FileDropzone({ onFiles, accept, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center text-sm transition-colors ${
        dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-white'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-indigo-300'}`}
    >
      <p className="text-gray-600">
        Seret &amp; lepas file di sini, atau <span className="font-medium text-indigo-600">klik untuk memilih</span>
      </p>
      <p className="mt-1 text-xs text-gray-400">Bisa memilih beberapa file sekaligus.</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) onFiles(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
