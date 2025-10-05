/**
 * Security header generation utilities
 * Generates CSP and other security headers
 * Handles nonce generation and policy compilation
 */

import type { CspRule, SecurityHeaders, SecurityOptions } from './types';
import { defaultSecurityHeadersConfig, getDefaultCspDirectives } from './defaults';
import { mergeDirectivesWithDefaults } from './merger';

/**
 * Generates complete security headers from CSP rules
 * @param rules - Array of CSP rules to apply
 * @param options - Security configuration options
 * @returns Complete set of security headers
 */
export function generateSecurityHeaders(
  rules: CspRule[] = [],
  options: SecurityOptions = {}
): SecurityHeaders {
  const { isDev = process.env.NODE_ENV !== "production", nonce, headerConfig } = options;

  // Get default CSP directives with environment-specific adjustments
  const defaultDirectives = getDefaultCspDirectives(isDev, nonce);

  // Merge default directives with user rules
  const mergedDirectives = mergeDirectivesWithDefaults(defaultDirectives, rules);

  // Generate CSP header value from Sets
  const cspValue = Object.entries(mergedDirectives)
    .map(([key, valueSet]) => `${key} ${Array.from(valueSet).join(" ")}`)
    .join("; ");

  // Merge default config with provided overrides
  const finalConfig = {
    ...defaultSecurityHeadersConfig,
    ...headerConfig,
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
