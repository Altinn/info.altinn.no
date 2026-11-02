import { parse } from "node-html-parser";
import { useId } from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useUiLanguage } from "../UiLanguage/UiLanguage";
import { IslandServerContext, withIsland } from "./Island";

const Greeting = ({ name }: { name: string }) => {
  const uiLang = useUiLanguage();
  return (
    <p id={useId()} lang={uiLang}>
      Hei {name}
    </p>
  );
};
const GreetingIsland = withIsland("Greeting", Greeting);

const Outer = ({ name }: { name: string }) => (
  <section>
    <GreetingIsland name={name} />
  </section>
);
const OuterIsland = withIsland("Outer", Outer);

const renderOnServer = (element: React.ReactElement) =>
  parse(
    renderToStaticMarkup(
      <IslandServerContext.Provider
        value={{ locale: "en", uiLang: "en", renderToString }}
      >
        {element}
      </IslandServerContext.Provider>,
    ),
  );

describe("withIsland", () => {
  it("renders the component as is without a server renderer (client, tests)", () => {
    const root = parse(renderToStaticMarkup(<GreetingIsland name="Kari" />));

    expect(root.querySelector("altinn-island")).toBeNull();
    expect(root.querySelector("p")?.textContent).toBe("Hei Kari");
  });

  it("wraps the server render with everything the client needs to hydrate it", () => {
    const root = renderOnServer(<GreetingIsland name="Kari" />);
    const island = root.querySelector("altinn-island");

    expect(island?.getAttribute("data-name")).toBe("Greeting");
    expect(JSON.parse(island?.getAttribute("data-props") ?? "")).toEqual({
      name: "Kari",
    });
    expect(JSON.parse(island?.getAttribute("data-env") ?? "")).toEqual({
      locale: "en",
      uiLang: "en",
    });
    // Providers are re-created inside the island's own React root.
    expect(island?.querySelector("p")?.getAttribute("lang")).toBe("en");
    // useId inside the island is namespaced by the prefix it hydrates with.
    expect(island?.querySelector("p")?.id).toContain(
      island?.getAttribute("data-prefix"),
    );
  });

  it("collapses islands nested inside another island into their parent", () => {
    const root = renderOnServer(<OuterIsland name="Kari" />);

    const islands = root.querySelectorAll("altinn-island");
    expect(islands).toHaveLength(1);
    expect(islands[0].getAttribute("data-name")).toBe("Outer");
    expect(islands[0].querySelector("p")?.textContent).toBe("Hei Kari");
  });

  it("gives sibling islands distinct id prefixes", () => {
    const root = renderOnServer(
      <>
        <GreetingIsland name="Kari" />
        <GreetingIsland name="Ola" />
      </>,
    );

    const prefixes = root
      .querySelectorAll("altinn-island")
      .map((island) => island.getAttribute("data-prefix"));
    expect(new Set(prefixes).size).toBe(2);
  });
});
