import {
  Article,
  ArticleHeader,
  Divider,
  List,
  Typography,
} from "@altinn/altinn-components";
import { Fragment } from "react";
import "./ProviderPage.scss";
import { OperationalMessage, ProviderContactInformationBlock } from "/App.Components";
import { SearchItem } from "/Components/Shared/SearchItem/SearchItem";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import ProvidersInline from "../../Shared/ProvidersInline/ProvidersInline";
import type { ProviderInlineItem } from "../../Shared/ProvidersInline/ProvidersInline";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";

const ProviderPage = ({
  mainIntro,
  schemas,
  operationalMessages,
  breadcrumb,
  contactInfo,
}: any) => {
  return (
    <>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}

      {operationalMessages?.filter(Boolean).map((om: any, idx: number) => (
        <OperationalMessage {...om} key={idx} />
      ))}

      <Article>
        <ArticleHeader>
          {contactInfo && <ProviderContactInformationBlock {...contactInfo} />}
        </ArticleHeader>

        <div className="provider-page__content">
          {mainIntro && (
            <Typography as="div">
              <RichTextArea {...mainIntro} />
            </Typography>
          )}

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
                    url: p.url || undefined,
                  }));

                return (
                  <Fragment key={id ?? idx}>
                    <SearchItem
                      className="search-item__item"
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
                    <Divider as="li" />
                  </Fragment>
                );
              })}
            </List>
          ) : null}
        </div>
      </Article>
    </>
  );
};

export default ProviderPage;
