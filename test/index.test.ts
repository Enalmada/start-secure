import { describe, expect, test } from 'vitest';
import { createSecureHandler, generateSecurityHeaders } from '../src';

describe('generateSecurityHeaders', () => {
  test('generates default headers', () => {
    const headers = generateSecurityHeaders();

    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
  });

  test('includes unsafe-inline for scripts and styles when no nonce', () => {
    const headers = generateSecurityHeaders();

    expect(headers['Content-Security-Policy']).toContain("script-src");
    expect(headers['Content-Security-Policy']).toContain("'unsafe-inline'");
    expect(headers['Content-Security-Policy']).toContain("style-src");
  });

  test('uses nonce when provided', () => {
    const headers = generateSecurityHeaders([], { nonce: 'test-nonce-123' });

    expect(headers['Content-Security-Policy']).toContain("'nonce-test-nonce-123'");
    expect(headers['Content-Security-Policy']).toContain("'strict-dynamic'");
    expect(headers['x-nonce']).toBe('test-nonce-123');
  });

  test('merges custom CSP rules', () => {
    const headers = generateSecurityHeaders([
      {
        description: 'custom-api',
        'connect-src': 'https://api.example.com',
      },
    ]);

    expect(headers['Content-Security-Policy']).toContain('https://api.example.com');
  });

  test('adds dev mode adjustments', () => {
    const headers = generateSecurityHeaders([], { isDev: true });

    expect(headers['Content-Security-Policy']).toContain("'unsafe-eval'");
    expect(headers['Content-Security-Policy']).toContain('ws://localhost:*');
  });

  test('merges multiple rules without duplicates', () => {
    const headers = generateSecurityHeaders([
      {
        description: 'rule1',
        'connect-src': 'https://api.example.com',
      },
      {
        description: 'rule2',
        'connect-src': 'https://api.example.com https://other.example.com',
      },
    ]);

    const csp = headers['Content-Security-Policy'];
    const connectSrcMatch = csp.match(/connect-src ([^;]+)/);
    expect(connectSrcMatch).toBeTruthy();

    // Should only have one instance of each domain
    const connectSrcValues = connectSrcMatch![1].split(' ');
    const apiCount = connectSrcValues.filter(v => v === 'https://api.example.com').length;
    expect(apiCount).toBe(1);
  });

  test('allows custom security header config', () => {
    const headers = generateSecurityHeaders([], {
      headerConfig: {
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Powered-By': 'Custom',
      },
    });

    expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(headers['X-Powered-By']).toBe('Custom');
  });
});

describe('createSecureHandler', () => {
  test('applies security headers to response', async () => {
    const mockHandler = async () => new Response('OK');
    const secureHandler = createSecureHandler({
      rules: [],
      options: { isDev: false },
    });

    const wrappedHandler = secureHandler(mockHandler);
    const response = await wrappedHandler(new Request('http://localhost'));

    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
  });

  test('merges custom CSP rules', async () => {
    const mockHandler = async () => new Response('OK');
    const secureHandler = createSecureHandler({
      rules: [
        {
          description: 'custom',
          'connect-src': 'https://api.example.com',
        },
      ],
      options: { isDev: false },
    });

    const wrappedHandler = secureHandler(mockHandler);
    const response = await wrappedHandler(new Request('http://localhost'));

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toContain('https://api.example.com');
  });

  test('preserves response body and status', async () => {
    const mockHandler = async () => new Response('Test Body', { status: 201 });
    const secureHandler = createSecureHandler();

    const wrappedHandler = secureHandler(mockHandler);
    const response = await wrappedHandler(new Request('http://localhost'));

    expect(response.status).toBe(201);
    expect(await response.text()).toBe('Test Body');
  });

  test('works with nonce in options', async () => {
    const mockHandler = async () => new Response('OK');
    const secureHandler = createSecureHandler({
      rules: [],
      options: { nonce: 'test-nonce', isDev: false },
    });

    const wrappedHandler = secureHandler(mockHandler);
    const response = await wrappedHandler(new Request('http://localhost'));

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toContain("'nonce-test-nonce'");
    expect(response.headers.get('x-nonce')).toBe('test-nonce');
  });
});
