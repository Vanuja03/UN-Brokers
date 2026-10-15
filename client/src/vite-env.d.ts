/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'aos' {
  interface AosOptions {
    duration?: number;
    easing?: string;
    once?: boolean;
    offset?: number;
    delay?: number;
    disable?: boolean | 'mobile' | 'phone' | 'tablet' | (() => boolean);
  }

  const AOS: {
    init: (options?: AosOptions) => void;
    refresh: () => void;
    refreshHard: () => void;
  };

  export default AOS;
}
