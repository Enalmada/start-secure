---
"@enalmada/start-secure": patch
---

Stop mutating TanStack Start's read-only response header snapshot

`createCspMiddleware` built its headers by calling `.set()` on the object returned by `getResponseHeaders()`. Current TanStack Start returns a read-only snapshot there, so every request logged `getResponseHeaders().set() does not change the response` once per header. The headers still reached the response through the final `setResponseHeaders` call, but the log was noisy.

The middleware now applies each header with `setResponseHeader`. The headers sent are unchanged.

It deliberately does not use `setResponseHeaders(new Headers())`: before Start 1.169.34 that helper reads its argument with `Object.entries`, so a `Headers` object sets nothing and every security header would be silently dropped. `setResponseHeader` behaves the same on every supported version.
