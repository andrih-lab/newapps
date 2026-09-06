import { jsPDF } from 'jspdf';
import { rasterizeSvg } from './exportPng';

/** Ubah elemen <svg> menjadi satu halaman PDF berisi gambar raster (dipakai untuk diagram PRISMA, Bagian 4 Modul 6). */
export async function downloadSvgAsPdf(filename: string, svg: SVGSVGElement, scale = 2): Promise<void> {
  const { dataUrl, width, height } = await rasterizeSvg(svg, scale);
  const orientation = width >= height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'px', format: [width, height] });
  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
  pdf.save(filename);
}
