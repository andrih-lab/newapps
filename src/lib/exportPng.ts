import { downloadBlob } from './exportCsv';

function serializeSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!clone.getAttribute('width') || !clone.getAttribute('height')) {
    const bbox = svg.getBoundingClientRect();
    clone.setAttribute('width', String(bbox.width));
    clone.setAttribute('height', String(bbox.height));
  }
  return new XMLSerializer().serializeToString(clone);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuat SVG sebagai gambar'));
    img.src = url;
  });
}

/** Unduh elemen <svg> sebagai file .svg. */
export function downloadSvg(filename: string, svg: SVGSVGElement): void {
  const source = serializeSvg(svg);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(filename, blob);
}

export interface RasterizedSvg {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Render elemen <svg> ke <canvas> (skala 2x agar tajam secara bawaan).
 * Dipakai bersama oleh downloadPng (lib ini) dan downloadSvgAsPdf (lib/exportPdf.ts)
 * agar logika rasterisasi tidak diduplikasi.
 */
export async function rasterizeSvg(svg: SVGSVGElement, scale = 2): Promise<RasterizedSvg> {
  const bbox = svg.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(bbox.width));
  const height = Math.max(1, Math.ceil(bbox.height));

  const source = serializeSvg(svg);
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Kanvas 2D tidak didukung di browser ini');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    return { canvas, dataUrl: canvas.toDataURL('image/png'), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Render elemen <svg> ke kanvas lalu unduh sebagai PNG. */
export async function downloadPng(filename: string, svg: SVGSVGElement, scale = 2): Promise<void> {
  const { canvas } = await rasterizeSvg(svg, scale);
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Gagal membuat PNG dari kanvas');
  downloadBlob(filename, blob);
}
