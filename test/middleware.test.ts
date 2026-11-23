import { beforeEach, describe, expect, test, vi } from "vitest";

const { setResponseHeaders, getResponseHeaders } = vi.hoisted(() => ({
	setResponseHeaders: vi.fn(),
	getResponseHeaders: vi.fn(() => {
		throw new Error("createCspMiddleware must not read the response header snapshot");
	}),
}));

vi.mock("@tanstack/react-start", () => ({
	// Return the server handler itself so the test can call it directly.
	createMiddleware: () => ({ server: (handler: unknown) => handler }),
}));

vi.mock("@tanstack/react-start/server", () => ({
	getResponseHeaders,
	setResponseHeaders,
}));

import { createCspMiddleware } from "../src/middleware";

type Handler = (args: { next: (value: unknown) => unknown }) => unknown;

function run(config: Parameters<typeof createCspMiddleware>[0]) {
	const handler = createCspMiddleware(config) as unknown as Handler;
	const next = vi.fn((value: unknown) => value);
	const result = handler({ next });
	return { result, next };
}

describe("createCspMiddleware", () => {
	beforeEach(() => {
		setResponseHeaders.mockClear();
		getResponseHeaders.mockClear();
	});

	test("applies the security headers through setResponseHeaders without reading the snapshot", () => {
		run({ options: { isDev: false } });

		expect(getResponseHeaders).not.toHaveBeenCalled();
		expect(setResponseHeaders).toHaveBeenCalledTimes(1);

		const headers = setResponseHeaders.mock.calls[0]?.[0] as Headers;
		expect(headers).toBeInstanceOf(Headers);
		expect(headers.get("Content-Security-Policy")).toContain("default-src");
		expect(headers.get("X-Frame-Options")).toBe("DENY");
		expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
		expect(headers.get("Permissions-Policy")).toContain("camera=()");
		expect(headers.get("Strict-Transport-Security")).toContain("max-age=31536000");
	});

	test("omits HSTS in development", () => {
		run({ options: { isDev: true } });

		const headers = setResponseHeaders.mock.calls[0]?.[0] as Headers;
		expect(headers.get("Strict-Transport-Security")).toBeNull();
	});

	test("applies additional headers and puts the nonce in the CSP and the context", () => {
		const { next } = run({
			options: { isDev: false },
			nonceGenerator: () => "test-nonce",
			additionalHeaders: { "X-Custom": "yes" },
		});

		const headers = setResponseHeaders.mock.calls[0]?.[0] as Headers;
		expect(headers.get("X-Custom")).toBe("yes");
		expect(headers.get("Content-Security-Policy")).toContain("'nonce-test-nonce'");
		expect(next).toHaveBeenCalledWith({ context: { nonce: "test-nonce" } });
	});
});
