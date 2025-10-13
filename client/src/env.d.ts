/// <reference types="astro/client" />
/// <reference types="vite/client" />

declare module "leaflet";
declare module "@turf/turf";

// Extend ImportMetaEnv with our public variables for type-safe access
declare global {
  interface ImportMetaEnv {
    readonly PUBLIC_MAPBOX_ACCESS_TOKEN: string;
    readonly PUBLIC_SERVER_URL?: string;
    readonly PUBLIC_CHATBOT_URL?: string;
    readonly PUBLIC_SHOOTING_API_URL?: string;
    readonly PUBLIC_CENSUS_API_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
