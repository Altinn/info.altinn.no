import type { IJSONTransformer } from "./IJSONTransformer";
import { BlockTransformer } from "./BlockTransformer";

export class SectionPageTransformer implements IJSONTransformer {
  public async Transform(cmsPageData: any): Promise<any> {
    const props = cmsPageData.properties ?? {};

    // Always use static asset for background image, never Umbraco media
    const backgroundImage = { src: `/assets/img/illustrasjon_starte_og_drive.svg`, componentName: "Image" };

    const searchForm = props.searchForm
      ? {
          componentName: "SearchForm",
          searchLabel: props.searchForm.searchLabel,
          searchPageUrl: props.searchForm.searchPageUrl,
        }
      : undefined;

    const goToLinkLocation = props.goToLinkLocation
      ? {
          componentName: "LinkItem",
          text: props.goToLinkLocation.text ?? props.goToLinkText,
          url: props.goToLinkLocation.url,
        }
      : undefined;

    // themePageArea is a flat array of child content items (not a Block List)
    const themePageLinks = Array.isArray(props.themePageArea)
      ? props.themePageArea.map((item: any) => ({
          componentName: "LinkItem",
          text: item.name,
          url: item.route?.path,
        }))
      : [];

    const themeArea = props.themeArea
      ? BlockTransformer.TransformBlocks(props.themeArea)
      : undefined;

    const bottomArea = props.bottomArea
      ? BlockTransformer.TransformBlocks(props.bottomArea)
      : undefined;

    return {
      componentName: "SectionPage",
      pageName: cmsPageData.name,
      heading: props.heading,
      backgroundHexColor: props.backgroundHexColor,
      backgroundImage,
      searchForm,
      goToLinkText: props.goToLinkText,
      goToLinkLocation,
      themePageLinks,
      themeArea,
      bottomArea,
    };
  }
}
