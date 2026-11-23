# Changelog

## 1.1.0

### Minor Changes

- 1b0cae9: Declare the supported TanStack Start range and drop an unused peer

  - `@tanstack/react-start` peer is now `>=1.132.0` (was `>=1.0.0`). That is the first version with `createStart({ requestMiddleware })`, which the README pattern needs; earlier versions never worked with `createCspMiddleware`.
  - Removed the `@tanstack/start-storage-context` peer. The library never imports it; only the router nonce snippet in the README does. If you use that snippet, install `@tanstack/start-storage-context` in your app (you already do if you copied it). The loose peer could also resolve to a stale copy that does not share Start's request storage, which makes the nonce come back `undefined`.

### Patch Changes

- 4f4afc8: Stop mutating TanStack Start's read-only response header snapshot

  `createCspMiddleware` built its headers by calling `.set()` on the object returned by `getResponseHeaders()`. Current TanStack Start returns a read-only snapshot there, so every request logged `getResponseHeaders().set() does not change the response` once per header. The headers still reached the response through the final `setResponseHeaders` call, but the log was noisy.

  The middleware now applies each header with `setResponseHeader`. The headers sent are unchanged.

  It deliberately does not use `setResponseHeaders(new Headers())`: before Start 1.169.34 that helper reads its argument with `Object.entries`, so a `Headers` object sets nothing and every security header would be silently dropped. `setResponseHeader` behaves the same on every supported version.

## 1.0.2

### Patch Changes

- e664f82: Fix CSP 'none' keyword handling in buildCspHeader()

  When users added sources to CSP directives that default to 'none' (frame-src, object-src, child-src, frame-ancestors), the 'none' keyword was incorrectly retained alongside the new sources, creating invalid CSP directives like `frame-src 'none' https://youtube.com`.

  According to the CSP specification, 'none' must be the only value in a directive. This fix adds comprehensive 'none' keyword handling:

  - Removes 'none' when other sources are added to a directive
  - Clears directive and sets only 'none' when user explicitly sets it alone
  - Filters 'none' from user values if mixed with other sources

  Browser console warnings like "Ignoring unknown option 'none'" are now eliminated, and CSP headers are fully spec-compliant.

## 1.0.1

### Patch Changes

- 25686c0: **BREAKING CHANGE:** Remove broken `createNonceGetter()` function

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
  import { createNonceGetter } from "@enalmada/start-secure";
  const getNonce = createNonceGetter();
  const router = createRouter({ ssr: { nonce: getNonce() } });
  ```

  **After (v1.0.1 - WORKING):**

  ```typescript
  export async function getRouter() {
    let nonce: string | undefined;
    if (typeof window === "undefined") {
      const { getStartContext } =
        await import("@tanstack/start-storage-context");
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

## 1.0.0

### Major Changes

- d95f3dd: Add native middleware pattern with per-request nonce generation for TanStack Start applications. This is a major update that introduces a new recommended API while maintaining backward compatibility.

  **New Features:**

  - `createCspMiddleware()` - Middleware factory for TanStack Start with per-request nonce generation
  - `createNonceGetter()` - Isomorphic nonce retrieval (works on server and client)
  - `generateNonce()` - Cryptographically secure random nonce generator
  - `buildCspHeader()` - Low-level CSP header building utility
  - CSP Level 3 support with automatic granular directive copying (`-elem`, `-attr`)
  - Strict nonce-based CSP for scripts (no `'unsafe-inline'` in production)
  - Integration with TanStack router's native `ssr.nonce` option

  **Breaking Changes:**

  - This release is a major version because it introduces a new peer dependency: `@tanstack/start-storage-context >= 1.0.0`
  - The recommended API has changed from handler wrapper (`createSecureHandler`) to middleware pattern (`createCspMiddleware`)
  - Projects should migrate to the new API for better security (per-request nonces vs static headers)

  **Migration:**

  The old `createSecureHandler` API is still available and fully functional, but is now deprecated. See README for migration guide from v0.1 to v0.2.

  **Security Improvements:**

  - Per-request nonce generation (previously static at startup)
  - No `'unsafe-inline'` fallback for scripts in production
  - Support for `'strict-dynamic'` CSP directive
  - Automatic nonce application to all TanStack framework scripts

## 0.1.2

### Patch Changes

- ba9cd36: Fix CSP 'none' keyword handling to comply with spec requirements. The 'none' keyword must be the only value in a directive - when mixed with other values, 'none' is now automatically removed to prevent invalid policies.

## 0.1.1

### Patch Changes

- 04567a0: Add GitHub Actions workflows and changesets configuration for CI/CD

## 0.1.0 (Initial Release)

### Features

- 🎉 Initial release of @enalmada/start-secure
- 🔒 Secure CSP defaults with automatic merging
- 🛠️ Development mode support (HMR, eval)
- 📝 Type-safe CSP rule definitions
- 🔐 Nonce support for scripts and styles
- 🚀 Simple handler wrapper API

### Credits

Migrated from tanstarter project security implementation.
