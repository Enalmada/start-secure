/**
 * Security-related TypeScript type definitions
 * Defines types for CSP rules and security headers
 * Includes configuration interfaces for security options
 */

export interface CspRule {
  description?: string;
  source?: string;
  "base-uri"?: string;
  "child-src"?: string;
  "connect-src"?: string;
  "default-src"?: string;
  "font-src"?: string;
  "form-action"?: string;
  "frame-ancestors"?: string;
  "frame-src"?: string;
  "img-src"?: string;
  "manifest-src"?: string;
  "media-src"?: string;
  "object-src"?: string;
  "script-src"?: string;
  "style-src"?: string;
  "worker-src"?: string;
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
