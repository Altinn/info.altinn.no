/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { ImageProps } from "./ImageProps";
import { SearchFormViewModel } from "./SearchFormViewModel";
import { ContentAreaProps } from "./ContentAreaProps";
import { LinkItemViewModel } from "./LinkItemViewModel";

export interface SectionPageViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  pageName?: string;
  heading?: string;
  backgroundImage?: ImageProps;
  backgroundHexColor?: string;
  searchForm?: SearchFormViewModel;
  themePageArea?: ContentAreaProps;
  themePageLinks: LinkItemViewModel[];
  goToLinkText?: string;
  goToLinkLocation?: LinkItemViewModel;
  themeArea?: ContentAreaProps;
  bottomArea?: ContentAreaProps;
}
