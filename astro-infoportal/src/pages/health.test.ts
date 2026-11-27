import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ELASTICSEARCH_URL = "https://search.example.test";

const fetchMock = vi.fn<(request: Request) => Promise<Response>>();

async function runHealthCheck() {
  vi.resetModules();
  const { env } = await import("cloudflare:workers");
  env.UMBRACO_API_URL = "https://cms.example.test/";
  env.ELASTICSEARCH_URL = ELASTICSEARCH_URL;
  env.ELASTICSEARCH_API_KEY = "test-key";
  const { GET } = await import("./health");
  const response = await GET({
    url: new URL("https://info.example.test/health"),
  } as any);
  return response.json();
}

function elasticsearchRequests() {
  return fetchMock.mock.calls
    .map(([request]) => request)
    .filter((request) => request.url.startsWith(ELASTICSEARCH_URL));
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
  fetchMock.mockImplementation(async () => new Response("", { status: 503 }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

describe("health elasticsearch probe", () => {
  it("asks the cluster info endpoint with the API key instead of searching", async () => {
    await runHealthCheck();

    const requests = elasticsearchRequests();
    expect(requests.map((request) => request.url)).toEqual([
      `${ELASTICSEARCH_URL}/`,
    ]);
    expect(requests[0].headers.get("Authorization")).toBe("ApiKey test-key");
    const allUrls = fetchMock.mock.calls.map(([request]) => request.url);
    expect(
      allUrls.some((url) => url.includes("/sok") || url.includes("_search")),
    ).toBe(false);
  });

  it("is healthy when Elasticsearch returns cluster info", async () => {
    fetchMock.mockImplementation(async (request) =>
      request.url.startsWith(ELASTICSEARCH_URL)
        ? new Response(
            JSON.stringify({ name: "serverless", cluster_name: "abc123" }),
            { status: 200 },
          )
        : new Response("", { status: 503 }),
    );

    const health = await runHealthCheck();

    expect(health.entries.elasticsearch.status).toBe("Healthy");
  });

  it("is unhealthy when Elasticsearch rejects the key", async () => {
    fetchMock.mockImplementation(async (request) =>
      request.url.startsWith(ELASTICSEARCH_URL)
        ? new Response(JSON.stringify({ error: "security_exception" }), {
            status: 403,
          })
        : new Response("", { status: 503 }),
    );

    const health = await runHealthCheck();

    expect(health.entries.elasticsearch.status).toBe("Unhealthy");
  });
});
