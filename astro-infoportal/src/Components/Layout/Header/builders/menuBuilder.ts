/**
 * Builder for menu configuration
 */

import type { MenuProps } from "@altinn/altinn-components";
import { formatDisplayName } from "@altinn/altinn-components";
import {
  Buildings2Icon,
  ChatExclamationmarkIcon,
  GlobeIcon,
  InboxFillIcon,
  InformationSquareIcon,
  MagnifyingGlassIcon,
  MenuGridIcon,
  PadlockLockedFillIcon,
  PersonCircleIcon,
} from "@navikt/aksel-icons";
import type { MenuPages } from "../types/headerTypes";

const isCurrentPage = (currentPath: string, itemUrl?: string): boolean => {
  if (!itemUrl || !currentPath) return false;

  try {
    const url = new URL(itemUrl, window.location.origin);

    if (url.origin !== window.location.origin) {
      return false;
    }

    const itemPath = url.pathname;

    if (currentPath === itemPath) {
      return true;
    }

    if (itemPath !== "/" && currentPath.startsWith(`${itemPath}/`)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

export const buildMenuItems = (pages: MenuPages, isLoggedIn: boolean, currentPath: string) => {
  const items = [];

  if (pages.inboxPage?.url && pages.inboxPage?.text) {
    items.push({
      id: "inbox",
      groupId: "apps",
      title: pages.inboxPage.text,
      href: pages.inboxPage.url,
      icon: { svgElement: InboxFillIcon, theme: "surface" },
      size: "lg" as const,
      badge: { label: "Beta", variant: 'base', color: 'neutral' },
      selected: isCurrentPage(currentPath, pages.inboxPage.url),
    });
  }

  if (pages.accessManagementPage?.url && pages.accessManagementPage?.text) {
    items.push({
      id: "access-management",
      groupId: "apps",
      title: pages.accessManagementPage.text,
      href: pages.accessManagementPage.url,
      icon: { svgElement: PadlockLockedFillIcon, theme: "surface" },
      size: "lg" as const,
      badge: { label: "Beta", variant: 'base', color: 'neutral' },
      selected: isCurrentPage(currentPath, pages.accessManagementPage.url),
    });
  }

  if (pages.schemaOverviewPage?.url && pages.schemaOverviewPage?.text) {
    items.push({
      id: "schemaoverview",
      groupId: "apps",
      title: pages.schemaOverviewPage.text,
      href: pages.schemaOverviewPage.url,
      icon: { svgElement: MenuGridIcon, theme: "surface" },
      size: "lg" as const,
      selected: isCurrentPage(currentPath, pages.schemaOverviewPage.url),
    });
  }

  if (pages.searchPageUrl && pages.searchTextPlaceholder) {
    items.push({
      id: "altinn-search",
      groupId: "apps",
      title: pages.searchTextPlaceholder,
      href: pages.searchPageUrl,
      icon: MagnifyingGlassIcon,
      size: "lg" as const,
      selected: isCurrentPage(currentPath, pages.searchPageUrl),
    });
  }

  if (pages.aboutNewAltinnPage?.url && pages.aboutNewAltinnPage?.text) {
    items.push({
      id: "about-new-altinn",
      groupId: "shortcuts",
      title: pages.aboutNewAltinnPage.text,
      href: pages.aboutNewAltinnPage.url,
      icon: InformationSquareIcon,
      size: "sm" as const,
      selected: isCurrentPage(currentPath, pages.aboutNewAltinnPage.url),
    });
  }

  if (pages.startAndRunCompany?.url && pages.startAndRunCompany?.text) {
    items.push({
      id: "start-company",
      groupId: "shortcuts",
      title: pages.startAndRunCompany.text,
      href: pages.startAndRunCompany.url,
      icon: Buildings2Icon,
      size: "sm" as const,
      selected: isCurrentPage(currentPath, pages.startAndRunCompany.url),
    });
  }

  if (pages.helpPage?.url && pages.helpPage?.text) {
    items.push({
      id: "help",
      groupId: "shortcuts",
      title: pages.helpPage.text,
      href: pages.helpPage.url,
      icon: ChatExclamationmarkIcon,
      size: "sm" as const,
      selected: isCurrentPage(currentPath, pages.helpPage.url),
    });
  }

  // Language switching is handled by the LocaleSwitcher component via the
  // `locale` prop on GlobalHeaderProps — not as regular menu items.

  if (isLoggedIn && pages.profilePage?.url && pages.profilePage?.text) {
    items.push({
      id: "logged-in",
      groupId: "loggedin",
      title: pages.profilePage.text,
      href: pages.profilePage.url,
      icon: PersonCircleIcon,
      size: "sm" as const,
      selected: isCurrentPage(currentPath, pages.profilePage.url),
    });
  }

  return items;
};

export const buildDesktopMenu = (
  pages: MenuPages,
  isLoggedIn: boolean,
  loggedInAsText: string,
  fullName: string,
  type: "person" | "company",
  currentPath: string,
): MenuProps => {
  const menuItems = buildMenuItems(pages, isLoggedIn, currentPath);

  return {
    items: menuItems,
    groups: isLoggedIn
      ? {
        apps: {
          divider: true,
        },
        shortcuts: {
          divider: true,
        },
        loggedin: {
          divider: true,
          title: `${loggedInAsText} ${formatDisplayName({ fullName: fullName, type: type, reverseNameOrder: false })}`,
        },
      }
      : {
        apps: {
          divider: true,
        },
        shortcuts: {
          divider: true,
        }
      },
  } as MenuProps;
};
