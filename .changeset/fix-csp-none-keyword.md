---
"@enalmada/start-secure": patch
---

Fix CSP 'none' keyword handling in buildCspHeader()

When users added sources to CSP directives that default to 'none' (frame-src, object-src, child-src, frame-ancestors), the 'none' keyword was incorrectly retained alongside the new sources, creating invalid CSP directives like `frame-src 'none' https://youtube.com`.

According to the CSP specification, 'none' must be the only value in a directive. This fix adds comprehensive 'none' keyword handling:

- Removes 'none' when other sources are added to a directive
- Clears directive and sets only 'none' when user explicitly sets it alone
- Filters 'none' from user values if mixed with other sources

Browser console warnings like "Ignoring unknown option 'none'" are now eliminated, and CSP headers are fully spec-compliant.
