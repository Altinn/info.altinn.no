import { Menu, RootProvider } from "@altinn/altinn-components";
import type { Locale } from "@i18n/index";
import useSidebarConfig from "./useSidebarConfig";

interface PageSidebarNavProps {
  viewModel?: any;
  locale?: Locale;
  contentLocale?: Locale;
}

export const hasPageSidebar = (viewModel?: any) =>
  !!useSidebarConfig(viewModel);

/**
 * Server-rendered sidebar navigation, passed to SiteLayout as static slot HTML
 * so the sidebar data is not serialized into the island. Same markup as
 * Layout renders for `sidebar.menu`.
 */
const PageSidebarNav = ({
  viewModel,
  locale,
  contentLocale,
}: PageSidebarNavProps) => {
  const contentLang =
    locale && contentLocale && locale !== contentLocale
      ? contentLocale
      : undefined;
  const config = useSidebarConfig(viewModel, { lang: contentLang });
  if (!config?.menu) return null;

  return (
    <RootProvider languageCode={locale}>
      <nav aria-label="Sidebar">
        <Menu {...config.menu} a11yMode="navigation" />
      </nav>
    </RootProvider>
  );
};

export default PageSidebarNav;
