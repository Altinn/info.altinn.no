import {
  Article,
  ArticleHeader,
  Heading,
  Section,
  Typography,
} from "@altinn/altinn-components";
import { ContentArea } from "/App.Components";
import { OperationalMessageArchivePageViewModel } from "/Models/Generated/OperationalMessageArchivePageViewModel";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import "./OperationalMessageArchivePage.scss";

const OperationalMessageArchivePage = ({
  pageName,
  breadcrumb,
  articles,
  bottomContentArea,
}: OperationalMessageArchivePageViewModel) => {
  const hasArticles = articles && articles.length > 0;

  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
      <ArticleHeader>
        <Heading size="xl" as="h1">
          {pageName || ""}
        </Heading>
      </ArticleHeader>

      {hasArticles && articles.map((article, index) => (
        <div key={index}>
          <Heading size="lg" as="h2">{article.pageName}</Heading>
          <Typography as="p">
            {article.mainBody}
          </Typography>
        </div>
      ))}

      {bottomContentArea && (
        <Section
          margin="section"
          className="operational-message-archive__bottom"
        >
          <ContentArea {...bottomContentArea} />
        </Section>
      )}
    </Article>
  );
};

export default OperationalMessageArchivePage;
