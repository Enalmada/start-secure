import { describe, expect, test } from "vitest";
import { buildCspHeader } from "../src";
import type { CspRule } from "../src/internal/types";

describe("buildCspHeader - 'none' keyword handling", () => {
	test("removes 'none' from frame-src when adding YouTube URLs (bug scenario)", () => {
		// This is the exact scenario that caused the browser warning
		const rules: CspRule[] = [
			{
				description: "frame-sources",
				"frame-src": ["https://*.youtube.com", "https://www.youtube-nocookie.com", "https://*.gell.com"],
			},
		];

		const cspHeader = buildCspHeader(rules, "test-nonce", true);

		// Extract frame-src directive
		const frameSrcMatch = cspHeader.match(/frame-src ([^;]+)/);
		expect(frameSrcMatch).toBeTruthy();

		const frameSrcValue = frameSrcMatch?.[1];

		// Should contain the YouTube URLs
		expect(frameSrcValue).toContain("https://*.youtube.com");
		expect(frameSrcValue).toContain("https://www.youtube-nocookie.com");
		expect(frameSrcValue).toContain("https://*.gell.com");

		// Should NOT contain 'none' (this was the bug!)
		expect(frameSrcValue).not.toContain("'none'");
	});

	test("removes 'none' from frame-src when adding single URL", () => {
		const rules: CspRule[] = [
			{
				description: "youtube",
				"frame-src": "https://www.youtube.com",
			},
		];

		const cspHeader = buildCspHeader(rules, "test-nonce", false);
		const frameSrcMatch = cspHeader.match(/frame-src ([^;]+)/);

		expect(frameSrcMatch?.[1]).toContain("https://www.youtube.com");
		expect(frameSrcMatch?.[1]).not.toContain("'none'");
	});

	test("removes 'none' from object-src when adding source", () => {
		const rules: CspRule[] = [
			{
				description: "pdf-viewer",
				"object-src": "https://cdn.example.com",
			},
		];

		const cspHeader = buildCspHeader(rules, "test-nonce", false);
		const objectSrcMatch = cspHeader.match(/object-src ([^;]+)/);

		expect(objectSrcMatch?.[1]).toContain("https://cdn.example.com");
		expect(objectSrcMatch?.[1]).not.toContain("'none'");
	});

	test("removes 'none' from child-src when adding source", () => {
		const rules: CspRule[] = [
			{
				description: "worker",
				"child-src": "blob:",
			},
		];

		const cspHeader = buildCspHeader(rules, "test-nonce", false);
		const childSrcMatch = cspHeader.match(/child-src ([^;]+)/);

		expect(childSrcMatch?.[1]).toContain("blob:");
		expect(childSrcMatch?.[1]).not.toContain("'none'");
	});

	test("keeps 'none' when no other values are added", () => {
		// Don't add any frame-src rules, should keep default 'none'
		const rules: CspRule[] = [];

		const cspHeader = buildCspHeader(rules, "test-nonce", false);
		const frameSrcMatch = cspHeader.match(/frame-src ([^;]+)/);

		expect(frameSrcMatch?.[1]).toBe("'none'");
	});

	test("handles 'none' correctly when it's the only value in rule", () => {
		// User explicitly sets a directive to 'none'
		const rules: CspRule[] = [
			{
				description: "test",
				"media-src": "'none'",
			},
		];

		const cspHeader = buildCspHeader(rules, "test-nonce", false);
		const mediaSrcMatch = cspHeader.match(/media-src ([^;]+)/);

		// Should only have 'none', not the default 'self'
		expect(mediaSrcMatch?.[1]).toBe("'none'");
		expect(mediaSrcMatch?.[1]).not.toContain("'self'");
	});

	test("removes 'none' when user provides mixed values in single string", () => {
		// User tries to add 'none' with other values (invalid, should filter 'none')
		const rules: CspRule[] = [
			{
				description: "test",
				"frame-src": "'none' https://example.com",
			},
		];

		const cspHeader = buildCspHeader(rules, "test-nonce", false);
		const frameSrcMatch = cspHeader.match(/frame-src ([^;]+)/);

		// Should have example.com but NOT 'none'
		expect(frameSrcMatch?.[1]).toContain("https://example.com");
		expect(frameSrcMatch?.[1]).not.toContain("'none'");
	});

	test("removes 'none' when adding multiple values via array", () => {
		const rules: CspRule[] = [
			{
				description: "test",
				"frame-src": ["https://example1.com", "https://example2.com"],
			},
		];

		const cspHeader = buildCspHeader(rules, "test-nonce", false);
		const frameSrcMatch = cspHeader.match(/frame-src ([^;]+)/);

		expect(frameSrcMatch?.[1]).toContain("https://example1.com");
		expect(frameSrcMatch?.[1]).toContain("https://example2.com");
		expect(frameSrcMatch?.[1]).not.toContain("'none'");
	});

	test("handles multiple rules modifying same directive with 'none'", () => {
		const rules: CspRule[] = [
			{
				description: "rule1",
				"frame-src": "https://example1.com",
			},
			{
				description: "rule2",
				"frame-src": "https://example2.com",
			},
		];

		const cspHeader = buildCspHeader(rules, "test-nonce", false);
		const frameSrcMatch = cspHeader.match(/frame-src ([^;]+)/);

		// Should have both URLs, no 'none', and no duplicates
		expect(frameSrcMatch?.[1]).toContain("https://example1.com");
		expect(frameSrcMatch?.[1]).toContain("https://example2.com");
		expect(frameSrcMatch?.[1]).not.toContain("'none'");
	});

	test("preserves default 'none' directives when not modified", () => {
		// Add a frame-src rule but don't touch object-src
		const rules: CspRule[] = [
			{
				description: "youtube",
				"frame-src": "https://www.youtube.com",
			},
		];

		const cspHeader = buildCspHeader(rules, "test-nonce", false);

		// frame-src should not have 'none'
		const frameSrcMatch = cspHeader.match(/frame-src ([^;]+)/);
		expect(frameSrcMatch?.[1]).not.toContain("'none'");

		// object-src should still have 'none' (not modified)
		const objectSrcMatch = cspHeader.match(/object-src ([^;]+)/);
		expect(objectSrcMatch?.[1]).toBe("'none'");

		// child-src should still have 'none' (not modified)
		const childSrcMatch = cspHeader.match(/child-src ([^;]+)/);
		expect(childSrcMatch?.[1]).toBe("'none'");
	});
});

describe("buildCspHeader - basic functionality", () => {
	test("generates valid CSP header with nonce", () => {
		const rules: CspRule[] = [];
		const cspHeader = buildCspHeader(rules, "abc123", false);

		expect(cspHeader).toContain("default-src 'self'");
		expect(cspHeader).toContain("'nonce-abc123'");
		expect(cspHeader).toContain("'strict-dynamic'");
	});

	test("includes unsafe-eval in dev mode", () => {
		const rules: CspRule[] = [];
		const cspHeader = buildCspHeader(rules, "abc123", true);

		expect(cspHeader).toContain("'unsafe-eval'");
	});

	test("excludes unsafe-eval in production mode", () => {
		const rules: CspRule[] = [];
		const cspHeader = buildCspHeader(rules, "abc123", false);

		expect(cspHeader).not.toContain("'unsafe-eval'");
	});

	test("merges custom rules correctly", () => {
		const rules: CspRule[] = [
			{
				description: "custom-api",
				"connect-src": "https://api.example.com",
			},
		];

		const cspHeader = buildCspHeader(rules, "abc123", false);
		expect(cspHeader).toContain("https://api.example.com");
	});

	test("includes WebSocket sources in dev mode", () => {
		const rules: CspRule[] = [];
		const cspHeader = buildCspHeader(rules, "abc123", true);

		expect(cspHeader).toContain("ws://localhost:*");
		expect(cspHeader).toContain("wss://localhost:*");
	});

	test("excludes WebSocket sources in production mode", () => {
		const rules: CspRule[] = [];
		const cspHeader = buildCspHeader(rules, "abc123", false);

		expect(cspHeader).not.toContain("ws://localhost:*");
		expect(cspHeader).not.toContain("wss://localhost:*");
	});

	test("does not duplicate values when merging rules", () => {
		const rules: CspRule[] = [
			{
				description: "rule1",
				"connect-src": "https://api.example.com",
			},
			{
				description: "rule2",
				"connect-src": "https://api.example.com", // Same URL
			},
		];

		const cspHeader = buildCspHeader(rules, "abc123", false);
		const connectSrcMatch = cspHeader.match(/connect-src ([^;]+)/);

		// Count how many times the URL appears
		const connectSrcValue = connectSrcMatch?.[1];
		const urlCount = (connectSrcValue.match(/https:\/\/api\.example\.com/g) || []).length;

		expect(urlCount).toBe(1); // Should only appear once
	});

	test("formats CSP header with semicolons between directives", () => {
		const rules: CspRule[] = [];
		const cspHeader = buildCspHeader(rules, "abc123", false);

		// Should have semicolon-separated directives
		expect(cspHeader).toMatch(/default-src [^;]+; base-uri [^;]+;/);
	});

	test("handles array values in rules", () => {
		const rules: CspRule[] = [
			{
				description: "multiple-sources",
				"img-src": ["https://cdn1.example.com", "https://cdn2.example.com"],
			},
		];

		const cspHeader = buildCspHeader(rules, "abc123", false);

		expect(cspHeader).toContain("https://cdn1.example.com");
		expect(cspHeader).toContain("https://cdn2.example.com");
	});

	test("handles string values with multiple space-separated sources", () => {
		const rules: CspRule[] = [
			{
				description: "multiple-sources",
				"font-src": "https://fonts.gstatic.com https://fonts.googleapis.com",
			},
		];

		const cspHeader = buildCspHeader(rules, "abc123", false);

		expect(cspHeader).toContain("https://fonts.gstatic.com");
		expect(cspHeader).toContain("https://fonts.googleapis.com");
	});

	test("'none' is case-sensitive (should not treat 'None' as 'none')", () => {
		// CSP keywords are case-sensitive - 'None' and 'NONE' are NOT valid
		const rules: CspRule[] = [
			{
				description: "case-test",
				"frame-src": "'None' https://example.com",
			},
		];

		const cspHeader = buildCspHeader(rules, "abc123", false);
		const frameSrcMatch = cspHeader.match(/frame-src ([^;]+)/);

		// 'None' should be treated as a regular value (invalid but not filtered)
		// The default 'none' should still be present since we're not adding "'none'" (lowercase)
		expect(frameSrcMatch?.[1]).toContain("'None'");
		expect(frameSrcMatch?.[1]).toContain("https://example.com");
	});

	test("removes 'none' from frame-ancestors when adding source", () => {
		// frame-ancestors also defaults to 'none'
		const rules: CspRule[] = [
			{
				description: "iframe-parent",
				"frame-ancestors": "https://trusted-parent.com",
			},
		];

		const cspHeader = buildCspHeader(rules, "abc123", false);
		const frameAncestorsMatch = cspHeader.match(/frame-ancestors ([^;]+)/);

		expect(frameAncestorsMatch?.[1]).toContain("https://trusted-parent.com");
		expect(frameAncestorsMatch?.[1]).not.toContain("'none'");
	});

	test("handles whitespace around 'none' value", () => {
		// Test that whitespace is properly handled
		const rules: CspRule[] = [
			{
				description: "whitespace-test",
				"frame-src": "  'none'  https://example.com  ",
			},
		];

		const cspHeader = buildCspHeader(rules, "abc123", false);
		const frameSrcMatch = cspHeader.match(/frame-src ([^;]+)/);

		// Should have example.com but NOT 'none' (trimmed and filtered)
		expect(frameSrcMatch?.[1]).toContain("https://example.com");
		expect(frameSrcMatch?.[1]).not.toContain("'none'");
	});
});
