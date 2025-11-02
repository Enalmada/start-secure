/**
 * @enalmada/start-secure
 * Security header management for TanStack Start applications
 */

// Deprecated v0.1 API - Handler wrapper (kept for backward compatibility)
export type { StartSecureConfig } from "./handler";
export { createSecureHandler } from "./handler";
export { buildCspHeader } from "./internal/csp-builder";
// Low-level utilities
export {
	defaultSecurityHeadersConfig,
	validateNonce,
} from "./internal/defaults";
export { generateSecurityHeaders } from "./internal/generator";
// Types
export type {
	CspRule,
	SecurityHeaders,
	SecurityHeadersConfig,
	SecurityOptions,
} from "./internal/types";
export type { CspMiddlewareConfig } from "./middleware";
// New v0.2 API - Middleware pattern with per-request nonces
export { createCspMiddleware } from "./middleware";
export { createNonceGetter, generateNonce } from "./nonce";
