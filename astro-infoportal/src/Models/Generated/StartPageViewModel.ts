/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { LoginBlockViewModel } from "./LoginBlockViewModel";
import { AlternativeLoginBlockViewModel } from "./AlternativeLoginBlockViewModel";
import { OperationalMessageArticlePageViewModel } from "./OperationalMessageArticlePageViewModel";
import { RelevantSchemasBlockViewModel } from "./RelevantSchemasBlockViewModel";
import { ContentAreaProps } from "./ContentAreaProps";
import { NewsArticleItemViewModel } from "./NewsArticleItemViewModel";
import { CampaignBlockViewModel } from "./CampaignBlockViewModel";

export interface StartPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  isUserLoggedIn: boolean;
  userName?: string;
  welcomeMessageTitle?: string;
  welcomeMessageIngress?: string;
  searchPageUrl?: string;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  searchContentText?: string;
  login?: LoginBlockViewModel;
  alternateLogin?: AlternativeLoginBlockViewModel;
  criticalOperationalMessages: OperationalMessageArticlePageViewModel[];
  operationalMessages: OperationalMessageArticlePageViewModel[];
  relevantSchemas?: RelevantSchemasBlockViewModel;
  companyTitle?: string;
  companyText?: string;
  companyImageUrl?: string;
  companyImageAlt?: string;
  promoBoxArea?: ContentAreaProps;
  linkButtonAreaTitle?: string;
  linkButtonArea?: ContentAreaProps;
  topImageUrl?: string;
  latestNewsHeading?: string;
  newsList: NewsArticleItemViewModel[];
  newsArchiveUrl?: string;
  showArchiveText?: string;
  campaginArea?: CampaignBlockViewModel;
}
