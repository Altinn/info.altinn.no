export interface SectionPageProps {
  componentName?: string;
  pageName?: string;
  heading?: string;
  backgroundHexColor?: string;
  backgroundImage?: { src: string; componentName?: string };
  searchForm?: { componentName?: string; searchLabel?: string; searchPageUrl?: string };
  goToLinkText?: string;
  goToLinkLocation?: { componentName?: string; text?: string; url?: string };
  themePageArea?: any;
  themePageLinks?: { componentName?: string; text?: string; url?: string }[];
  themeArea?: any;
  bottomArea?: any;
}
