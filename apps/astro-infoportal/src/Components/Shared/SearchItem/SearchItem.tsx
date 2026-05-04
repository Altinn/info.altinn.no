import {
  type AvatarProps,
  Byline,
  type IconProps,
  type ListItemBaseProps,
  type ListItemLinkProps,
} from "@altinn/altinn-components";
import type { ReactNode } from "react";
import "./SearchItem.scss";

export interface SearchCategory {
  name?: string;
  icon?: IconProps;
}

export interface SearchItemProps extends ListItemBaseProps, ListItemLinkProps {
  id?: string;
  title?: ReactNode;
  summary?: ReactNode;
  owner?: AvatarProps;
  category?: SearchCategory;
}

export const SearchItem = ({
  color = "neutral",
  size,
  title,
  summary,
  owner,
  category,
  ...item
}: SearchItemProps) => {
  return (
    <li className={`${item.className || ""}`.trim()}>
      <a href={item.href}>
        {title && <span className="search-item__link">{title}</span>}

        {owner && <Byline avatar={owner}>{owner?.name}</Byline>}
        {summary && summary}
      </a>
    </li>
  );
};
