/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_ENDPOINT?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_API_KEY?: string;
  readonly PUBLIC_API_URL?: string;
  readonly PUBLIC_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.yaml?raw' {
  const content: string;
  export default content;
}
