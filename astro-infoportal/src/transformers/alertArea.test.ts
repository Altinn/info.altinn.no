import { describe, expect, it, vi } from "vitest";
import {
  alertAreaRefs,
  loadAlertMessages,
  mergeAlertRefs,
  resolveAlertRefsWithNbFallback,
} from "./alertArea";

const ref = (id: string) => ({
  contentType: "operationalMessageArticlePage",
  id,
  route: { path: `/om-altinn/driftsmeldinger/${id}/` },
});

describe("alertAreaRefs", () => {
  it("normalises missing and non-array values to an empty list", () => {
    expect(alertAreaRefs(null)).toEqual([]);
    expect(alertAreaRefs(undefined)).toEqual([]);
    expect(alertAreaRefs({})).toEqual([]);
  });

  it("passes an array through", () => {
    const refs = [ref("a")];
    expect(alertAreaRefs(refs)).toBe(refs);
  });
});

describe("mergeAlertRefs", () => {
  it("keeps NB's set and order", () => {
    const merged = mergeAlertRefs([ref("a"), ref("b")], [ref("b")]);
    expect(merged.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("appends references only the localised list carries", () => {
    const merged = mergeAlertRefs([ref("a")], [ref("b")]);
    expect(merged.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("returns NB's list when the localised list is empty", () => {
    const merged = mergeAlertRefs([ref("a"), ref("b")], []);
    expect(merged.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("drops duplicates and references without an id", () => {
    const merged = mergeAlertRefs(
      [ref("a"), ref("a"), { route: { path: "/x/" } }],
      [ref("a"), null],
    );
    expect(merged.map((r) => r.id)).toEqual(["a"]);
  });
});

describe("resolveAlertRefsWithNbFallback", () => {
  const fetchNb = (alertArea: unknown) =>
    vi.fn().mockResolvedValue({ properties: { alertArea } });

  it("does not fall back when the content locale is already nb", async () => {
    const fetch = fetchNb([ref("a")]);
    const result = await resolveAlertRefsWithNbFallback(
      "start-id",
      [ref("b")],
      "nb",
      fetch,
    );

    expect(result.map((r) => r.id)).toEqual(["b"]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses NB's list when the localised alertArea is empty", async () => {
    const fetch = fetchNb([ref("a"), ref("b")]);
    const result = await resolveAlertRefsWithNbFallback(
      "start-id",
      [],
      "en",
      fetch,
    );

    expect(fetch).toHaveBeenCalledWith("start-id");
    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("restores the messages the Delivery API filtered out of the localised list", async () => {
    const fetch = fetchNb([ref("a"), ref("b")]);
    const result = await resolveAlertRefsWithNbFallback(
      "start-id",
      [ref("b")],
      "nn",
      fetch,
    );

    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("keeps a locale-only reference that NB does not list", async () => {
    const fetch = fetchNb([ref("a")]);
    const result = await resolveAlertRefsWithNbFallback(
      "start-id",
      [ref("c")],
      "en",
      fetch,
    );

    expect(result.map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("keeps the localised list when there is no node id to look up", async () => {
    const fetch = fetchNb([ref("a")]);
    const result = await resolveAlertRefsWithNbFallback(
      undefined,
      [ref("c")],
      "en",
      fetch,
    );

    expect(result.map((r) => r.id)).toEqual(["c"]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps the localised list when the NB lookup fails or has no alertArea", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(
      resolveAlertRefsWithNbFallback("start-id", [ref("c")], "en", failing),
    ).resolves.toEqual([ref("c")]);

    const empty = vi.fn().mockResolvedValue({ properties: {} });
    await expect(
      resolveAlertRefsWithNbFallback("start-id", [ref("c")], "en", empty),
    ).resolves.toEqual([ref("c")]);
  });
});

describe("loadAlertMessages", () => {
  it("loads every reference by id, preserving order", async () => {
    const fetchById = vi.fn(async (id: string) => ({ name: id.toUpperCase() }));
    const result = await loadAlertMessages([ref("a"), ref("b")], fetchById);

    expect(fetchById.mock.calls.map(([id]) => id)).toEqual(["a", "b"]);
    expect(result).toEqual([{ name: "A" }, { name: "B" }]);
  });

  it("drops references that cannot be loaded instead of failing the page", async () => {
    const fetchById = vi.fn(async (id: string) => {
      if (id === "a") throw new Error("boom");
      if (id === "b") return null;
      return { name: id };
    });

    const result = await loadAlertMessages(
      [ref("a"), ref("b"), ref("c"), { route: { path: "/x/" } }],
      fetchById,
    );

    expect(result).toEqual([{ name: "c" }]);
  });
});
