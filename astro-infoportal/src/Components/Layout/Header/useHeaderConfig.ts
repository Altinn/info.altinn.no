import type {
  GlobalHeaderProps,
  AuthorizedParty as LibAuthorizedParty,
} from "@altinn/altinn-components";
import { useAccountSelector } from "@altinn/altinn-components";
import "@altinn/altinn-components/dist/global.css";
import { isLocale, navigateToLocale } from "@constants/languages";
import type { Locale } from "@i18n/index";
import { useEffect, useMemo, useState } from "react";
// import { useSearchSuggestions } from "./hooks/useSearchSuggestions";
import { buildDesktopMenu } from "./builders/menuBuilder";
import { fetchCurrentUserOnce } from "./hooks/useCurrentUser";
import { useFavorites } from "./hooks/useFavorites";
import { suppressLanguageRedirect } from "./hooks/useLanguagePreference";
import type { MenuPages } from "./types/headerTypes";
import { isBrowser } from "./utils/browserUtils";

// Local UUID guard — can't import from api/altinn/client (it pulls in
// cloudflare:workers, which must not enter the browser bundle). Hardening only.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (value: string): boolean => UUID_RE.test(value);

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
    backButtonText,
    logOutPage,
    aboutNewAltinnPage,
    profilePage,
    loggedInAsText,
    startPage,
    // useSearchSuggestions: useSuggestionsEnabled,
  }: any,
  languageCode: "nb" | "nn" | "en" = "nb",
): { headerProps: GlobalHeaderProps; color: "person" | "company" } => {
  // State management for user session data
  const [currentAccountUuid, setCurrentAccountUuid] = useState<
    string | undefined
  >(undefined);
  const [selfAccountUuid, setSelfAccountUuid] = useState<string | undefined>(
    undefined,
  );
  const [authorizedParties, setAuthorizedParties] = useState<
    AuthorizedPartyData[]
  >([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [shouldShowDeletedUnits, setShouldShowDeletedUnits] = useState<
    boolean | undefined
  >(undefined);
  const [isDataLoading, setIsDataLoading] = useState(isBrowser);

  // Custom hooks
  const {
    favorites,
    isLoading: isFavoritesLoading,
    addFavorite,
    removeFavorite,
  } = useFavorites();

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
        // Current-user fetch is shared with useLanguagePreference (one request).
        const [userData, partiesResponse] = await Promise.all([
          fetchCurrentUserOnce(),
          fetch("/api/users/authorized-parties", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (partiesResponse.ok) {
          const partiesData = await partiesResponse.json();
          setSelfAccountUuid(userData.selfAccountUuid ?? undefined);
          setCurrentAccountUuid(userData.currentAccountUuid ?? undefined);
          setAuthorizedParties(partiesData);

          if (
            userData.showDeletedEntities !== undefined &&
            userData.showDeletedEntities !== null
          ) {
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
  const currentUser = useMemo(
    () => authorizedParties.find((p) => p.partyUuid === currentAccountUuid),
    [authorizedParties, currentAccountUuid],
  );

  const userType = useMemo(() => {
    if (!currentUser) return "person";
    return currentUser.type === 1 || currentUser.type === "Person"
      ? "person"
      : "company";
  }, [currentUser]);

  const accountColor = useMemo(
    () => getAccountColor(currentUser?.type, isLoggedIn),
    [currentUser?.type, isLoggedIn],
  );

  const desktopMenu = useMemo(
    () =>
      buildDesktopMenu(
        pages,
        isLoggedIn,
        loggedInAsText || "",
        currentUser?.name || "",
        userType,
        currentPath,
      ),
    [
      pages,
      isLoggedIn,
      loggedInAsText,
      currentUser?.name,
      userType,
      currentPath,
    ],
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
      ...(party.dateOfBirth && isPerson
        ? { dateOfBirth: party.dateOfBirth }
        : {}),
      ...(party.organizationNumber && !isPerson
        ? { organizationNumber: party.organizationNumber }
        : {}),
      ...(party.unitType ? { unitType: party.unitType } : {}),
      subunits: party.subunits?.map(transformParty) || [],
    };
  };

  const partyListDTO = authorizedParties.map(transformParty);

  // Callback to update show deleted units preference
  const onShowDeletedUnitsChange = async (shouldShowDeleted: boolean) => {
    try {
      const response = await fetch(
        "/api/users/preferences/show-deleted-entities",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(shouldShowDeleted),
        },
      );
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
      if (!isBrowser || !isValidUuid(accountId)) return;
      setCurrentAccountUuid(accountId);
      // Altinn 3 reportee switch via our own Worker route.
      const changeUrl = new URL(
        "/api/users/change-party",
        window.location.origin,
      );
      changeUrl.searchParams.set("partyUuid", accountId);
      changeUrl.searchParams.set("goTo", window.location.href);
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

  const localeSwitcher =
    menuLanguageList && menuLanguageList.length > 0
      ? {
          title: chooseLanguageText || "Språk/language",
          options: menuLanguageList.map(
            (lang: { locale: Locale; languageName: string }) => ({
              id: lang.languageName,
              title: lang.languageName,
              value: lang.locale,
              checked: lang.locale === currentLangCode,
            }),
          ),
          onSelect: async (value: string) => {
            if (!isBrowser || !isLocale(value)) return;
            const locale = value;
            suppressLanguageRedirect();
            // Persist the choice to the profile (logged-in only).
            if (isLoggedIn) {
              try {
                await fetch("/api/users/preferences/language", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ languageCode: locale }),
                });
              } catch {
                // Non-blocking — still navigate.
              }
            }
            navigateToLocale(
              locale,
              menuLanguageList,
              window.location.pathname,
            );
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
      ...(isLoggedIn &&
        logOutPage && {
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
