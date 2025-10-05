/**
 * Default security headers and CSP directives
 * Provides secure defaults following security best practices
 */

import type { SecurityHeadersConfig } from './types';

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
  // Force HTTPS
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  // Control browser features
  "Permissions-Policy":
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
};

/**
 * Default CSP directives factory
 * Returns base directives with environment-specific adjustments
 */
export function getDefaultCspDirectives(isDev: boolean, nonce?: string): Record<string, string[]> {
  return {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "child-src": ["'none'"],
    "connect-src": isDev ? ["'self'", "ws://localhost:*", "http://localhost:*"] : ["'self'"],
    "font-src": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "frame-src": ["'none'"],
    "img-src": ["'self'", "blob:", "data:"],
    "manifest-src": ["'self'"],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "script-src": [
      "'self'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      ...(nonce ? [`'nonce-${nonce}'`, "'strict-dynamic'"] : ["'unsafe-inline'"]),
    ],
    "style-src": ["'self'", ...(nonce ? [`'nonce-${nonce}'`] : ["'unsafe-inline'"])],
    "worker-src": ["'self'", "blob:"],
  };
}
