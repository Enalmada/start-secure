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
		// Script sources with nonce and strict-dynamic (CSP Level 3)
		//
		// CSP Level 3 strict-dynamic behavior:
		// - Scripts with valid nonces can load other scripts (trusted chain)
		// - The following directives are IGNORED and cause browser console warnings:
		//   × 'self' - Ignored with 'strict-dynamic' (use nonce-based trust instead)
		//   × 'unsafe-inline' - Ignored when nonce is present
		//   × https: / http: - Ignored with 'strict-dynamic' (overly permissive)
		//   × URL whitelists - Ignored with 'strict-dynamic' (use nonce chain)
		//
		// Development mode: Adds 'unsafe-eval' for source maps and dev tools
		// Production mode: Strict nonce-only execution
		//
		// Why no fallbacks?
		// If you're using 'strict-dynamic', you're targeting CSP Level 3 browsers.
		// Adding fallbacks for older browsers just creates console noise without benefit.
		"script-src": [`'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],
		// Allow <script> elements (tags) - nonce + strict-dynamic only
		// Note: 'unsafe-eval' not included here (only applies to script-src, not script-src-elem)
		"script-src-elem": [`'nonce-${nonce}'`, "'strict-dynamic'"],
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
			const values = typeof value === "string" ? value.split(/\s+/) : value;
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
	const directivesToCopy: [string, string][] = [
		["style-src", "style-src-elem"],
		["script-src", "script-src-elem"],
	];

	for (const [base, granular] of directivesToCopy) {
		if (directives[base] && directives[granular]) {
			for (const source of directives[base]) {
				if (!directives[granular].includes(source)) {
					directives[granular].push(source);
				}
			}
		}
	}

	// Build CSP string
	const cspString = Object.entries(directives)
		.map(([key, values]) => `${key} ${values.join(" ")}`)
		.join("; ");

	return cspString;
}
