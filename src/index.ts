/**
 * @enalmada/start-secure
 * Security header management for TanStack Start applications
 */

// Export types
export type {
  CspRule,
  SecurityHeaders,
  SecurityOptions,
  SecurityHeadersConfig,
} from './internal/types';

export type { StartSecureConfig } from './handler';

// Export main function
export { createSecureHandler } from './handler';

// Re-export generator for advanced use cases
export { generateSecurityHeaders } from './internal/generator';

// Re-export defaults for customization
export { defaultSecurityHeadersConfig } from './internal/defaults';
