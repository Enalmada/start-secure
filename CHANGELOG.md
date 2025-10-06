# Changelog

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
