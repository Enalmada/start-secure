/**
 * Default security headers and CSP directives
 * Provides secure defaults following security best practices
 */

import type { SecurityHeadersConfig } from "./types";

/**
 * Validates a nonce value for CSP
 * @param nonce - The nonce to validate
 * @returns true if valid, false otherwise
 */
export function validateNonce(nonce: string): boolean {
	let isValid = true;

	// Minimum 128 bits (16 bytes) encoded in base64 = 24 characters minimum
	// Recommended: 256 bits (32 bytes) = 44 characters
	if (nonce.length < 24) {
		// biome-ignore lint/suspicious/noConsole: Security warnings are intentional
		console.warn(
			`[@enalmada/start-secure] Nonce is too short (${nonce.length} chars). Minimum 24 characters (128 bits) recommended for security.`,
		);
		isValid = false;
	}

	// Check for base64-like pattern (letters, numbers, +, /, =)
	if (!/^[A-Za-z0-9+/]+=*$/.test(nonce)) {
		// biome-ignore lint/suspicious/noConsole: Security warnings are intentional
		console.warn(
			`[@enalmada/start-secure] Nonce should be base64-encoded random bytes. Got: ${nonce.substring(0, 20)}...`,
		);
		isValid = false;
	}

	return isValid;
}

/**
 * Default security headers (strict by default)
 */
export const defaultSecurityHeadersConfig: Required<Omit<SecurityHeadersConfig, "X-Powered-By">> = {
	// Prevent clickjacking
	"X-Frame-Options": "DENY",
	// Prevent MIME-sniffing
	"X-Content-Type-Options": "nosniff",
	// Control referrer information
	"Referrer-Policy": "strict-origin-when-cross-origin",
	// Legacy XSS protection
	"X-XSS-Protection": "1; mode=block",
	// Force HTTPS (with preload for HSTS preload list)
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
	// Control browser features and block privacy-invasive APIs
	"Permissions-Policy":
		"accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()",
};

/**
 * Default CSP directives factory
 * Returns base directives with environment-specific adjustments
 */
export function getDefaultCspDirectives(isDev: boolean, nonce?: string): Record<string, string[]> {
	// Validate nonce if provided
	if (nonce && !validateNonce(nonce)) {
		// biome-ignore lint/suspicious/noConsole: Security warnings are intentional
		console.warn(
			"[@enalmada/start-secure] Invalid nonce detected. See warnings above. " +
				"Nonces should be cryptographically random, at least 128 bits, and generated per-request.",
		);
	}

	return {
		"default-src": ["'self'"],
		"base-uri": ["'self'"],
		"child-src": ["'none'"],
		"connect-src": isDev ? ["'self'", "ws://localhost:*", "wss://localhost:*"] : ["'self'"],
		"font-src": ["'self'"],
		"form-action": ["'self'"],
		"frame-ancestors": ["'none'"],
		"frame-src": ["'none'"],
		"img-src": ["'self'", "blob:", "data:"],
		"manifest-src": ["'self'"],
		"media-src": ["'self'"],
		"object-src": ["'none'"],
		// CSP Level 3: Use nonce + strict-dynamic for scripts
		// Removes redundant 'self' and 'unsafe-inline' to avoid console warnings
		// Fallback to 'unsafe-inline' only if no nonce provided (legacy support)
		"script-src": [
			...(nonce
				? [`'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])]
				: ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])]),
		],
		"style-src": ["'self'", ...(nonce ? [`'nonce-${nonce}'`] : ["'unsafe-inline'"])],
		"worker-src": ["'self'", "blob:"],
	};
}
