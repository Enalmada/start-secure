# @enalmada/start-secure

Security header management for TanStack Start applications with native nonce support.

[![npm version](https://badge.fury.io/js/@enalmada%2Fstart-secure.svg)](https://www.npmjs.com/package/@enalmada/start-secure)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔒 Secure defaults (strict CSP, security headers)
- 🎯 Type-safe CSP rule definitions
- 🔄 Automatic CSP rule merging and deduplication
- 🛠️ Development mode support (HMR, eval, WebSocket)
- 📝 Rule descriptions for documentation
- 🔐 **Native per-request nonce generation** (v0.2+)
- ⚡ **Middleware pattern** for TanStack Start (v0.2+)
- 🎯 **Official TanStack pattern** (direct context access, v1.0.1+)
- 🚀 Minimal setup (~20 lines)

## What's New in v1.0.1

**BREAKING CHANGE:** Removed `createNonceGetter()` due to critical AsyncLocalStorage bug.

**Why the change?**
- The isomorphic wrapper broke AsyncLocalStorage context chain
- Scripts were rendered without nonce attributes
- Fixed by using direct context access (official TanStack pattern)

**Migration:** See [MIGRATION-1.0-to-1.0.1.md](./docs/MIGRATION-1.0-to-1.0.1.md)

## What's New in v1.0.0 (Previously v0.2)

TanStack Start has **native nonce support** via `router.options.ssr.nonce`. This package provides:

- **Per-request nonce generation** - Unique cryptographic nonce for each request
- **Middleware pattern** - Integrates with TanStack Start's global middleware system
- **No `'unsafe-inline'` for scripts** - Strict CSP in production (scripts only, styles remain pragmatic)
- **Automatic nonce application** - TanStack router applies nonces to all framework scripts
- **Direct context access** - Official TanStack pattern (v1.0.1+)

**Reference:** [TanStack Router Discussion #3028](https://github.com/TanStack/router/discussions/3028)

## Installation

```bash
bun add @enalmada/start-secure
```

## Quick Start (v1.0.1 - Recommended)

### Step 1: Create CSP rules configuration

**File:** `src/config/cspRules.ts`

```typescript
import type { CspRule } from '@enalmada/start-secure';

export const cspRules: CspRule[] = [
  {
    description: 'google-auth',
    'form-action': "'self' https://accounts.google.com",
    'img-src': "https://*.googleusercontent.com",
    'connect-src': "https://*.googleusercontent.com",
  },
  {
    description: 'posthog-analytics',
    'script-src': "https://*.posthog.com",
    'connect-src': "https://*.posthog.com",
  },
];
```

### Step 2: Register CSP middleware

**File:** `src/start.ts`

```typescript
import { createStart } from '@tanstack/react-start';
import { createCspMiddleware } from '@enalmada/start-secure';
import { cspRules } from './config/cspRules';

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCspMiddleware({
      rules: cspRules,
      options: { isDev: process.env.NODE_ENV !== 'production' }
    })
  ]
}));
```

### Step 3: Configure router with nonce

**File:** `src/router.tsx`

```typescript
import { createRouter } from '@tanstack/react-router';

export async function getRouter() {
  // Get nonce on server (client uses meta tag automatically)
  let nonce: string | undefined;

  if (typeof window === 'undefined') {
    // Dynamic import for server-only code
    const { getStartContext } = await import('@tanstack/start-storage-context');
    const context = getStartContext();
    nonce = context.contextAfterGlobalMiddlewares?.nonce;
  }

  const router = createRouter({
    routeTree,
    // ... other options
    ssr: { nonce }  // Applies nonce to all framework scripts
  });

  return router;
}
```

**Why this pattern?**
- Direct context access (official TanStack pattern)
- No wrapper to break AsyncLocalStorage
- Works on both server and client

That's it! **Total setup: ~20 lines of code.**

## API Reference

### v0.2 API (Recommended)

#### `createCspMiddleware(config)`

Creates CSP middleware for TanStack Start with per-request nonce generation.

**Parameters:**
- `config.rules?: CspRule[]` - Array of CSP rules to merge with defaults
- `config.options.isDev?: boolean` - Enable development mode (WebSocket, unsafe-eval, HTTPS/HTTP sources)
- `config.nonceGenerator?: () => string` - Custom nonce generator (optional, defaults to crypto-random)
- `config.additionalHeaders?: Record<string, string>` - Additional response headers to set

**Returns:** TanStack Start middleware

**Example:**
```typescript
import { createCspMiddleware } from '@enalmada/start-secure';

const middleware = createCspMiddleware({
  rules: [
    { description: 'google-fonts', 'font-src': 'https://fonts.gstatic.com' }
  ],
  options: { isDev: process.env.NODE_ENV !== 'production' }
});
```

#### `createNonceGetter()` ⚠️ REMOVED in v1.0.1

**This function has been removed due to a critical AsyncLocalStorage bug.**

The isomorphic wrapper broke AsyncLocalStorage context chain, preventing nonce access.
Use direct context access instead (see Quick Start above).

**Migration:** See [MIGRATION-1.0-to-1.0.1.md](./docs/MIGRATION-1.0-to-1.0.1.md)

**Correct pattern (v1.0.1+):**
```typescript
export async function getRouter() {
  let nonce: string | undefined;
  if (typeof window === 'undefined') {
    const { getStartContext } = await import('@tanstack/start-storage-context');
    nonce = getStartContext().contextAfterGlobalMiddlewares?.nonce;
  }
  return createRouter({ ssr: { nonce } });
}
```

#### `generateNonce()`

Generates a cryptographically secure random nonce for CSP.

**Returns:** Base64-encoded random nonce (128-bit from UUID)

**Example:**
```typescript
import { generateNonce } from '@enalmada/start-secure';

const nonce = generateNonce();
// "Y2QxMjM0NTY3ODkwMTIzNDU2Nzg="
```

#### `buildCspHeader(rules, nonce, isDev)`

Low-level utility to build CSP header string from rules and nonce.

**Parameters:**
- `rules: CspRule[]` - CSP rules to merge
- `nonce: string` - Nonce for this request
- `isDev: boolean` - Whether in development mode

**Returns:** CSP header string

**Example:**
```typescript
import { buildCspHeader } from '@enalmada/start-secure';

const csp = buildCspHeader(rules, generateNonce(), false);
// "default-src 'self'; script-src 'self' 'nonce-...' ..."
```

### Types

#### `CspRule`

```typescript
interface CspRule {
  description?: string; // Document why this rule exists
  source?: string;      // Reserved for future use

  // CSP directives - all optional, support both string and string[]
  'base-uri'?: string | string[];
  'child-src'?: string | string[];
  'connect-src'?: string | string[];
  'default-src'?: string | string[];
  'font-src'?: string | string[];
  'form-action'?: string | string[];
  'frame-ancestors'?: string | string[];
  'frame-src'?: string | string[];
  'img-src'?: string | string[];
  'manifest-src'?: string | string[];
  'media-src'?: string | string[];
  'object-src'?: string | string[];
  'script-src'?: string | string[];
  'script-src-attr'?: string | string[];
  'script-src-elem'?: string | string[];
  'style-src'?: string | string[];
  'style-src-attr'?: string | string[];
  'style-src-elem'?: string | string[];
  'worker-src'?: string | string[];
}
```

#### `CspMiddlewareConfig`

```typescript
interface CspMiddlewareConfig {
  rules?: CspRule[];
  options?: SecurityOptions;
  nonceGenerator?: () => string;
  additionalHeaders?: Record<string, string>;
}
```

## Security Model

### Scripts: Strict Nonce-based CSP

**Production:**
```
script-src 'self' 'nonce-XXX' 'strict-dynamic'
script-src-elem 'self' 'nonce-XXX' 'strict-dynamic'
```

- ✅ Unique nonce per request
- ✅ `'strict-dynamic'` allows nonce-verified scripts to load other scripts
- ✅ `'unsafe-inline'` is ignored when nonce present (CSP Level 2+ backward compatibility)
- ✅ No inline scripts without nonce

**Development:**
- Adds `'unsafe-eval'` for source maps and dev tools
- Adds `https:` and `http:` for CDN scripts during development

### Styles: Pragmatic Approach

```
style-src 'self' 'unsafe-inline'
style-src-elem 'self' 'unsafe-inline'
style-src-attr 'unsafe-inline'
```

**Why `'unsafe-inline'` for styles:**
- React hydration injects styles before nonce available
- Vite HMR injects styles dynamically
- CSS-in-JS libraries generate runtime styles
- Tailwind and other frameworks inject dynamic styles
- **Trade-off:** Styles cannot execute code (low XSS risk)

This is the industry-standard approach used by GitHub, Google, and other major sites.

### CSP Level 3 Support

The package properly handles granular directives (`-elem`, `-attr`):

1. User rules can target base directives (`script-src`, `style-src`)
2. Sources are automatically copied to granular directives
3. CSP Level 3 browsers check granular directives first

**Example:**
```typescript
// User rule adds external font
{ 'font-src': 'https://fonts.gstatic.com' }

// Automatically merged with base directive and copied to granular if present
```

## Examples

### Multiple Service Rules

```typescript
import { createCspMiddleware } from '@enalmada/start-secure';

const middleware = createCspMiddleware({
  rules: [
    {
      description: 'google-auth',
      'form-action': "'self' https://accounts.google.com",
      'img-src': "https://*.googleusercontent.com",
      'connect-src': "https://*.googleusercontent.com",
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

### Custom Nonce Generator

```typescript
import { createCspMiddleware } from '@enalmada/start-secure';

const middleware = createCspMiddleware({
  rules: [...],
  nonceGenerator: () => {
    // Custom nonce generation logic
    return customCryptoFunction();
  },
});
```

### Additional Headers

```typescript
import { createCspMiddleware } from '@enalmada/start-secure';

const middleware = createCspMiddleware({
  rules: [...],
  additionalHeaders: {
    'X-Custom-Header': 'value',
    'X-Powered-By': 'My App',
  },
});
```

## Default Security Headers

The middleware automatically sets these security headers:

```
Content-Security-Policy: (built from rules + nonce)
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload (production only)
Permissions-Policy: camera=(), microphone=(), geolocation=(), ...
```

## Migration from v0.1

If you're using the old `createSecureHandler` API, here's how to migrate:

### Before (v0.1)

```typescript
// src/server.ts
import { createSecureHandler } from '@enalmada/start-secure';

const secureHandler = createSecureHandler({
  rules: cspRules,
  options: { isDev: process.env.NODE_ENV !== 'production' }
});

export default {
  fetch: secureHandler(createStartHandler(defaultStreamHandler))
};
```

### After (v0.2)

```typescript
// src/start.ts (NEW FILE)
import { createStart } from '@tanstack/react-start';
import { createCspMiddleware } from '@enalmada/start-secure';

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCspMiddleware({ rules: cspRules, options: { isDev: process.env.NODE_ENV !== 'production' } })
  ]
}));

// src/router.tsx (UPDATED - v1.0.1)
export async function getRouter() {
  let nonce: string | undefined;
  if (typeof window === 'undefined') {
    const { getStartContext } = await import('@tanstack/start-storage-context');
    nonce = getStartContext().contextAfterGlobalMiddlewares?.nonce;
  }
  return createRouter({ ssr: { nonce } });
}

// src/server.ts (SIMPLIFIED)
const fetch = createStartHandler(defaultStreamHandler);
```

### Benefits of v0.2

- ✅ Per-request nonce generation (not static)
- ✅ No `'unsafe-inline'` for scripts in production
- ✅ Integrates with TanStack router nonce support
- ✅ Automatic nonce in all framework scripts
- ✅ Cleaner, more maintainable code

---

## Legacy API (v0.1)

The v0.1 handler wrapper API is still available for backward compatibility but is **deprecated**. Please migrate to v0.2 for better security.

### `createSecureHandler(config)` (Deprecated)

```typescript
import { createSecureHandler } from '@enalmada/start-secure';

const secureHandler = createSecureHandler({
  rules: [
    { 'connect-src': 'https://api.example.com' }
  ],
  options: {
    isDev: process.env.NODE_ENV !== 'production'
  }
});

export default {
  fetch: secureHandler(createStartHandler(defaultStreamHandler))
};
```

**Limitations:**
- ❌ Headers generated once at startup (no per-request nonces)
- ❌ Falls back to `'unsafe-inline'` for scripts
- ❌ Doesn't integrate with TanStack router

## Contributing

Contributions are welcome! Please open an issue or PR.

## License

MIT © Adam Lane

## Credits

Inspired by [@enalmada/next-secure](https://github.com/Enalmada/next-secure).
