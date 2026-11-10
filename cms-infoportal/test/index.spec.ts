import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { afterEach, describe, it, expect, vi } from "vitest";
import worker from "../src/index";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

const env = { ORIGIN: "https://origin.example" };

function mockOrigin(response = () => new Response("from origin")) {
	return vi.spyOn(globalThis, "fetch").mockImplementation(async () => response());
}

async function callWorker(url: string, init?: RequestInit<IncomingRequestCfProperties>) {
	const ctx = createExecutionContext();
	const response = await worker.fetch(new IncomingRequest(url, init), env, ctx);
	await waitOnExecutionContext(ctx);
	return response;
}

// The request the worker sent to origin.
function proxiedRequest(fetchMock: ReturnType<typeof mockOrigin>) {
	expect(fetchMock).toHaveBeenCalledTimes(1);
	return fetchMock.mock.calls[0][0] as Request;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("cms-infoportal worker", () => {
	it("proxies to ORIGIN keeping path and query", async () => {
		const fetchMock = mockOrigin();

		const response = await callWorker("https://cms.altinn.no/umbraco/section?tab=1");

		expect(await response.text()).toBe("from origin");
		const request = proxiedRequest(fetchMock);
		expect(request.url).toBe("https://origin.example/umbraco/section?tab=1");
		expect(request.method).toBe("GET");
		expect(request.redirect).toBe("manual");
	});

	it("sets forwarding headers from the incoming URL", async () => {
		const fetchMock = mockOrigin();

		await callWorker("https://cms.altinn.no/umbraco");

		const headers = proxiedRequest(fetchMock).headers;
		expect(headers.get("Host")).toBe("cms.altinn.no");
		expect(headers.get("X-Forwarded-Host")).toBe("cms.altinn.no");
		expect(headers.get("X-Forwarded-Proto")).toBe("https");
	});

	it("forwards the body of non-GET requests", async () => {
		const fetchMock = mockOrigin();

		await callWorker("https://cms.altinn.no/umbraco/api/save", {
			method: "POST",
			body: '{"name":"test"}',
		});

		const request = proxiedRequest(fetchMock);
		expect(request.method).toBe("POST");
		expect(await request.text()).toBe('{"name":"test"}');
	});

	it("returns origin redirects as-is instead of following them", async () => {
		mockOrigin(
			() => new Response(null, { status: 302, headers: { Location: "/umbraco/login" } }),
		);

		const response = await callWorker("https://cms.altinn.no/umbraco");

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe("/umbraco/login");
	});

	it.each(["/umbraco/delivery/api/v2/content", "/Umbraco/Delivery/API/v2/content"])(
		"blocks the Delivery API (%s) without calling origin",
		async (path) => {
			const fetchMock = mockOrigin();

			const response = await callWorker(`https://cms.altinn.no${path}`);

			expect(response.status).toBe(404);
			expect(fetchMock).not.toHaveBeenCalled();
		},
	);

	it("forwards only Umbraco and ASP.NET cookies", async () => {
		const fetchMock = mockOrigin();

		await callWorker("https://cms.altinn.no/umbraco", {
			headers: {
				Cookie:
					"_ga=GA1.1; UMB_UCONTEXT=abc; __Host-umbAuth=def; .AspNetCore.Antiforgery=ghi; UmbracoSession=jkl; other=1",
			},
		});

		expect(proxiedRequest(fetchMock).headers.get("Cookie")).toBe(
			"UMB_UCONTEXT=abc; __Host-umbAuth=def; .AspNetCore.Antiforgery=ghi; UmbracoSession=jkl",
		);
	});

	it("drops the Cookie header when no cookies are allowed", async () => {
		const fetchMock = mockOrigin();

		await callWorker("https://cms.altinn.no/umbraco", {
			headers: { Cookie: "_ga=GA1.1; tracking=1" },
		});

		expect(proxiedRequest(fetchMock).headers.has("Cookie")).toBe(false);
	});
});
