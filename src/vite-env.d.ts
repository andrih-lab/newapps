/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENALEX_API_KEY?: string;
  readonly VITE_OPENALEX_MAILTO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
