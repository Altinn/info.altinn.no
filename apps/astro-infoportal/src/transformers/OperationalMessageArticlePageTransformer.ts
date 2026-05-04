import type { IJSONTransformer } from "./IJSONTransformer";

function resolvePickerUrl(value: any): string | null {
  const item = Array.isArray(value) ? value[0] : value;
  return item?.route?.path ?? item?.url ?? null;
}

function resolvePickerText(value: any): string | null {
  const item = Array.isArray(value) ? value[0] : value;
  return item?.name ?? item?.title ?? null;
}

export function transformOperationalMessageArticle(cmsPageData: any): any {
  const props = cmsPageData?.properties ?? {};
  const isCritical = props.isCritical === true;
  const colorVariant = props.colorVariant || (isCritical ? "danger" : "warning");

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
    lastChangedDateString: cmsPageData?.updateDate ?? null,
    lastChangedDateFormatted: null,
  };
}

export class OperationalMessageArticlePageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    return transformOperationalMessageArticle(cmsPageData);
  }
}
