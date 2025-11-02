---
'@enalmada/start-secure': patch
---

**BREAKING CHANGE:** Remove broken `createNonceGetter()` function

## What Changed

- **Removed:** `createNonceGetter()` function (had critical AsyncLocalStorage bug)
- **Updated:** README with official TanStack pattern using direct context access
- **Updated:** API documentation to show deprecation notice
- **Added:** Comprehensive migration guide (docs/MIGRATION-1.0-to-1.0.1.md)

## Why This Change?

The `createIsomorphicFn()` wrapper in `createNonceGetter()` broke Node.js AsyncLocalStorage context chain:
- Server-side `getStartContext()` failed with "No Start context found"
- Scripts rendered without nonce attributes
- All scripts blocked by CSP

## Migration Required

**Before (v1.0.0 - BROKEN):**
```typescript
import { createNonceGetter } from '@enalmada/start-secure';
const getNonce = createNonceGetter();
const router = createRouter({ ssr: { nonce: getNonce() } });
```

**After (v1.0.1 - WORKING):**
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

This aligns with the official TanStack Router pattern: https://github.com/TanStack/router/discussions/3028

## What Still Works

No changes to these (all work perfectly):
- ✅ `createCspMiddleware()` - Middleware nonce generation
- ✅ `generateNonce()` - Crypto-random nonce generation
- ✅ `buildCspHeader()` - CSP header building
- ✅ All security headers and CSP rules

## Full Migration Guide

See [docs/MIGRATION-1.0-to-1.0.1.md](../docs/MIGRATION-1.0-to-1.0.1.md) for complete migration guide with troubleshooting.
