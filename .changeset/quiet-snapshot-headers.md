---
"@enalmada/start-secure": patch
---

Stop mutating TanStack Start's read-only response header snapshot

`createCspMiddleware` built its headers by calling `.set()` on the object returned by `getResponseHeaders()`. Current TanStack Start returns a read-only snapshot there, so every request logged `getResponseHeaders().set() does not change the response` once per header. The headers still reached the response through the final `setResponseHeaders` call, but the log was noisy.

The middleware now collects its headers in a fresh `Headers` object and applies them with `setResponseHeaders`. The headers sent are unchanged.
