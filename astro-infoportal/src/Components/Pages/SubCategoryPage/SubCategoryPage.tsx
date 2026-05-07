import {
  Article,
  ArticleHeader,
  Divider,
  Heading,
  List,
} from "@altinn/altinn-components";
import { ContentArea, RichTextArea } from "/App.Components";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import ProvidersInline from "../../Shared/ProvidersInline/ProvidersInline";
import type { ProviderInlineItem } from "../../Shared/ProvidersInline/ProvidersInline";
import "./SubCategoryPage.scss";
import TimelineBlock from "../../Blocks/TimelineBlock/TimelineBlock";
import { SearchItem } from "/Components/Shared/SearchItem/SearchItem";
import type { SubCategoryPageProps } from "./SubCategoryPage.types";

const SubCategoryPage = ({
  pageName,
  description,
  schemas,
  breadcrumb,
  boxBlocks,
  promoArea,
  timeline,
  timelineHeading,
  accordions,
  accordionsHeading,
}: SubCategoryPageProps) => {
  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
      <ArticleHeader>
        <Heading
          size="xl"
          as="h1"
          style={{
            display: "flex",
            alignItems: "center",
            columnGap: ".5em",
          }}
        >
          {pageName}
        </Heading>
        {description && <RichTextArea {...description} />}
      </ArticleHeader>

      {schemas?.length ? (
        <List size="sm" color="neutral" spacing={0}>
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
                <Divider as="li" key={`div-${id ?? idx}`} />
              </>
            );
          })}
        </List>
      ) : null}

      {timelineHeading && (
        <Heading
          as="h2"
          size="lg"
        >
          {timelineHeading}
        </Heading>
      )}

      {timeline && timeline.length !== 0 && (
        <TimelineBlock timelineItems={timeline} />
      )}

      {boxBlocks && (
        <ContentArea {...boxBlocks} />
      )}

      {accordionsHeading && (
        <Heading as="h2" size="md">
          {accordionsHeading}
        </Heading>
      )}
      {accordions && <ContentArea {...accordions} />}
      {promoArea && <ContentArea {...promoArea} />}
    </Article>
  );
};

export default SubCategoryPage;
