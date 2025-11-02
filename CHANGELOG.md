# Changelog

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
