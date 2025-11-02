---
"@enalmada/start-secure": major
---

Add native middleware pattern with per-request nonce generation for TanStack Start applications. This is a major update that introduces a new recommended API while maintaining backward compatibility.

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
