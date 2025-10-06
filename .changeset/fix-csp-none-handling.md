---
"@enalmada/start-secure": patch
---

Fix CSP 'none' keyword handling to comply with spec requirements. The 'none' keyword must be the only value in a directive - when mixed with other values, 'none' is now automatically removed to prevent invalid policies.
