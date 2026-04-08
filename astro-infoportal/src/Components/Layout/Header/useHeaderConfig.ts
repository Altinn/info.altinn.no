import type {
  AuthorizedParty as LibAuthorizedParty,
  GlobalHeaderProps,
} from "@altinn/altinn-components";
import { useAccountSelector } from "@altinn/altinn-components";
import "@altinn/altinn-components/dist/global.css";
import { useEffect, useMemo, useState } from "react";
// import { useSearchSuggestions } from "./hooks/useSearchSuggestions";
import { buildDesktopMenu } from "./builders/menuBuilder";
import { useFavorites } from "./hooks/useFavorites";
import type { MenuPages } from "./types/headerTypes";
import { isBrowser } from "./utils/browserUtils";

// Determines the visual theme for the header and layout
const getAccountColor = (
  userType: number | string | undefined,
  isLoggedIn: boolean,
): "person" | "company" => {
  if (!isLoggedIn) {
    return "company";
  }

  if (userType === 1 || userType === "Person") {
    return "person";
  }

  return "company";
};

// Type definition for authorized party data from API
interface AuthorizedPartyData {
  partyUuid: string;
  name: string;
  organizationNumber?: string;
  dateOfBirth?: string;
  partyId: number;
  type: number | string;
  unitType?: string;
  isDeleted: boolean;
  onlyHierarchyElementWithNoAccess: boolean;
  authorizedResources: string[];
  authorizedRoles: string[];
  subunits?: AuthorizedPartyData[];
}

const useHeaderConfig = (
  {
    startAndRunCompany,
    helpPage,
    accessManagementPage,
    loginPage,
    inboxPage,
    schemaOverviewPage,
    menuText,
    searchPageUrl,
    searchTextPlaceholder,
    menuLanguageList,
    chooseLanguageText,
    hostBaseUrl,
    backButtonText,
    logOutPage,
    aboutNewAltinnPage,
    profilePage,
    loggedInAsText,
    startPage
    // useSearchSuggestions: useSuggestionsEnabled,
  }: any,
  languageCode: "nb" | "nn" | "en" = "nb",
): { headerProps: GlobalHeaderProps; color: "person" | "company" } => {
  // State management for user session data
  const [currentAccountUuid, setCurrentAccountUuid] = useState<string | undefined>(undefined);
  const [selfAccountUuid, setSelfAccountUuid] = useState<string | undefined>(undefined);
  const [authorizedParties, setAuthorizedParties] = useState<AuthorizedPartyData[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [shouldShowDeletedUnits, setShouldShowDeletedUnits] = useState<boolean | undefined>(undefined);
  const [isDataLoading, setIsDataLoading] = useState(isBrowser);

  // Custom hooks
  const { favorites, isLoading: isFavoritesLoading, addFavorite, removeFavorite } = useFavorites();

  // Fetch user data and authorized parties on mount
  useEffect(() => {
    // Only run in browser
    if (!isBrowser) {
      setIsDataLoading(false);
      return;
    }

    setCurrentPath(window.location.pathname);

    const fetchUserData = async () => {
      try {
        // Fetch both user data and authorized parties in parallel
        const [userResponse, partiesResponse] = await Promise.all([
          fetch("/api/users/current", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/users/authorized-parties", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        // Only update if both requests succeeded
        if (userResponse.ok && partiesResponse.ok) {
          const userData = await userResponse.json();
          const partiesData = await partiesResponse.json();

          // Update state with user session data
          setSelfAccountUuid(userData.selfAccountUuid);
          setCurrentAccountUuid(userData.currentAccountUuid);
          setAuthorizedParties(partiesData);

          // Update show deleted units preference
          if (userData.showDeletedEntities !== undefined) {
            setShouldShowDeletedUnits(userData.showDeletedEntities);
          }
        }
      } catch {
        // Silent fail - user is not logged in or API unavailable
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchUserData();
  }, []); // Empty dependency array - only run once on mount

  // Determine if user is logged in based on presence of authorized parties
  const isLoggedIn = authorizedParties.length > 0;

  // Extract menu pages
  const pages: MenuPages = {
    startAndRunCompany,
    helpPage,
    accessManagementPage,
    loginPage,
    inboxPage,
    schemaOverviewPage,
    profilePage,
    aboutNewAltinnPage,
    searchPageUrl,
    searchTextPlaceholder,
    chooseLanguageText,
    menuLanguageList,
  };

  // Find the main user and build menu - memoized to avoid recalculation
  const currentUser = useMemo(() =>
    authorizedParties.find(p => p.partyUuid === currentAccountUuid),
    [authorizedParties, currentAccountUuid]
  );

  const userType = useMemo(() => {
    if (!currentUser)
      return "person";
    return currentUser.type === 1 || currentUser.type === "Person" ? "person" : "company";
  }, [currentUser]);

  const accountColor = useMemo(
    () => getAccountColor(currentUser?.type, isLoggedIn),
    [currentUser?.type, isLoggedIn],
  );

  const desktopMenu = useMemo(() =>
    buildDesktopMenu(
      pages,
      isLoggedIn,
      loggedInAsText || "",
      currentUser?.name || "",
      userType,
      currentPath,
    ),
    [pages, isLoggedIn, loggedInAsText, currentUser?.name, userType, currentPath]
  );

  const transformParty = (party: AuthorizedPartyData): LibAuthorizedParty => {
    const isPerson = party.type === 1 || party.type === "Person";

    return {
      partyUuid: party.partyUuid,
      name: party.name,
      partyId: party.partyUuid,
      type: isPerson ? "Person" : "Organization",
      isDeleted: party.isDeleted,
      onlyHierarchyElementWithNoAccess: party.onlyHierarchyElementWithNoAccess,
      authorizedResources: party.authorizedResources,
      authorizedRoles: party.authorizedRoles,
      ...(party.dateOfBirth && isPerson ? { dateOfBirth: party.dateOfBirth } : {}),
      ...(party.organizationNumber && !isPerson ? { organizationNumber: party.organizationNumber } : {}),
      ...(party.unitType ? { unitType: party.unitType } : {}),
      subunits: party.subunits?.map(transformParty) || [],
    };
  };

  const partyListDTO = authorizedParties.map(transformParty);

  // Callback to update show deleted units preference
  const onShowDeletedUnitsChange = async (shouldShowDeleted: boolean) => {
    try {
      const response = await fetch("/api/users/preferences/show-deleted-entities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(shouldShowDeleted),
      });
      if (response.ok) {
        const data = await response.json();
        setShouldShowDeletedUnits(data.shouldShowDeletedEntities);
      }
    } catch {
      // Silent fail — preference update is non-critical
    }
  };

  const accountSelectorData = useAccountSelector({
    languageCode: languageCode,
    partyListDTO: partyListDTO,
    favoriteAccountUuids: favorites,
    currentAccountUuid: currentAccountUuid,
    selfAccountUuid: selfAccountUuid,
    virtualized: authorizedParties.length > 20,
    isLoading: isDataLoading || isFavoritesLoading,
    showDeletedUnits: shouldShowDeletedUnits,
    onShowDeletedUnitsChange: onShowDeletedUnitsChange,
    onToggleFavorite: (accountId: string) => {
      if (favorites.includes(accountId)) {
        removeFavorite(accountId);
      } else {
        addFavorite(accountId);
      }
    },
    onSelectAccount: (accountId: string) => {
      setCurrentAccountUuid(accountId);
      const redirectUrl = window.location.href;
      const changeUrl = new URL(
        `${hostBaseUrl}ui/Reportee/ChangeReporteeAndRedirect/`,
      );
      changeUrl.searchParams.set("P", accountId);
      changeUrl.searchParams.set("goTo", redirectUrl);
      (window as Window).open(changeUrl.toString(), "_self");
    },
  });

  // Build locale switcher from menuLanguageList
  // Detect current language from URL path instead of relying on hardcoded 'selected' field
  const detectCurrentLang = () => {
    if (!isBrowser) return languageCode;
    const path = window.location.pathname;
    if (path.startsWith("/nn/")) return "nn";
    if (path.startsWith("/en/")) return "en";
    return "nb";
  };

  const currentLangCode = detectCurrentLang();

  const langCodeMap: Record<string, string> = {
    "Bokmål": "nb",
    "Nynorsk": "nn",
    "English": "en",
  };

  const localeSwitcher = menuLanguageList && menuLanguageList.length > 0
    ? {
        title: chooseLanguageText || "Språk/language",
        options: menuLanguageList.map((lang: any) => {
          const code = lang.languageCode || langCodeMap[lang.languageName] || lang.languageName;
          return {
            id: lang.languageName,
            title: lang.languageName,
            value: code,
            checked: code === currentLangCode,
          };
        }),
        onSelect: (value: string) => {
          if (!isBrowser) return;
          const lang = menuLanguageList.find((l: any) =>
            (l.languageCode || langCodeMap[l.languageName] || l.languageName) === value
          );
          if (!lang) return;

          // Search pages have different slugs per language — handle them explicitly
          const searchSlugMap: Record<string, string> = {
            nb: "/sok/",
            nn: "/nn/sok/",
            en: "/en/search/",
          };
          const searchSlugs = new Set(Object.values(searchSlugMap).flatMap(s => [s, s.replace(/\/$/, "")]));
          const currentPath = window.location.pathname;
          const targetLangCode = value;

          if (searchSlugs.has(currentPath) && searchSlugMap[targetLangCode]) {
            window.location.assign(searchSlugMap[targetLangCode]);
            return;
          }

          // For Umbraco pages, use the CMS-provided pageUrl
          if (lang.pageUrl) {
            window.location.assign(lang.pageUrl);
          }
        },
      }
    : undefined;

  const globalHeaderProps: GlobalHeaderProps = {
    globalMenu: {
      menuLabel: menuText,
      menu: desktopMenu,
      ...(localeSwitcher && { localeSwitcher }),
      ...(isLoggedIn && {
        backLabel: backButtonText,
      }),
      ...(isLoggedIn && logOutPage && {
        logoutButton: {
          label: logOutPage.text || "",
          onClick: () => {
            if (isBrowser && logOutPage.url) {
              location.assign(logOutPage.url);
            }
          },
        },
      }),
    },
    ...(startPage?.url && {
      logo: { href: startPage.url },
    }),
    ...(localeSwitcher && { locale: localeSwitcher }),
    desktopMenu,
    accountSelector: {
      ...accountSelectorData,
      forceOpenFullScreen: false,
    },
    onLoginClick: !isLoggedIn
      ? () => {
        if (isBrowser) location.assign(loginPage?.url ?? "#");
      }
      : undefined,
  };

  return {
    headerProps: globalHeaderProps,
    color: accountColor,
  };
};

export default useHeaderConfig;
