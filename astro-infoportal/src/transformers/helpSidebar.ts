import { resolveBlockReferences } from "../api/umbraco/client";
import type { Locale } from "@i18n/index";

function findActiveDrilldownId(
  cmsPageData: any,
  ancestors: any[],
): string | undefined {
  if (cmsPageData?.contentType === "helpDrilldownPage") {
    return cmsPageData.id;
  }
  return ancestors?.find((a: any) => a?.contentType === "helpDrilldownPage")?.id;
}

function findHelpStartPage(ancestors: any[]): any | undefined {
  return ancestors?.find((a: any) => a?.contentType === "helpStartPage");
}

function mapDrilldownToSidebarItem(activeId: string | undefined) {
  return (item: any) => ({
    label: item?.name,
    url: item?.route?.path,
    icon: item?.properties?.akselIcon,
    current: !!activeId && item?.id === activeId,
  });
}

// Builds the "Hjelp" left-rail nav shown on every help subpage (drilldown,
// landing, question, process-article). Lists newDrilldownPages first, then
// oldDrilldownPages, in editor order. Active drilldown is current-flagged so
// useSidebarConfig can highlight it. Source of truth is the parent
// HelpStartPage's properties — we pull from the ancestors list to avoid an
// extra fetch (it's already loaded for the breadcrumb).
export async function buildHelpSidebarViewModel(
  cmsPageData: any,
  ancestors: any[],
  locale: Locale,
) {
  const helpStart = findHelpStartPage(ancestors);
  if (!helpStart) return undefined;
  const props = helpStart?.properties ?? {};

  const [newRefs, oldRefs] = await Promise.all([
    resolveBlockReferences(props.newDrilldownPages, locale),
    resolveBlockReferences(props.oldDrilldownPages, locale),
  ]);

  const activeId = findActiveDrilldownId(cmsPageData, ancestors);
  const map = mapDrilldownToSidebarItem(activeId);
  const mainItems = [...newRefs.map(map), ...oldRefs.map(map)];

  return {
    titleItem: {
      label: helpStart?.name ?? "Hjelp",
      url: helpStart?.route?.path ?? "/hjelp/",
      icon: "InformationSquareIcon",
    },
    mainItems,
  };
}
