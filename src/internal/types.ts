/**
 * Security-related TypeScript type definitions
 * Defines types for CSP rules and security headers
 * Includes configuration interfaces for security options
 */

export interface CspRule {
	readonly description?: string;
	readonly source?: string;

	// Fetch directives (source lists) - support both string and string array
	readonly "base-uri"?: string | readonly string[];
	readonly "child-src"?: string | readonly string[];
	readonly "connect-src"?: string | readonly string[];
	readonly "default-src"?: string | readonly string[];
	readonly "font-src"?: string | readonly string[];
	readonly "form-action"?: string | readonly string[];
	readonly "frame-ancestors"?: string | readonly string[];
	readonly "frame-src"?: string | readonly string[];
	readonly "img-src"?: string | readonly string[];
	readonly "manifest-src"?: string | readonly string[];
	readonly "media-src"?: string | readonly string[];
	readonly "object-src"?: string | readonly string[];
	readonly "script-src"?: string | readonly string[];
	readonly "script-src-attr"?: string | readonly string[];
	readonly "script-src-elem"?: string | readonly string[];
	readonly "style-src"?: string | readonly string[];
	readonly "style-src-attr"?: string | readonly string[];
	readonly "style-src-elem"?: string | readonly string[];
	readonly "worker-src"?: string | readonly string[];

	// Document directives
	readonly sandbox?: string | readonly string[];

	// Navigation directives
	readonly "navigate-to"?: string | readonly string[];

	// Reporting directives
	readonly "report-to"?: string;
	readonly "report-uri"?: string; // Deprecated but still widely used

	// Trusted Types directives
	readonly "require-trusted-types-for"?: string;
	readonly "trusted-types"?: string | readonly string[];

	/**
	 * Boolean directives - these directives don't take values
	 *
	 * Supported values:
	 * - `true` or `''` (empty string): Enable the directive
	 * - `false` or omit: Disable/don't include the directive
	 *
	 * @example
	 * // Enable upgrade-insecure-requests:
	 * { 'upgrade-insecure-requests': true }
	 * // or
	 * { 'upgrade-insecure-requests': '' }
	 *
	 * // Disable (omit the directive):
	 * { } // Don't include it
	 */
	readonly "upgrade-insecure-requests"?: boolean | "";
	/** @deprecated Deprecated but still supported by some browsers */
	readonly "block-all-mixed-content"?: boolean | "";
}

export interface SecurityOptions {
	isDev?: boolean;
	nonce?: string;
	headerConfig?: SecurityHeadersConfig;
}

export interface SecurityHeadersConfig {
	"X-Frame-Options"?: string;
	"X-Content-Type-Options"?: string;
	"Referrer-Policy"?: string;
	"X-XSS-Protection"?: string;
	"Strict-Transport-Security"?: string;
	"Permissions-Policy"?: string;
	"X-Powered-By"?: string;
}

export interface SecurityHeaders {
	"Content-Security-Policy": string;
	"X-Frame-Options": string;
	"X-Content-Type-Options": string;
	"Referrer-Policy": string;
	"X-XSS-Protection": string;
	"Strict-Transport-Security": string;
	"Permissions-Policy": string;
	"X-Powered-By"?: string;
	"x-nonce"?: string;
}
