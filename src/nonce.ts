/**
 * Nonce generation utilities
 * Provides cryptographically secure nonce generation for CSP middleware
 */

/**
 * Generate cryptographically secure random nonce for CSP
 *
 * Uses crypto.randomUUID() for random bytes and base64 encoding for compact representation.
 * Generates 128-bit nonces (UUID standard) which is sufficient for CSP.
 *
 * @returns Base64-encoded random nonce
 *
 * @example
 * ```typescript
 * const nonce = generateNonce();
 * // Returns something like: "Y2QxMjM0NTY3ODkwMTIzNDU2Nzg="
 * ```
 */
export function generateNonce(): string {
	return Buffer.from(crypto.randomUUID()).toString("base64");
}

/**
 * REMOVED: createNonceGetter() - Had critical AsyncLocalStorage bug
 *
 * The isomorphic wrapper broke AsyncLocalStorage context chain, preventing
 * access to middleware nonce. Use direct context access instead:
 *
 * @example
 * ```typescript
 * import { createRouter } from '@tanstack/react-router';
 *
 * export async function getRouter() {
 *   // Get nonce on server (client uses meta tag automatically)
 *   let nonce: string | undefined;
 *   if (typeof window === 'undefined') {
 *     const { getStartContext } = await import('@tanstack/start-storage-context');
 *     const context = getStartContext();
 *     nonce = context.contextAfterGlobalMiddlewares?.nonce;
 *   }
 *
 *   return createRouter({
 *     // ... other options
 *     ssr: { nonce }  // TanStack Start applies to all framework scripts
 *   });
 * }
 * ```
 *
 * This follows the official TanStack Router pattern:
 * https://github.com/TanStack/router/discussions/3028
 *
 * See docs/MIGRATION-1.0-to-1.0.1.md for migration guide.
 */
