import { act, useId, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  installMinimalDom,
  type ShimElement,
  setInnerHTML,
} from "../../../test-utils/minimalDom";
import { hydrateIslands } from "./hydrateIslands";
import { IslandServerContext, withIsland } from "./Island";

const Disclosure = ({ label }: { label: string }) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div>
      <button
        type="button"
        aria-controls={panelId}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      <p id={panelId}>{open ? "Open" : "Closed"}</p>
    </div>
  );
};
const DisclosureIsland = withIsland("Disclosure", Disclosure);

const registry = { Disclosure: DisclosureIsland };

describe("hydrateIslands", () => {
  let dom: ReturnType<typeof installMinimalDom>;
  let recoverableErrors: unknown[];
  let consoleError: ReturnType<typeof vi.spyOn>;

  const hydrate = () =>
    act(async () => {
      hydrateIslands({
        registry,
        root: dom.document as unknown as ParentNode,
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });

  const disclosures = () =>
    dom.document.querySelectorAll("altinn-island").map((island) => {
      const button = island.querySelector("button") as ShimElement;
      const panel = dom.document.getElementById(
        button.getAttribute("aria-controls") ?? "",
      );
      return { island, button, panel };
    });

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    dom = installMinimalDom();
    recoverableErrors = [];
    consoleError = vi.spyOn(console, "error");
    setInnerHTML(
      dom.document.body,
      renderToString(
        <IslandServerContext.Provider value={{ locale: "nb", renderToString }}>
          <DisclosureIsland label="Første" />
          <DisclosureIsland label="Andre" />
        </IslandServerContext.Provider>,
      ),
    );
  });

  afterEach(() => {
    dom.uninstall();
    vi.restoreAllMocks();
  });

  it("hydrates server HTML so clicks update it and id references hold", async () => {
    const serverIds = disclosures().map(({ panel }) => panel?.id);
    expect(serverIds.every(Boolean)).toBe(true);
    expect(new Set(serverIds).size).toBe(2);

    await hydrate();

    expect(recoverableErrors).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();

    const [first, second] = disclosures();
    await act(async () => first.button.click());

    expect(first.panel?.textContent).toBe("Open");
    expect(first.button.getAttribute("aria-expanded")).toBe("true");
    expect(second.panel?.textContent).toBe("Closed");
    expect(disclosures().map(({ panel }) => panel?.id)).toEqual(serverIds);
    expect(recoverableErrors).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("does not create a second root when called again", async () => {
    await hydrate();
    const [first] = disclosures();
    await act(async () => first.button.click());

    await hydrate();
    await act(async () => first.button.click());

    // A second root would hydrate the "Open" markup from initial state and
    // either report a mismatch or attach a second click handler.
    expect(first.panel?.textContent).toBe("Closed");
    expect(first.button.getAttribute("aria-expanded")).toBe("false");
    expect(recoverableErrors).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
