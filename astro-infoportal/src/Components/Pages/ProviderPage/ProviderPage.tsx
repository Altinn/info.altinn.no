import {
  Article,
  ArticleHeader,
  Divider,
  Heading,
  List,
  ListItemIcon,
} from "@altinn/altinn-components";
import type { AvatarProps } from "@altinn/altinn-components";
import "./ProviderPage.scss";
import { OperationalMessage } from "/App.Components";
import { SearchItem } from "/Components/Shared/SearchItem/SearchItem";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import ProvidersInline from "../../Shared/ProvidersInline/ProvidersInline";
import type { ProviderInlineItem } from "../../Shared/ProvidersInline/ProvidersInline";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";

const ProviderPage = ({
  pageName,
  mainIntro,
  schemas,
  operationalMessages,
  providerIcon,
  breadcrumb,
}: any) => {
  const providerAvatar: AvatarProps | null =
    providerIcon?.name
      ? { name: providerIcon.name, imageUrl: providerIcon.imageUrl || "", type: "company" }
      : null;

  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}

      {operationalMessages?.filter(Boolean).map((om: any, idx: number) => (
        <OperationalMessage {...om} key={idx} />
      ))}



      <ArticleHeader>
        <Heading size="xl" as="h1" className="provider-page-heading">
          {providerAvatar && <ListItemIcon icon={providerAvatar} />}
          {pageName}
        </Heading>
      </ArticleHeader>
      {mainIntro && <RichTextArea {...mainIntro} />}

      {schemas?.length ? (
        <List className="provider-page" size="sm" color="neutral" spacing={0}>
          {schemas.map(({ providers, title, url, id }: any, idx: any) => {
            const providerItems: ProviderInlineItem[] = (providers || [])
              .filter(
                (p: any): p is typeof p & { name: string } =>
                  p?.name != null && p.name !== "",
              )
              .map((p: any) => ({
                name: p.name,
                imageUrl: p.imageUrl || "",
                url: (p as any).url || undefined,
              }));

            return (
              <>
                <SearchItem
                  className="search-item__item"
                  key={id ?? idx}
                  as="a"
                  href={url}
                  title={title}
                  summary={
                    providerItems.length ? (
                      <ProvidersInline
                        providers={providerItems}
                        disableLinks={true}
                      />
                    ) : undefined
                  }
                />
                <Divider as="li" key={`div-${id ?? idx}-div`} />
              </>
            );
          })}
        </List>
      ) : null}
    </Article>
  );
};

export default ProviderPage;
