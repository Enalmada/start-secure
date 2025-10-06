import { describe, expect, test } from "vitest";
import { createSecureHandler, generateSecurityHeaders } from "../src";

describe("generateSecurityHeaders", () => {
	test("generates default headers", () => {
		const headers = generateSecurityHeaders();

		expect(headers["X-Frame-Options"]).toBe("DENY");
		expect(headers["X-Content-Type-Options"]).toBe("nosniff");
		expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
	});

	test("includes unsafe-inline for scripts and styles when no nonce", () => {
		const headers = generateSecurityHeaders();

		expect(headers["Content-Security-Policy"]).toContain("script-src");
		expect(headers["Content-Security-Policy"]).toContain("'unsafe-inline'");
		expect(headers["Content-Security-Policy"]).toContain("style-src");
	});

	test("uses nonce when provided", () => {
		const headers = generateSecurityHeaders([], { nonce: "test-nonce-123" });

		expect(headers["Content-Security-Policy"]).toContain("'nonce-test-nonce-123'");
		expect(headers["Content-Security-Policy"]).toContain("'strict-dynamic'");
		expect(headers["x-nonce"]).toBe("test-nonce-123");
	});

	test("merges custom CSP rules", () => {
		const headers = generateSecurityHeaders([
			{
				description: "custom-api",
				"connect-src": "https://api.example.com",
			},
		]);

		expect(headers["Content-Security-Policy"]).toContain("https://api.example.com");
	});

	test("adds dev mode adjustments", () => {
		const headers = generateSecurityHeaders([], { isDev: true });

		expect(headers["Content-Security-Policy"]).toContain("'unsafe-eval'");
		expect(headers["Content-Security-Policy"]).toContain("ws://localhost:*");
	});

	test("merges multiple rules without duplicates", () => {
		const headers = generateSecurityHeaders([
			{
				description: "rule1",
				"connect-src": "https://api.example.com",
			},
			{
				description: "rule2",
				"connect-src": "https://api.example.com https://other.example.com",
			},
		]);

		const csp = headers["Content-Security-Policy"];
		const connectSrcMatch = csp.match(/connect-src ([^;]+)/);
		expect(connectSrcMatch).toBeTruthy();

		// Should only have one instance of each domain
		const connectSrcValues = connectSrcMatch?.[1].split(" ");
		const apiCount = connectSrcValues.filter((v) => v === "https://api.example.com").length;
		expect(apiCount).toBe(1);
	});

	test("allows custom security header config", () => {
		const headers = generateSecurityHeaders([], {
			headerConfig: {
				"X-Frame-Options": "SAMEORIGIN",
				"X-Powered-By": "Custom",
			},
		});

		expect(headers["X-Frame-Options"]).toBe("SAMEORIGIN");
		expect(headers["X-Powered-By"]).toBe("Custom");
	});

	test("includes all default headers", () => {
		const headers = generateSecurityHeaders();

		expect(headers).toHaveProperty("Content-Security-Policy");
		expect(headers).toHaveProperty("X-Frame-Options");
		expect(headers).toHaveProperty("X-Content-Type-Options");
		expect(headers).toHaveProperty("Referrer-Policy");
		expect(headers).toHaveProperty("X-XSS-Protection");
		expect(headers).toHaveProperty("Strict-Transport-Security");
		expect(headers).toHaveProperty("Permissions-Policy");
	});

	test("does not include X-Powered-By by default", () => {
		const headers = generateSecurityHeaders();
		expect(headers["X-Powered-By"]).toBeUndefined();
	});

	test("nonce replaces unsafe-inline, not adds to it", () => {
		const headers = generateSecurityHeaders([], {
			nonce: "test-nonce-123",
			isDev: false,
		});

		const csp = headers["Content-Security-Policy"];
		expect(csp).toContain("'nonce-test-nonce-123'");
		expect(csp).not.toContain("'unsafe-inline'");
	});

	test("handles empty and whitespace CSP values", () => {
		const headers = generateSecurityHeaders([
			{
				"connect-src": "   ",
			},
			{
				"font-src": "",
			},
		]);

		const csp = headers["Content-Security-Policy"];
		expect(csp).toContain("connect-src");
		expect(csp).toContain("font-src");
	});

	test("includes HSTS preload directive", () => {
		const headers = generateSecurityHeaders();
		expect(headers["Strict-Transport-Security"]).toContain("preload");
	});

	test("includes privacy-blocking permissions policy", () => {
		const headers = generateSecurityHeaders();
		expect(headers["Permissions-Policy"]).toContain("interest-cohort=()");
		expect(headers["Permissions-Policy"]).toContain("browsing-topics=()");
	});

	test("dev mode uses websockets only, not http", () => {
		const headers = generateSecurityHeaders([], { isDev: true });
		const csp = headers["Content-Security-Policy"];

		expect(csp).toContain("ws://localhost:*");
		expect(csp).toContain("wss://localhost:*");
		expect(csp).not.toContain("http://localhost:*");
	});

	test("handles boolean directives with true value", () => {
		const headers = generateSecurityHeaders([
			{
				"upgrade-insecure-requests": true,
			},
		]);

		const csp = headers["Content-Security-Policy"];
		// Boolean directive should appear without a value
		expect(csp).toContain("upgrade-insecure-requests");
		// Should not have trailing space or colon
		expect(csp).toMatch(/upgrade-insecure-requests(?:\s*;|$)/);
	});

	test("handles boolean directives with empty string value", () => {
		const headers = generateSecurityHeaders([
			{
				"upgrade-insecure-requests": "",
			},
		]);

		const csp = headers["Content-Security-Policy"];
		expect(csp).toContain("upgrade-insecure-requests");
	});

	test("skips boolean directives with false value", () => {
		const headers = generateSecurityHeaders([
			{
				"upgrade-insecure-requests": false,
			},
		]);

		const csp = headers["Content-Security-Policy"];
		expect(csp).not.toContain("upgrade-insecure-requests");
	});

	test("handles multiple boolean directives", () => {
		const headers = generateSecurityHeaders([
			{
				"upgrade-insecure-requests": true,
				"block-all-mixed-content": true,
			},
		]);

		const csp = headers["Content-Security-Policy"];
		expect(csp).toContain("upgrade-insecure-requests");
		expect(csp).toContain("block-all-mixed-content");
	});
});

describe("createSecureHandler", () => {
	test("applies security headers to response", async () => {
		const mockHandler = async () => new Response("OK");
		const secureHandler = createSecureHandler({
			rules: [],
			options: { isDev: false },
		});

		const wrappedHandler = secureHandler(mockHandler);
		const response = await wrappedHandler(new Request("http://localhost"));

		expect(response.headers.get("X-Frame-Options")).toBe("DENY");
		expect(response.headers.get("Content-Security-Policy")).toBeTruthy();
	});

	test("merges custom CSP rules", async () => {
		const mockHandler = async () => new Response("OK");
		const secureHandler = createSecureHandler({
			rules: [
				{
					description: "custom",
					"connect-src": "https://api.example.com",
				},
			],
			options: { isDev: false },
		});

		const wrappedHandler = secureHandler(mockHandler);
		const response = await wrappedHandler(new Request("http://localhost"));

		const csp = response.headers.get("Content-Security-Policy");
		expect(csp).toContain("https://api.example.com");
	});

	test("preserves response body and status", async () => {
		const mockHandler = async () => new Response("Test Body", { status: 201 });
		const secureHandler = createSecureHandler();

		const wrappedHandler = secureHandler(mockHandler);
		const response = await wrappedHandler(new Request("http://localhost"));

		expect(response.status).toBe(201);
		expect(await response.text()).toBe("Test Body");
	});

	test("works with nonce in options", async () => {
		const mockHandler = async () => new Response("OK");
		const secureHandler = createSecureHandler({
			rules: [],
			options: { nonce: "test-nonce", isDev: false },
		});

		const wrappedHandler = secureHandler(mockHandler);
		const response = await wrappedHandler(new Request("http://localhost"));

		const csp = response.headers.get("Content-Security-Policy");
		expect(csp).toContain("'nonce-test-nonce'");
		expect(response.headers.get("x-nonce")).toBe("test-nonce");
	});

	test("overwrites existing security headers", async () => {
		const mockHandler = async () => {
			const response = new Response("OK");
			response.headers.set("X-Frame-Options", "SAMEORIGIN");
			response.headers.set("Content-Security-Policy", "default-src 'none'");
			return response;
		};

		const secureHandler = createSecureHandler({
			rules: [],
			options: { isDev: false },
		});

		const wrappedHandler = secureHandler(mockHandler);
		const response = await wrappedHandler(new Request("http://localhost"));

		// Should overwrite with our stricter defaults
		expect(response.headers.get("X-Frame-Options")).toBe("DENY");
		expect(response.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
		expect(response.headers.get("Content-Security-Policy")).not.toContain("default-src 'none'");
	});

	test("propagates handler errors", async () => {
		const mockHandler = async () => {
			throw new Error("Handler failed");
		};

		const secureHandler = createSecureHandler();
		const wrappedHandler = secureHandler(mockHandler);

		await expect(wrappedHandler(new Request("http://localhost"))).rejects.toThrow("Handler failed");
	});
});

describe("'none' keyword handling", () => {
	test("removes 'none' when adding other values to frame-src", () => {
		// Default has frame-src 'none', user wants to add youtube
		const headers = generateSecurityHeaders([
			{
				description: "youtube",
				"frame-src": "https://www.youtube.com",
			},
		]);

		const csp = headers["Content-Security-Policy"];
		const frameSrcMatch = csp.match(/frame-src ([^;]+)/);
		expect(frameSrcMatch).toBeTruthy();

		const frameSrcValue = frameSrcMatch?.[1];
		// Should have youtube but NOT 'none'
		expect(frameSrcValue).toContain("https://www.youtube.com");
		expect(frameSrcValue).not.toContain("'none'");
	});

	test("handles 'none' correctly when it's the only value", () => {
		const headers = generateSecurityHeaders([
			{
				description: "test",
				"img-src": "'none'",
			},
		]);

		const csp = headers["Content-Security-Policy"];
		const imgSrcMatch = csp.match(/img-src ([^;]+)/);
		expect(imgSrcMatch).toBeTruthy();

		const imgSrcValue = imgSrcMatch?.[1];
		// Should only have 'none', not 'self', blob:, or data:
		expect(imgSrcValue?.trim()).toBe("'none'");
		expect(imgSrcValue).not.toContain("'self'");
		expect(imgSrcValue).not.toContain("blob:");
		expect(imgSrcValue).not.toContain("data:");
	});

	test("removes 'none' when overriding object-src default", () => {
		// Default has object-src 'none', user wants to add a specific source
		const headers = generateSecurityHeaders([
			{
				description: "pdf-viewer",
				"object-src": "https://cdn.example.com",
			},
		]);

		const csp = headers["Content-Security-Policy"];
		const objectSrcMatch = csp.match(/object-src ([^;]+)/);
		expect(objectSrcMatch).toBeTruthy();

		const objectSrcValue = objectSrcMatch?.[1];
		// Should have the cdn but NOT 'none'
		expect(objectSrcValue).toContain("https://cdn.example.com");
		expect(objectSrcValue).not.toContain("'none'");
	});

	test("handles multiple values including attempt to add 'none' alongside others", () => {
		// If user tries to add 'none' with other values, 'none' should be ignored
		const headers = generateSecurityHeaders([
			{
				description: "test",
				"frame-src": "'none' https://example.com",
			},
		]);

		const csp = headers["Content-Security-Policy"];
		const frameSrcMatch = csp.match(/frame-src ([^;]+)/);
		expect(frameSrcMatch).toBeTruthy();

		const frameSrcValue = frameSrcMatch?.[1];
		// Should have example.com but NOT 'none' (since 'none' must be alone)
		expect(frameSrcValue).toContain("https://example.com");
		expect(frameSrcValue).not.toContain("'none'");
	});
});
