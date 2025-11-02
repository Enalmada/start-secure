/**
 * CSP header building utilities
 * Builds CSP header from rules, nonce, and environment configuration
 */

import type { CspRule } from "./types";

/**
 * Build CSP header value from rules and nonce
 *
 * Merges base directives with user-provided rules, adds nonce to script directives,
 * and copies sources from base directives to granular directives (CSP Level 3 support).
 *
 * @param rules - User-provided CSP rules to merge
 * @param nonce - Cryptographically random nonce for this request
 * @param isDev - Whether in development mode (adds unsafe-eval, WebSocket support)
 * @returns CSP header string
 */
export function buildCspHeader(rules: CspRule[], nonce: string, isDev: boolean): string {
	// Base directives with nonce
	const directives: Record<string, string[]> = {
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
		// Script sources with nonce
		// Note: 'unsafe-inline' is ignored when nonce is present (CSP Level 2+)
		// It's included for backward compatibility with older browsers
		"script-src": [
			"'self'",
			`'nonce-${nonce}'`,
			"'unsafe-inline'",
			"'strict-dynamic'",
			...(isDev ? ["'unsafe-eval'", "https:", "http:"] : []),
		],
		// Allow <script> elements (tags)
		"script-src-elem": [
			"'self'",
			`'nonce-${nonce}'`,
			"'unsafe-inline'",
			"'strict-dynamic'",
			...(isDev ? ["'unsafe-eval'", "https:", "http:"] : []),
		],
		// Inline event handlers (onclick, onload, etc.) - generally avoid these
		// Only add if you need inline event handlers
		// "script-src-attr": ["'unsafe-inline'"],

		// Style sources
		// Note: We use 'unsafe-inline' for styles (not ideal but practical)
		// Frameworks like React, Vite HMR, and CSS-in-JS dynamically inject styles
		// that can't have nonces. Scripts are still protected with nonces (main XSS vector).
		"style-src": ["'self'", "'unsafe-inline'"],
		// Allow <style> elements without nonce requirement
		// This is a pragmatic security trade-off - scripts remain strict
		"style-src-elem": ["'self'", "'unsafe-inline'"],
		// Allow inline style attributes (e.g., <div style="...">)
		"style-src-attr": ["'unsafe-inline'"],
		"worker-src": ["'self'", "blob:"],
	};

	// Merge user-provided CSP rules
	for (const rule of rules) {
		for (const [key, value] of Object.entries(rule)) {
			// Skip metadata fields
			if (key === "description" || key === "source") continue;

			const directive = key as keyof typeof directives;
			if (!directives[directive]) {
				directives[directive] = [];
			}

			// Add values (split if string)
			const values = typeof value === "string" ? value.split(" ") : value;
			for (const v of values) {
				if (v && !directives[directive].includes(v)) {
					directives[directive].push(v);
				}
			}
		}
	}

	// Copy sources from base directives to granular directives
	// When CSP Level 3 browsers see -elem/-attr directives, they ONLY use those
	// So we need to ensure sources from base directives are copied over
	if (directives["style-src"] && directives["style-src-elem"]) {
		for (const source of directives["style-src"]) {
			if (!directives["style-src-elem"].includes(source)) {
				directives["style-src-elem"].push(source);
			}
		}
	}

	if (directives["script-src"] && directives["script-src-elem"]) {
		for (const source of directives["script-src"]) {
			if (!directives["script-src-elem"].includes(source)) {
				directives["script-src-elem"].push(source);
			}
		}
	}

	// Build CSP string
	const cspString = Object.entries(directives)
		.map(([key, values]) => `${key} ${values.join(" ")}`)
		.join("; ");

	return cspString;
}
