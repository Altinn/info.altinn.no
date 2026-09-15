/**
 * Stub for the `cloudflare:workers` virtual module, which only exists inside the
 * Workers runtime and therefore cannot resolve under vitest's node environment.
 *
 * Every consumer in src/ reads `env.SOMETHING || <default>`, so an empty env
 * resolves them to their defaults — enough for unit tests that never fetch.
 * Wired up as a vitest alias; see vitest.config.ts.
 */
export const env: Record<string, string | undefined> = {};
