import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchUmbracoMedia } from "./client";

// A rich-text <img> can point at a file that was deleted or never uploaded.
// That used to throw, which failed the request with a server error and filled
// the dev console. A missing file should just be a 404 for that one image.
describe("fetchUmbracoMedia", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const stubFetch = (response: Response) => {
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };

  it("returns the file's bytes", async () => {
    stubFetch(new Response(new Uint8Array([1, 2, 3])));

    const bytes = await fetchUmbracoMedia("/media/abc/image.png");

    expect(Array.from(bytes ?? [])).toEqual([1, 2, 3]);
  });

  it("returns null when Umbraco has no such file", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFetch(new Response(null, { status: 404, statusText: "Not Found" }));

    await expect(
      fetchUmbracoMedia("/media/abc/missing.png??rmode=max&width=698"),
    ).resolves.toBeNull();
  });

  it("still throws on other upstream errors", async () => {
    stubFetch(new Response(null, { status: 500, statusText: "Server Error" }));

    await expect(fetchUmbracoMedia("/media/abc/image.png")).rejects.toThrow(
      "Failed to fetch media from Umbraco",
    );
  });

  it("maps legacy asset paths to /media/", async () => {
    const fetchMock = stubFetch(new Response(new Uint8Array([1])));

    await fetchUmbracoMedia("/contentassets/abc/file.pdf");

    expect(fetchMock.mock.calls[0][0]).toMatch(/media\/abc\/file\.pdf$/);
    expect(fetchMock.mock.calls[0][0]).not.toContain("contentassets");
  });
});
