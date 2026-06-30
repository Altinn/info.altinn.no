import type { ConsentBannerViewModel } from "@constants/globalData";

export interface SiteLayoutProps {
  headerViewModel?: any;
  footerViewModel?: any;
  pageSidebarViewModel?: any;
  child?: { componentName: string; [key: string]: any };
  skipLinkText?: string;
  consentBanner?: ConsentBannerViewModel | null;
}
