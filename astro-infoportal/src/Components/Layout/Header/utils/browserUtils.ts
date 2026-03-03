/**
 * Browser environment detection utility
 * Returns true if code is running in a browser environment (not SSR)
 */
export const isBrowser =
  typeof document !== "undefined" && typeof location !== "undefined";
