/**
 * TanStack Start security handler
 * Provides middleware wrapper for applying security headers
 */

import { generateSecurityHeaders } from './internal/generator';
import type { CspRule, SecurityOptions } from './internal/types';

/**
 * Configuration for TanStack Start security handler
 */
export interface StartSecureConfig {
  rules?: CspRule[];
  options?: SecurityOptions;
}

/**
 * Creates a security middleware wrapper for TanStack Start handlers
 *
 * @example
 * ```typescript
 * import { createSecureHandler } from '@enalmada/start-secure';
 * import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';
 *
 * const secureHandler = createSecureHandler({
 *   rules: [
 *     {
 *       description: 'google-auth',
 *       'form-action': "'self' https://accounts.google.com",
 *       'img-src': "https://*.googleusercontent.com",
 *       'connect-src': "https://*.googleusercontent.com",
 *     },
 *   ],
 *   options: { isDev: process.env.NODE_ENV !== 'production' }
 * });
 *
 * export default {
 *   fetch: secureHandler(createStartHandler(defaultStreamHandler))
 * };
 * ```
 */
export function createSecureHandler(config: StartSecureConfig = {}) {
  const { rules = [], options = {} } = config;

  return function securityMiddleware(
    handler: (request: Request) => Promise<Response> | Response
  ) {
    return async function wrappedHandler(request: Request): Promise<Response> {
      // Call the original handler
      const response = await handler(request);

      // Generate security headers
      const securityHeaders = generateSecurityHeaders(rules, options);

      // Create new response with security headers
      const newResponse = new Response(response.body, response);

      for (const [key, value] of Object.entries(securityHeaders)) {
        newResponse.headers.set(key, value);
      }

      return newResponse;
    };
  };
}
