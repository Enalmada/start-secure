import { beforeEach, describe, expect, test, vi } from "vitest";

const { setResponseHeader, getResponseHeaders } = vi.hoisted(() => ({
	setResponseHeader: vi.fn(),
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
	setResponseHeader,
}));

import { createCspMiddleware } from "../src/middleware";

type Handler = (args: { next: (value: unknown) => unknown }) => unknown;

function run(config: Parameters<typeof createCspMiddleware>[0]) {
	const handler = createCspMiddleware(config) as unknown as Handler;
	const next = vi.fn((value: unknown) => value);
	const result = handler({ next });
	return { result, next };
}

/** The headers the middleware set, by name. */
function appliedHeaders() {
	return new Map(setResponseHeader.mock.calls.map(([name, value]) => [name as string, value as string]));
}

describe("createCspMiddleware", () => {
	beforeEach(() => {
		setResponseHeader.mockClear();
		getResponseHeaders.mockClear();
	});

	// setResponseHeader is the one helper that behaves the same on every supported Start version:
	// before 1.169.34 setResponseHeaders(new Headers()) sets nothing, and since 1.169 the object
	// getResponseHeaders() returns is a read-only snapshot.
	test("applies each security header with setResponseHeader and never reads the snapshot", () => {
		run({ options: { isDev: false } });

		expect(getResponseHeaders).not.toHaveBeenCalled();

		const headers = appliedHeaders();
		expect(headers.get("Content-Security-Policy")).toContain("default-src");
		expect(headers.get("X-Frame-Options")).toBe("DENY");
		expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
		expect(headers.get("Permissions-Policy")).toContain("camera=()");
		expect(headers.get("Strict-Transport-Security")).toContain("max-age=31536000");
		expect(setResponseHeader).toHaveBeenCalledTimes(headers.size);
	});

	test("omits HSTS in development", () => {
		run({ options: { isDev: true } });

		expect(appliedHeaders().has("Strict-Transport-Security")).toBe(false);
	});

	test("applies additional headers and puts the nonce in the CSP and the context", () => {
		const { next } = run({
			options: { isDev: false },
			nonceGenerator: () => "test-nonce",
			additionalHeaders: { "X-Custom": "yes" },
		});

		const headers = appliedHeaders();
		expect(headers.get("X-Custom")).toBe("yes");
		expect(headers.get("Content-Security-Policy")).toContain("'nonce-test-nonce'");
		expect(next).toHaveBeenCalledWith({ context: { nonce: "test-nonce" } });
	});
});
