# Migration Guide: v1.0.0 to v1.0.1

## Breaking Change: createNonceGetter() Removed

### Why This Change?

v1.0.0's `createNonceGetter()` had a critical bug where the isomorphic wrapper broke AsyncLocalStorage, preventing nonce access. v1.0.1 removes this broken function and aligns with the official TanStack Router pattern.

**The Bug:**
- `createIsomorphicFn()` wrapper broke AsyncLocalStorage context chain
- Server-side `getStartContext()` failed with "No Start context found"
- Scripts rendered without nonce attributes
- All scripts blocked by CSP

**The Fix:**
- Remove broken isomorphic wrapper
- Use direct context access (official TanStack pattern)
- Simpler, more explicit, and actually works

## Migration Steps

### Before (v1.0.0 - BROKEN)

```typescript
// src/router.tsx
import { createNonceGetter } from '@enalmada/start-secure';

const getNonce = createNonceGetter();  // ❌ Broken - returns undefined

export function getRouter() {
  return createRouter({
    ssr: { nonce: getNonce() }  // ❌ Scripts have no nonces
  });
}
```

### After (v1.0.1 - WORKING)

```typescript
// src/router.tsx
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

  return createRouter({
    // ... other options
    ssr: { nonce }  // ✅ Scripts now have nonces
  });
}
```

## Step-by-Step Migration

### 1. Update Package

```bash
bun add @enalmada/start-secure@^1.0.1
```

### 2. Update Router Code

**Change 1:** Make `getRouter()` async

```diff
- export function getRouter() {
+ export async function getRouter() {
```

**Change 2:** Remove `createNonceGetter()` import and usage

```diff
- import { createNonceGetter } from '@enalmada/start-secure';
- const getNonce = createNonceGetter();
```

**Change 3:** Add direct context access

```typescript
// At the start of getRouter()
let nonce: string | undefined;

if (typeof window === 'undefined') {
  // Dynamic import prevents Node.js code in browser bundle
  const { getStartContext } = await import('@tanstack/start-storage-context');
  const context = getStartContext();
  nonce = context.contextAfterGlobalMiddlewares?.nonce;
}
```

**Change 4:** Update router config

```diff
  return createRouter({
    // ... other options
    ssr: {
-     nonce: getNonce()
+     nonce
    }
  });
```

Or, if using `exactOptionalPropertyTypes`:

```diff
  return createRouter({
    // ... other options
-   ssr: {
-     nonce: getNonce()
-   }
+   ...(nonce ? { ssr: { nonce } } : {})
  });
```

### 3. Verify Integration

After updating:

1. **Start dev server:**
   ```bash
   bun dev
   ```

2. **Open browser DevTools**

3. **Check Console** - Should see no CSP violations

4. **Inspect Page Source** (View → Developer → View Source)
   - Search for `<script` tags
   - Verify they have `nonce="..."` attributes
   - Check `<meta property="csp-nonce">` exists in `<head>`

5. **Check Network Tab** - Response Headers
   - Verify CSP header includes nonce value
   - Example: `Content-Security-Policy: script-src 'nonce-XXX' 'strict-dynamic'`

## Complete Example

### Full Router Implementation

```typescript
// src/router.tsx
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import type { ReactNode } from "react";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}

interface RouterContext {
  queryClient: QueryClient;
}

export async function getRouter() {
  // Get nonce on server (client uses meta tag automatically)
  let nonce: string | undefined;

  if (typeof window === "undefined") {
    try {
      // Dynamic import for server-only code
      const { getStartContext } = await import("@tanstack/start-storage-context");
      const context = getStartContext();
      nonce = context.contextAfterGlobalMiddlewares?.nonce;
    } catch (error) {
      // Context not available (shouldn't happen, but handle gracefully)
      nonce = undefined;
    }
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient } as RouterContext,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
    Wrap: ({ children }: { children: ReactNode }) => (
      <I18nProvider i18n={i18n}>{children}</I18nProvider>
    ),

    // CSP nonce support - applies to all framework-generated scripts
    ...(nonce ? { ssr: { nonce } } : {}),
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    handleRedirects: true,
    wrapQueryClient: true,
  });

  return router;
}
```

### Middleware Setup (No Changes)

The middleware setup remains unchanged from v1.0.0:

```typescript
// src/start.ts
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

## What Still Works

These parts of the package are **NOT** affected by this change:

- ✅ `createCspMiddleware()` - Works perfectly
- ✅ `generateNonce()` - Works perfectly
- ✅ `buildCspHeader()` - Works perfectly
- ✅ Middleware nonce generation - Works perfectly
- ✅ CSP header setting - Works perfectly

Only the **router integration pattern** changed. The middleware functionality remains solid.

## Troubleshooting

### Scripts Still Blocked by CSP

**Symptom:**
```
Content-Security-Policy: The page's settings blocked an inline script
```

**Check:**
1. Is `getRouter()` async? (Required for dynamic import)
2. Is dynamic import inside `typeof window === 'undefined'` check?
3. Are you accessing `contextAfterGlobalMiddlewares?.nonce`?
4. Is nonce passed to router config?

**Debug:**
Add console.log to verify nonce value:
```typescript
if (typeof window === 'undefined') {
  const { getStartContext } = await import('@tanstack/start-storage-context');
  const context = getStartContext();
  nonce = context.contextAfterGlobalMiddlewares?.nonce;
  console.log('[DEBUG] Nonce from context:', nonce ? 'EXISTS' : 'UNDEFINED');
}
```

### TypeScript Error with exactOptionalPropertyTypes

**Error:**
```
Type 'string | undefined' is not assignable to type 'string'
```

**Fix:**
Use conditional spread instead of always including ssr object:
```typescript
return createRouter({
  // ... other options
  ...(nonce ? { ssr: { nonce } } : {})
});
```

### Import Error in Browser

**Error:**
```
Module "node:async_hooks" has been externalized for browser compatibility
```

**Cause:** Imported `getStartContext` at module level (browser tries to load it)

**Fix:** Use dynamic import inside server-only conditional:
```typescript
if (typeof window === 'undefined') {
  const { getStartContext } = await import('@tanstack/start-storage-context');
  // ...
}
```

## Why This Pattern is Better

### Official TanStack Pattern

This migration aligns with the official TanStack Router pattern documented in:
- [Router Discussion #3028](https://github.com/TanStack/router/discussions/3028)

The TanStack maintainers recommend this exact approach. We were trying to be "helpful" with an isomorphic wrapper, but it broke AsyncLocalStorage.

### Benefits of Direct Access

1. **Works** - No AsyncLocalStorage bugs
2. **Simple** - 5 lines of code, very explicit
3. **Official** - Matches TanStack documentation
4. **Debuggable** - Easy to add console.log for troubleshooting
5. **No magic** - No hidden wrapper behavior

### AsyncLocalStorage Explained

**Common Question:** "Does AsyncLocalStorage work in browsers?"

**Answer:** AsyncLocalStorage is a **Node.js server-side API only**. It has nothing to do with browser compatibility.

**How it works:**
- **Server (Node.js):** Uses AsyncLocalStorage to track per-request context
- **Client (Browser):** Reads nonce from `<meta property="csp-nonce">` tag

The workaround is needed because `createIsomorphicFn()` broke the **server-side** AsyncLocalStorage chain, not because of any browser issue.

## Support

If you encounter issues after migration:

1. Check this guide's Troubleshooting section
2. Verify you're on v1.0.1 or later
3. Review the Complete Example above
4. Check [GitHub Issues](https://github.com/Enalmada/start-secure/issues)

## References

- **Official TanStack Pattern:** https://github.com/TanStack/router/discussions/3028
- **Bug Analysis:** See TanStarter `.plan/plans/tanstack_csp/CRITICAL-BUG.md`
- **AsyncLocalStorage Docs:** https://nodejs.org/api/async_context.html
- **Package Repo:** https://github.com/Enalmada/start-secure
