/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { IReactProps } from "./IReactProps";
import { IReactComponentProps } from "./IReactComponentProps";
import { BaseReactComponentProps } from "./BaseReactComponentProps";
import { HeaderViewModel } from "./HeaderViewModel";
import { FooterViewModel } from "./FooterViewModel";
import { PageSidebarViewModel } from "./PageSidebarViewModel";

export interface SiteLayoutViewModel extends IReactProps, IReactComponentProps, BaseReactComponentProps {
  headerViewModel?: HeaderViewModel;
  footerViewModel?: FooterViewModel;
  pageSidebarViewModel?: PageSidebarViewModel;
  child?: IReactComponentProps;
  skipLinkText?: string;
}
