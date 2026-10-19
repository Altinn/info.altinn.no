import { RootProvider } from "@altinn/altinn-components";
import type { Locale } from "@i18n/index";
import {
  type ComponentType,
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useId,
} from "react";
import { UiLanguageProvider } from "../UiLanguage/UiLanguage";

/** Context the providers around an island need, serialized next to its props. */
export interface IslandEnv {
  locale?: Locale;
  uiLang?: Locale;
}

interface IslandServerContext extends IslandEnv {
  /** Only provided by the server-side page render, never shipped to the client. */
  renderToString?: (
    element: ReactElement,
    options: { identifierPrefix: string },
  ) => string;
}

export const IslandServerContext = createContext<IslandServerContext>({});

const InsideIslandContext = createContext(false);

export const ISLAND_TAG = "altinn-island";

export const IslandProviders = ({
  env,
  children,
}: {
  env: IslandEnv;
  children: ReactNode;
}) => (
  <InsideIslandContext.Provider value={true}>
    <RootProvider languageCode={env.locale}>
      <UiLanguageProvider lang={env.uiLang}>{children}</UiLanguageProvider>
    </RootProvider>
  </InsideIslandContext.Provider>
);

/**
 * Makes a registry component hydrate on its own. `name` must match the
 * component's export name in App.Components, which is how the client finds it.
 *
 * Inside an island, on the client or in tests (no server renderer in context)
 * the component renders as is, so nested islands collapse into their parent.
 */
export const withIsland = <P extends object>(
  name: string,
  Component: ComponentType<P>,
) => {
  const Island = (props: P) => {
    const insideIsland = useContext(InsideIslandContext);
    const { renderToString, ...env } = useContext(IslandServerContext);
    // Each island is its own React root, so its useId values need a prefix
    // that is unique on the page and identical when hydrating.
    const identifierPrefix = `i${useId().replace(/[^\w-]/g, "")}-`;

    if (insideIsland || !renderToString) {
      return <Component {...props} />;
    }

    const html = renderToString(
      <IslandProviders env={env}>
        <Island {...props} />
      </IslandProviders>,
      { identifierPrefix },
    );

    return (
      <altinn-island
        data-name={name}
        data-props={JSON.stringify(props)}
        data-env={JSON.stringify(env)}
        data-prefix={identifierPrefix}
        style={{ display: "contents" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };
  Island.displayName = `Island(${name})`;
  return Island;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "altinn-island": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}
