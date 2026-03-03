import {
  Article,
  ArticleHeader,
  Divider,
  Heading,
  List,
} from "@altinn/altinn-components";
import { ContentArea, RichTextArea } from "/App.Components";
import { SubCategoryPageViewModel } from "/Models/Generated/SubCategoryPageViewModel";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import ProvidersInline, {
  ProviderInlineItem,
} from "../../Shared/ProvidersInline/ProvidersInline";
import "./SubCategoryPage.scss";
import TimelineBlock from "../../Blocks/TimelineBlock/TimelineBlock";
import { SearchItem } from "/Components/Shared/SearchItem/SearchItem";

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
}: SubCategoryPageViewModel) => {
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
          {schemas.map(({ providers, title, url, id }, idx) => {
            const providerItems: ProviderInlineItem[] = (providers || [])
              .filter(
                (p): p is typeof p & { name: string } =>
                  p?.name != null && p.name !== "",
              )
              .map((p) => ({
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
          data-size="xs"
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

      {accordions && <ContentArea {...accordions} />}
      {promoArea && <ContentArea {...promoArea} />}
    </Article>
  );
};

export default SubCategoryPage;
