/**
 * Nonce generation and retrieval utilities
 * Provides cryptographically secure nonce generation and isomorphic nonce access
 */

import { createIsomorphicFn } from "@tanstack/react-start";
import { getStartContext } from "@tanstack/start-storage-context";

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
 * Create isomorphic function to get nonce on both server and client
 *
 * Server: Retrieves from TanStack Start global middleware context
 * Client: Retrieves from meta tag (auto-created by TanStack Start)
 *
 * @returns Function that retrieves nonce from appropriate context
 *
 * @example
 * ```typescript
 * import { createRouter } from '@tanstack/react-router';
 * import { createNonceGetter } from '@enalmada/start-secure';
 *
 * const getNonce = createNonceGetter();
 *
 * const router = createRouter({
 *   // ... other options
 *   ssr: {
 *     nonce: getNonce()  // Applies nonce to all <Scripts> and <ScriptOnce>
 *   }
 * });
 * ```
 */
export function createNonceGetter() {
	return createIsomorphicFn()
		.server(() => {
			const context = getStartContext();
			return context.contextAfterGlobalMiddlewares?.nonce;
		})
		.client(() => {
			const meta = document.querySelector("meta[property='csp-nonce']");
			return meta?.getAttribute("content") ?? undefined;
		});
}
