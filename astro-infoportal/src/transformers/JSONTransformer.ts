import type { IJSONTransformer } from "./IJSONTransformer";
import { t } from "@i18n/index";
import { walkAndTransformRichText } from "@components/Shared/RichText/htmlTransforms";
import { SectionPageTransformer } from "./SectionPageTransformer";
import { HeroArticlePageBaseTransformer } from "./HeroArticlePageBaseTransformer";
import { ThemePageTransformer } from "./ThemePageTransformer";
import { AboutPageTransformer } from "./AboutPageTransformer";
import { CategoryPageTransformer } from "./CategoryPageTransformer";
import { HelpDrilldownPageTransformer } from "./HelpDrilldownPageTransformer";
import { HelpLandingPageTransformer } from "./HelpLandingPageTransformer";
import { HelpProcessArticlePageTransformer } from "./HelpProcessArticlePageTransformer";
import { HelpQuestionPageTransformer } from "./HelpQuestionPageTransformer";
import { HelpSearchPageTransformer } from "./HelpSearchPageTransformer";
import { HelpStartPageTransformer } from "./HelpStartPageTransformer";
import { StartPageTransformer } from "./StartPageTransformer";
import { Error404PageTransformer } from "./Error404PageTransformer";
import { SchemaPageTransformer } from "./SchemaPageTransformer";
import { SchemaOverviewPageTransformer } from "./SchemaOverviewPageTransformer";
import { SubsidyPageTransformer } from "./SubsidyPageTransformer";
import { SubsidyOverviewPageTransformer } from "./SubsidyOverviewPageTransformer";
import { SearchPageTransformer } from "./SearchPageTransformer";
import { SubCategoryPageTransformer } from "./SubCategoryPageTransformer";
import { ProviderPageTransformer } from "./ProviderPageTransformer";
import { NewsArchivePageTransformer } from "./NewsArchivePageTransformer";
import { OperationalMessageArticlePageTransformer } from "./OperationalMessageArticlePageTransformer";
import { OperationalMessageArchivePageTransformer } from "./OperationalMessageArchivePageTransformer";
import { SchemaAttachmentPageTransformer } from "./SchemaAttachmentPageTransformer";
import { ContactFormPageTransformer } from "./generatedTransformers/Pages/ContactFormPageTransformer";
import { hydrateNestedContactFormPageData } from "./contactFormData";

export class JSONTransformer implements IJSONTransformer {
  public async Transform(umbracoPageData: any, globalData?: any): Promise<any> {
    const data: any = {
      headerViewModel: globalData?.properties?.headerViewModel || globalData?.headerViewModel || null,
      footerViewModel: globalData?.properties?.footerViewModel || globalData?.footerViewModel || null,
      pageSidebarViewModel: globalData?.properties?.pageSidebarViewModel || globalData?.pageSidebarViewModel || null,
      skipLinkText: globalData?.properties?.skipLinkText || globalData?.skipLinkText || t("common.skipToContent", globalData?.locale),
      componentName: "SiteLayout",
      child: null
    };

    const bodyDataTransformer: IJSONTransformer | null = this.GetTransformer(
      umbracoPageData.contentType,
    );

    if (bodyDataTransformer != null) {
      data.child = await bodyDataTransformer.Transform(umbracoPageData, globalData);
    }

    if (data.child) {
      data.child = await hydrateNestedContactFormPageData(
        data.child,
        globalData?.locale,
        globalData?.startPageData,
      );
    }

    if (data.child?.pageSidebarViewModel) {
      data.pageSidebarViewModel = data.child.pageSidebarViewModel;
      delete data.child.pageSidebarViewModel;
    }

    // Pre-transform RichText HTML once, server-side, so it ships identical
    // to SSR output and the client doesn't re-parse during hydration.
    walkAndTransformRichText(data);

    return data;
  }

  private GetTransformer(umbracoContentType: string): IJSONTransformer | null {
    switch (umbracoContentType) {
      case "startPage":
        return new StartPageTransformer();
      case "aboutPage":
        return new AboutPageTransformer();
      case "categoryPage":
        return new CategoryPageTransformer();
      case "helpDrilldownPage":
        return new HelpDrilldownPageTransformer();
      case "helpLandingPage":
        return new HelpLandingPageTransformer();
      case "helpProcessArticlePage":
        return new HelpProcessArticlePageTransformer();
      case "helpQuestionPage":
        return new HelpQuestionPageTransformer();
      case "helpSearchPage":
        return new HelpSearchPageTransformer();
      case "helpStartPage":
        return new HelpStartPageTransformer();
      case "error404Page":
        return new Error404PageTransformer();
      case "schemaPage":
        return new SchemaPageTransformer();
      case "schemaOverviewPage":
        return new SchemaOverviewPageTransformer();
      case "schemaAttachmentPage":
        return new SchemaAttachmentPageTransformer();
      case "subsidyPage":
        return new SubsidyPageTransformer();
      case "subsidyOverviewPage":
        return new SubsidyOverviewPageTransformer();
      case "searchPage":
        return new SearchPageTransformer();
      case "subCategoryPage":
        return new SubCategoryPageTransformer();
      case "providerPage":
        return new ProviderPageTransformer();
      case "newsArchivePage":
        return new NewsArchivePageTransformer();
      case "operationalMessageArticlePage":
        return new OperationalMessageArticlePageTransformer();
      case "operationalMessageArchivePage":
        return new OperationalMessageArchivePageTransformer();
      case "sectionPage":
        return new SectionPageTransformer();
      case "articlePage":
      case "sectionArticlePage":
      case "newsArticlePage":
        return new HeroArticlePageBaseTransformer();
      case "themePage":
        return new ThemePageTransformer();
      case "contactFormPage":
        return new ContactFormPageTransformer();
      default:
        return null;
    }
  }
}
