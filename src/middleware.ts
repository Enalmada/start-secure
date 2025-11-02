/**
 * TanStack Start CSP middleware
 * Provides per-request nonce generation and security header application
 */

import { createMiddleware } from "@tanstack/react-start";
import { getResponseHeaders, setResponseHeaders } from "@tanstack/react-start/server";
import { generateNonce } from "./nonce";
import { buildCspHeader } from "./internal/csp-builder";
import type { CspRule, SecurityOptions } from "./internal/types";

/**
 * Configuration for CSP middleware
 */
export interface CspMiddlewareConfig {
	/** CSP rules to merge with defaults */
	rules?: CspRule[];

	/** Security options */
	options?: SecurityOptions;

	/** Custom nonce generator (optional, defaults to crypto-random) */
	nonceGenerator?: () => string;

	/** Additional headers to set (optional) */
	additionalHeaders?: Record<string, string>;
}

/**
 * Creates CSP middleware for TanStack Start
 *
 * Generates unique nonce per request, builds CSP header, and sets security headers.
 * The nonce is passed through context to the router for automatic script tag nonce application.
 *
 * @example
 * ```typescript
 * import { createStart } from '@tanstack/react-start';
 * import { createCspMiddleware } from '@enalmada/start-secure';
 * import { cspRules } from './config/cspRules';
 *
 * export const startInstance = createStart(() => ({
 *   requestMiddleware: [
 *     createCspMiddleware({
 *       rules: cspRules,
 *       options: { isDev: process.env.NODE_ENV !== 'production' }
 *     })
 *   ]
 * }));
 * ```
 */
export function createCspMiddleware(config: CspMiddlewareConfig = {}) {
	const { rules = [], options = {}, nonceGenerator = generateNonce, additionalHeaders = {} } = config;

	return createMiddleware().server(({ next }) => {
		const isDev = options.isDev ?? process.env.NODE_ENV !== "production";

		// Generate unique nonce for this request
		const nonce = nonceGenerator();

		// Build CSP header with nonce
		const cspHeader = buildCspHeader(rules, nonce, isDev);

		// Get response headers
		const headers = getResponseHeaders();

		// Set Content Security Policy
		headers.set("Content-Security-Policy", cspHeader);

		// Set other security headers
		headers.set("X-Frame-Options", "DENY");
		headers.set("X-Content-Type-Options", "nosniff");
		headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
		headers.set("X-XSS-Protection", "1; mode=block");

		// HSTS - only in production
		if (!isDev) {
			headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
		}

		// Permissions Policy - restrict privacy-invasive features
		headers.set(
			"Permissions-Policy",
			"accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()",
		);

		// Apply additional custom headers
		for (const [key, value] of Object.entries(additionalHeaders)) {
			headers.set(key, value);
		}

		// Apply headers
		setResponseHeaders(headers);

		// Pass nonce through context for router
		return next({
			context: {
				nonce,
			},
		});
	});
}
