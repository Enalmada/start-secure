# @enalmada/start-secure

Security header management for TanStack Start applications.

[![npm version](https://badge.fury.io/js/@enalmada%2Fstart-secure.svg)](https://www.npmjs.com/package/@enalmada/start-secure)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔒 Secure defaults (strict CSP, security headers)
- 🎯 Type-safe CSP rule definitions
- 🔄 Automatic CSP rule merging and deduplication
- 🛠️ Development mode support (HMR, eval)
- 📝 Rule descriptions for documentation
- 🔐 Nonce support for scripts and styles (via manual implementation)
- 🚀 Zero-config for basic security

## Important Note: Nonce Support

TanStack Start does not yet have built-in nonce support in its rendering pipeline. This package supports nonce configuration for CSP headers, but you'll need to manually inject nonces into your script and style tags until TanStack Start adds native support.

**Discussion:** https://github.com/TanStack/router/discussions/3028

For now, the library defaults to `'unsafe-inline'` when no nonce is provided.

## Installation

```bash
bun add @enalmada/start-secure
```

## Quick Start

**File:** `app/server.ts`

```typescript
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';
import { createSecureHandler } from '@enalmada/start-secure';

const secureHandler = createSecureHandler({
  rules: [
    {
      description: 'google-auth',
      'form-action': "'self' https://accounts.google.com",
      'img-src': "https://*.googleusercontent.com",
      'connect-src': "https://*.googleusercontent.com",
    },
  ],
  options: {
    isDev: process.env.NODE_ENV !== 'production',
  },
});

export default {
  fetch: secureHandler(createStartHandler(defaultStreamHandler)),
};
```

## API

### createSecureHandler(config)

Creates a security middleware wrapper for TanStack Start handlers.

**Parameters:**
- `config.rules?: CspRule[]` - Array of CSP rules to merge
- `config.options.isDev?: boolean` - Enable development mode (allows WebSocket, unsafe-eval)
- `config.options.nonce?: string` - Nonce for script/style tags
- `config.options.headerConfig?: SecurityHeadersConfig` - Override default security headers

**Returns:** Higher-order function that wraps your handler

### CspRule

```typescript
interface CspRule {
  description?: string; // Document why this rule exists
  source?: string;      // Route pattern (reserved for future use)

  // CSP directives
  'base-uri'?: string;
  'child-src'?: string;
  'connect-src'?: string;
  'default-src'?: string;
  'font-src'?: string;
  'form-action'?: string;
  'frame-ancestors'?: string;
  'frame-src'?: string;
  'img-src'?: string;
  'manifest-src'?: string;
  'media-src'?: string;
  'object-src'?: string;
  'script-src'?: string;
  'style-src'?: string;
  'worker-src'?: string;
}
```

## Examples

### Multiple Rules

```typescript
const secureHandler = createSecureHandler({
  rules: [
    {
      description: 'google-auth',
      'form-action': "'self' https://accounts.google.com",
      'img-src': "https://*.googleusercontent.com",
    },
    {
      description: 'sentry-monitoring',
      'worker-src': "blob:",
      'connect-src': "https://*.ingest.sentry.io",
    },
    {
      description: 'posthog-analytics',
      'script-src': "https://*.posthog.com",
      'connect-src': "https://*.posthog.com",
    },
  ],
  options: {
    isDev: process.env.NODE_ENV !== 'production',
  },
});
```

### With Nonce Support

```typescript
import { createSecureHandler } from '@enalmada/start-secure';

const secureHandler = createSecureHandler({
  rules: [...],
  options: {
    nonce: 'your-generated-nonce', // Generate per-request
    isDev: process.env.NODE_ENV !== 'production',
  },
});
```

### Development vs Production

```typescript
const secureHandler = createSecureHandler({
  rules: [...],
  options: {
    // Development mode adds:
    // - 'unsafe-eval' for script-src (dev tools)
    // - ws: and wss: for connect-src (HMR)
    isDev: process.env.NODE_ENV !== 'production',
  },
});
```

## Default Headers

The library provides secure defaults out of the box:

```typescript
{
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; ...",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), ...',
}
```

## Advanced Usage

### Custom Header Configuration

```typescript
const secureHandler = createSecureHandler({
  rules: [...],
  options: {
    headerConfig: {
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Powered-By': 'My App',
    },
  },
});
```

### Custom Header Generation

For advanced use cases, you can use the underlying generator directly:

```typescript
import { generateSecurityHeaders } from '@enalmada/start-secure';

const headers = generateSecurityHeaders(
  [{ 'connect-src': 'https://api.example.com' }],
  { isDev: false }
);

// Apply headers manually
for (const [key, value] of Object.entries(headers)) {
  response.headers.set(key, value);
}
```

## Contributing

Contributions are welcome! Please open an issue or PR.

## License

MIT © Adam Lane

## Credits

Inspired by [@enalmada/next-secure](https://github.com/Enalmada/next-secure).
