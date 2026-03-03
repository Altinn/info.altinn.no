/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { ArticlePageHeroBlockViewModel } from "./ArticlePageHeroBlockViewModel";
import { RichTextAreaProps } from "./RichTextAreaProps";
import { TimelineItemBlockViewModel } from "./TimelineItemBlockViewModel";
import { BreadcrumbViewModel } from "./BreadcrumbViewModel";
import { ContentAreaProps } from "./ContentAreaProps";

export interface HeroArticlePageBaseViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  articlePageHero?: ArticlePageHeroBlockViewModel;
  pageName?: string;
  mainIntro?: string;
  mainBody?: RichTextAreaProps;
  timeline: TimelineItemBlockViewModel[];
  breadcrumb: BreadcrumbViewModel;
  lastUpdatedDateText?: string;
  lastUpdatedDateString?: string;
  bottomContentArea?: ContentAreaProps;
  commonBottomArea?: ContentAreaProps;
}
