import type { GlobalHeaderProps } from "@altinn/altinn-components";
import { useAccountSelector } from "@altinn/altinn-components";
import type { HeaderViewModel } from "/Models/Generated/HeaderViewModel";
import "@altinn/altinn-components/dist/global.css";
import { useEffect, useMemo, useState } from "react";
// import { useSearchSuggestions } from "./hooks/useSearchSuggestions";
import { buildDesktopMenu } from "./builders/menuBuilder";
import {
  buildLanguageProps,
  createLocaleSelectHandler,
} from "./handlers/headerHandlers";
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

// Transformed party type for account selector
interface TransformedParty {
  partyUuid: string;
  name: string;
  organizationNumber?: string;
  dateOfBirth?: string;
  partyId: string; // Changed to match partyUuid
  type: "Person" | "Organization";
  unitType?: string;
  isDeleted: boolean;
  onlyHierarchyElementWithNoAccess: boolean;
  authorizedResources: string[];
  authorizedRoles: string[];
  subunits: TransformedParty[];
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
  }: HeaderViewModel,
  languageCode: "nb" | "nn" | "en" = "nb",
): { headerProps: GlobalHeaderProps; color: "person" | "company" } => {
  // State management for user session data
  const [currentAccountUuid, setCurrentAccountUuid] = useState<string | undefined>(undefined);
  const [selfAccountUuid, setSelfAccountUuid] = useState<string | undefined>(undefined);
  const [authorizedParties, setAuthorizedParties] = useState<AuthorizedPartyData[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [shouldShowDeletedUnits, setShouldShowDeletedUnits] = useState<boolean | undefined>(undefined);

  // Custom hooks
  const { favorites, addFavorite, removeFavorite } = useFavorites();

  // Fetch user data and authorized parties on mount
  useEffect(() => {
    // Only run in browser
    if (!isBrowser) return;

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
      } catch (_error) {
        // Silent fail - user is not logged in or API unavailable
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
    aboutNewAltinnPage
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

  const transformParty = (party: AuthorizedPartyData): TransformedParty => {
    const isPerson = party.type === 1 || party.type === "Person";

    return {
      ...party,
      partyId: party.partyUuid,
      type: isPerson ? "Person" : "Organization",
      dateOfBirth: isPerson ? party.dateOfBirth : undefined,
      organizationNumber: !isPerson ? party.organizationNumber : undefined,
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
    } catch (error) {
      console.error("Error updating show deleted preference:", error);
    }
  };

  const accountSelectorData = useAccountSelector({
    languageCode: languageCode,
    partyListDTO: partyListDTO as any,
    favoriteAccountUuids: favorites,
    currentAccountUuid: currentAccountUuid,
    selfAccountUuid: selfAccountUuid,
    isVirtualized: authorizedParties.length > 20,
    isLoading: false,
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

  const languageProps = buildLanguageProps(menuLanguageList);
  const handleLocaleSelect = createLocaleSelectHandler(menuLanguageList);

  const globalHeaderProps: GlobalHeaderProps = {
    globalMenu: {
      menuLabel: menuText,
      menu: desktopMenu,
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
    desktopMenu,
    globalSearch: {
      // value: searchValue,
      // onChange: setSearchValue,
      // onFocus: () => setIsSearchFocused(true),
      // onBlur: () => setIsSearchFocused(false),
      // suggestions: suggestions,
      onSearch: (query: string) => {
        if (!isBrowser || !searchPageUrl) return;

        const url = new URL(searchPageUrl, location.origin);
        if (query) url.searchParams.set("q", query);
        location.assign(url.toString());
      },
    },
    locale: {
      title: chooseLanguageText,
      options: languageProps.map((l) => ({
        value: l.value,
        label: l.label,
        checked: l.checked,
        onClick: () => handleLocaleSelect(l.value),
      })),
      onSelect: handleLocaleSelect,
    },
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
