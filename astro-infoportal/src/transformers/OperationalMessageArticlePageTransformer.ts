import type { IJSONTransformer } from "./IJSONTransformer";

function resolvePickerUrl(value: any): string | null {
  const item = Array.isArray(value) ? value[0] : value;
  return item?.route?.path ?? item?.url ?? null;
}

function resolvePickerText(value: any): string | null {
  const item = Array.isArray(value) ? value[0] : value;
  return item?.name ?? item?.title ?? null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

export function transformOperationalMessageArticle(cmsPageData: any): any {
  const props = cmsPageData?.properties ?? {};
  const isCritical = props.isCritical === true;
  const colorVariant = props.colorVariant || (isCritical ? "danger" : "warning");
  const lastChangedDateString = cmsPageData?.updateDate ?? null;
  const lastChangedDateFormatted = lastChangedDateString
    ? formatDate(lastChangedDateString)
    : null;

  return {
    componentName: "OperationalMessageArticlePage",
    pageName: cmsPageData?.name ?? "",
    mainBody: props.mainBody ?? "",
    mainBodyRichText: props.mainBodyRichText ?? null,
    url: cmsPageData?.route?.path ?? props.url ?? null,
    isCritical,
    colorVariant,
    linkUrl: props.linkUrl ?? resolvePickerUrl(props.link),
    linkText: props.linkText ?? resolvePickerText(props.link),
    lastChangedDateString,
    lastChangedDateFormatted,
  };
}

export class OperationalMessageArticlePageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    return transformOperationalMessageArticle(cmsPageData);
  }
}
