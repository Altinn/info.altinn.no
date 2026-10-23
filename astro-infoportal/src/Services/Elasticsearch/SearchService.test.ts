import { describe, expect, it } from "vitest";
import { selectRelevantSemanticHits } from "./SearchService";

// knn _score for cosine similarity is (1 + cosine) / 2.
const hit = (id: string, cosine: number) => ({
  _id: id,
  _score: (1 + cosine) / 2,
  _source: { title: id },
});

// 20 candidates: the given leaders, then filler down to a noise floor of 0.82.
const candidates = (leaders: number[]) => [
  ...leaders.map((cosine, i) => hit(`lead${i}`, cosine)),
  ...Array.from({ length: 20 - leaders.length }, (_, i) =>
    hit(`noise${i}`, 0.835 - i * 0.001),
  ),
];

const ids = (hits: Array<Record<string, unknown>>) => hits.map((h) => h._id);

describe("selectRelevantSemanticHits", () => {
  it("keeps hits that clearly beat the query's noise floor", () => {
    const hits = candidates([0.88, 0.86, 0.835]);
    expect(ids(selectRelevantSemanticHits(hits))).toEqual(["lead0", "lead1"]);
  });

  it("keeps nothing when no hit stands out (unrelated query)", () => {
    const hits = candidates([0.836, 0.835]);
    expect(selectRelevantSemanticHits(hits)).toEqual([]);
  });

  it("keeps nothing when there are too few candidates to judge", () => {
    const hits = candidates([0.95]).slice(0, 10);
    expect(selectRelevantSemanticHits(hits)).toEqual([]);
  });

  it("returns at most 5 hits", () => {
    const hits = candidates([0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9]);
    expect(selectRelevantSemanticHits(hits)).toHaveLength(5);
  });
});
