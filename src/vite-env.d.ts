/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENALEX_API_KEY?: string;
  readonly VITE_OPENALEX_MAILTO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Import Vite bergaya `?url` (dipakai untuk memuat worker pdf.js sebagai URL aset). */
declare module '*?url' {
  const src: string;
  export default src;
}
