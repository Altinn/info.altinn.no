import {
  Article,
  ArticleHeader,
  Divider,
  Heading,
  List,
  SearchItem,
  Section,
} from "@altinn/altinn-components";
import { Pagination, usePagination } from "@digdir/designsystemet-react";
import { useResponsivePagination } from "/Services/Hooks/UseResponsivePagination";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";

// import ContentArea from "../../Shared/ContentArea/ContentArea";

const isBrowser =
  typeof window !== "undefined" &&
  typeof location !== "undefined" &&
  typeof history !== "undefined";

const NewsArchivePage = ({
  pageName,
  newsArticles,
  totalPages,
  currentPageNumber,
  lastPageText,
  nextPageText,
  // bottomContentArea,
  breadcrumb,
}: any) => {
  const { maxPaginationButtons, isMobile } = useResponsivePagination();
  const showPagination = totalPages > 1;

  const handlePageChange = (_event: any, page: number) => {
    if (!isBrowser) return;

    const searchParams = new URLSearchParams();
    searchParams.set("pagenumber", String(page));
    const next = `${location.pathname}?${searchParams.toString()}`;
    history.pushState({}, "", next);
    location.reload();
  };

  const { pages, prevButtonProps, nextButtonProps } = usePagination({
    currentPage: currentPageNumber,
    totalPages: totalPages,
    showPages:
      totalPages < maxPaginationButtons ? totalPages : maxPaginationButtons,
    onChange: handlePageChange,
  });

  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
      <ArticleHeader>
        <Heading size="xl" as="h1">
          {pageName}
        </Heading>
      </ArticleHeader>

      <Section margin="section">
        <List>
          {newsArticles?.map((article: any, index: number) => (
            <>
              <SearchItem
                key={index}
                as="a"
                href={article.url || "#"}
                title={article.pageName}
                summary={article.mainIntro}
              />
              <Divider as="li" key={`div-${index}`} />
            </>
          ))}
        </List>
      </Section>

      {showPagination && (
        <Pagination>
          <Pagination.List>
            <Pagination.Item>
              <Pagination.Button aria-label={lastPageText} {...prevButtonProps}>
                {!isMobile && lastPageText}
              </Pagination.Button>
            </Pagination.Item>

            {pages.map(({ page, itemKey, buttonProps }) => (
              <Pagination.Item key={itemKey}>
                {typeof page === "number" && (
                  <Pagination.Button
                    {...buttonProps}
                    aria-label={`Side ${page}`}
                  >
                    {page}
                  </Pagination.Button>
                )}
              </Pagination.Item>
            ))}

            <Pagination.Item>
              <Pagination.Button aria-label={nextPageText} {...nextButtonProps}>
                {!isMobile && nextPageText}
              </Pagination.Button>
            </Pagination.Item>
          </Pagination.List>
        </Pagination>
      )}

      {/* {bottomContentArea && <ContentArea {...bottomContentArea} />} */}
    </Article>
  );
};

export default NewsArchivePage;
