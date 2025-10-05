/**
 * Security header generation utilities
 * Generates CSP and other security headers
 * Handles nonce generation and policy compilation
 */

import { defaultSecurityHeadersConfig, getDefaultCspDirectives } from "./defaults";
import { mergeDirectivesWithDefaults } from "./merger";
import type { CspRule, SecurityHeaders, SecurityOptions } from "./types";

/**
 * Generates complete security headers from CSP rules
 * @param rules - Array of CSP rules to apply
 * @param options - Security configuration options
 * @returns Complete set of security headers
 */
export function generateSecurityHeaders(rules: CspRule[] = [], options: SecurityOptions = {}): SecurityHeaders {
	const { isDev = process.env.NODE_ENV !== "production", nonce, headerConfig } = options;

	// Get default CSP directives with environment-specific adjustments
	const defaultDirectives = getDefaultCspDirectives(isDev, nonce);

	// Merge default directives with user rules (with validation)
	const mergedDirectives = mergeDirectivesWithDefaults(defaultDirectives, rules, isDev);

	// Generate CSP header value from Sets
	const cspValue = Object.entries(mergedDirectives)
		.map(([key, valueSet]) => {
			const values = Array.from(valueSet);
			// Handle boolean directives (empty string in Set) and directives with values
			if (values.length === 0 || (values.length === 1 && values[0] === "")) {
				return key; // Boolean directive or empty - just the directive name
			}
			// Remove empty strings and join
			const filteredValues = values.filter((v) => v !== "");
			return filteredValues.length > 0 ? `${key} ${filteredValues.join(" ")}` : key;
		})
		.join("; ");

	// Warn if CSP header is very large
	if (cspValue.length > 4000) {
		// biome-ignore lint/suspicious/noConsole: Security warnings are intentional
		console.warn(
			`[@enalmada/start-secure] Large CSP header detected (${cspValue.length} bytes). Some browsers/proxies have limits around 4-8KB. Consider reducing rules.`,
		);
	}
	if (cspValue.length > 8000) {
		// biome-ignore lint/suspicious/noConsole: Security warnings are intentional
		console.error(
			`[@enalmada/start-secure] CSP header is very large (${cspValue.length} bytes). This may be rejected by browsers/proxies. Maximum ~8KB recommended.`,
		);
	}

	// Merge default config with provided overrides, filtering out undefined values
	const finalConfig = {
		...defaultSecurityHeadersConfig,
		...(headerConfig
			? Object.fromEntries(Object.entries(headerConfig).filter(([_, value]) => value !== undefined))
			: {}),
	};

	// Build security headers object
	const headers: SecurityHeaders = {
		"Content-Security-Policy": cspValue,
		"X-Frame-Options": finalConfig["X-Frame-Options"],
		"X-Content-Type-Options": finalConfig["X-Content-Type-Options"],
		"Referrer-Policy": finalConfig["Referrer-Policy"],
		"X-XSS-Protection": finalConfig["X-XSS-Protection"],
		"Strict-Transport-Security": finalConfig["Strict-Transport-Security"],
		"Permissions-Policy": finalConfig["Permissions-Policy"],
	};

	// Only add optional headers if explicitly set
	if (headerConfig?.["X-Powered-By"] !== undefined) {
		headers["X-Powered-By"] = headerConfig["X-Powered-By"];
	}

	if (nonce) {
		headers["x-nonce"] = nonce;
	}

	return headers;
}
