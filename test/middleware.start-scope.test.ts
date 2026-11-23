/**
 * @vitest-environment node
 */

import { afterEach, describe, expect, test, vi } from "vitest";
import { createCspMiddleware } from "../src/middleware";

// Runs the middleware inside a real TanStack Start request scope (no mocks of
// @tanstack/react-start), so a change in Start's response-header helpers shows up
// here instead of in a consuming app. Start keeps the request event in an
// AsyncLocalStorage on globalThis; `{ request, requestUrl }` is the event it
// creates for each request.
const start = await import("@tanstack/react-start/server");
const startStorage = (globalThis as Record<symbol, unknown>)[Symbol.for("tanstack-start:event-storage")] as {
	run: <T>(store: object, fn: () => T) => T;
};

type Handler = (args: { next: (value: unknown) => unknown }) => unknown;

// createMiddleware().server(fn) returns a middleware object; the handler is kept on options.server
function serverHandler(config: Parameters<typeof createCspMiddleware>[0]): Handler {
	return (createCspMiddleware(config) as unknown as { options: { server: Handler } }).options.server;
}

function inStartRequest<T>(body: () => T): T {
	const request = new Request("http://localhost:3000/");
	return startStorage.run({ request, requestUrl: new URL(request.url) }, body);
}

describe("createCspMiddleware in a real Start request", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("puts the security headers on the response without any warning", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const handler = serverHandler({
			options: { isDev: false },
			nonceGenerator: () => "test-nonce",
			additionalHeaders: { "X-Custom": "yes" },
		});

		const headers = inStartRequest(() => {
			// A header set earlier in the same request must survive
			start.setResponseHeader("X-Earlier", "kept");
			handler({ next: (value) => value });
			return start.getResponseHeaders();
		});

		expect(warn).not.toHaveBeenCalled();
		expect(headers.get("Content-Security-Policy")).toContain("'nonce-test-nonce'");
		expect(headers.get("X-Frame-Options")).toBe("DENY");
		expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
		expect(headers.get("Strict-Transport-Security")).toContain("max-age=31536000");
		expect(headers.get("X-Custom")).toBe("yes");
		expect(headers.get("X-Earlier")).toBe("kept");
	});

	test("does not touch cookies set earlier in the request", () => {
		const handler = serverHandler({ options: { isDev: true } });

		const cookies = inStartRequest(() => {
			start.setCookie("locale", "es");
			handler({ next: (value) => value });
			return start.getResponseHeaders().getSetCookie();
		});

		expect(cookies).toHaveLength(1);
		expect(cookies[0]).toContain("locale=es");
	});
});
