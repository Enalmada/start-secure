---
"@enalmada/start-secure": minor
---

Declare the supported TanStack Start range and drop an unused peer

- `@tanstack/react-start` peer is now `>=1.132.0` (was `>=1.0.0`). That is the first version with `createStart({ requestMiddleware })`, which the README pattern needs; earlier versions never worked with `createCspMiddleware`.
- Removed the `@tanstack/start-storage-context` peer. The library never imports it; only the router nonce snippet in the README does. If you use that snippet, install `@tanstack/start-storage-context` in your app (you already do if you copied it). The loose peer could also resolve to a stale copy that does not share Start's request storage, which makes the nonce come back `undefined`.
