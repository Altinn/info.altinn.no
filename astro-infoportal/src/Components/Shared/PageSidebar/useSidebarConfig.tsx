import type {LayoutProps, MenuItemProps} from '@altinn/altinn-components';
import * as AkselIcons from '@navikt/aksel-icons';
import './PageSidebar.scss';

const resolveAkselIcon = (iconName?: string) => {
  if (!iconName) return undefined;
  const IconComponent = (AkselIcons as any)[iconName];
  return IconComponent || undefined;
};

export default function useSidebarConfig(
  vm?: any,
  opts?: {reserveWhenEmpty?: boolean},
): LayoutProps['sidebar'] {
  const items: MenuItemProps[] = [];
  const hasMainItems = !!vm?.mainItems?.length;

  if (vm?.titleItem) {
    const titleIcon = resolveAkselIcon(vm.titleItem.icon);
    items.push({
      id: 'title',
      groupId: 'title-group',
      title: vm.titleItem.label,
      size: 'lg',
      icon: titleIcon
        ? ({
            svgElement: titleIcon,
            style: {'--dsc-icon-background': 'transparent'} as any,
          } as any)
        : undefined,
      href: vm.titleItem.url,
      as: vm.titleItem.url ? 'a' : undefined,
      className: !hasMainItems ? 'sidebar-title-only' : undefined,
    });
  }

  if (vm?.mainItems?.length) {
    vm.mainItems.forEach((mainItem: any, i: number) => {
      items.push({
        id: `main-item-${i}`,
        groupId: 'main-group',
        icon: resolveAkselIcon(mainItem.icon),
        size: 'md',
        label: (
          <span className={mainItem.current ? 'sidebar-current' : ''}>
            {mainItem.label}
          </span>
        ),
        href: mainItem.url || undefined,
        as: mainItem.url ? 'a' : undefined,
      } as MenuItemProps);

      if (mainItem.subItems?.length) {
        mainItem.subItems.forEach((subItem: any, j: number) => {
          items.push({
            id: `sub-item-${i}-${j}`,
            groupId: 'sub-group',
            size: 'sm',
            label: (
              <span className={subItem.current ? 'sidebar-current' : ''}>
                {subItem.label}
              </span>
            ),
            href: subItem.url || undefined,
            as: subItem.url ? 'a' : undefined,
            icon: resolveAkselIcon(subItem.icon),
          } as MenuItemProps);
        });
      }
    });
  }

  if (!items.length && !opts?.reserveWhenEmpty) return undefined;

  return {
    menu: {
      items,
    },
  } as LayoutProps['sidebar'];
}
