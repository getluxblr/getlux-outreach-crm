import type { GetluxApi } from '../electron/preload';

declare global {
  interface Window {
    getlux: GetluxApi;
  }
}

export {};
