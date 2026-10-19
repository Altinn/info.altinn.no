const UNUSED_HEADER_FIELDS = [
  "hostBaseUrl",
  "isPreview",
  "suggestionsTitle",
  "useSearchSuggestions",
  "dateOfBirthText",
  "orgNrText",
  "shortcutText",
];
const UNUSED_LANGUAGE_FIELDS = ["languageTeaser", "languageImage"];
const UNUSED_FOOTER_FIELDS = [
  "startAndRunCompany",
  "searchContext",
  "searchPageUrl",
  "searchUrlBody",
];

const omit = <T extends Record<string, any>>(obj: T, keys: string[]) =>
  Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key)),
  ) as T;

export const toSiteLayoutIslandProps = ({
  child: _child,
  componentName: _componentName,
  consentBanner: _consentBanner,
  pageSidebarViewModel: _pageSidebarViewModel,
  headerViewModel,
  footerViewModel,
  ...rest
}: Record<string, any>) => ({
  ...rest,
  ...(headerViewModel !== undefined && {
    headerViewModel: headerViewModel && {
      ...omit(headerViewModel, UNUSED_HEADER_FIELDS),
      ...(Array.isArray(headerViewModel.menuLanguageList) && {
        menuLanguageList: headerViewModel.menuLanguageList.map(
          (language: Record<string, any>) =>
            omit(language, UNUSED_LANGUAGE_FIELDS),
        ),
      }),
    },
  }),
  ...(footerViewModel !== undefined && {
    footerViewModel:
      footerViewModel && omit(footerViewModel, UNUSED_FOOTER_FIELDS),
  }),
});
