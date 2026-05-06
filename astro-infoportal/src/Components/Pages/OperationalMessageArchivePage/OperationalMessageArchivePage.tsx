import {
  Article,
  ArticleHeader,
  Divider,
  Heading,
  List,
  MetaTimestamp,
  Section,
  Typography,
} from "@altinn/altinn-components";
import { ContentArea } from "/App.Components";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import "./OperationalMessageArchivePage.scss";

const OperationalMessageArchivePage = ({
  pageName,
  breadcrumb,
  articles,
  bottomContentArea,
}: any) => {
  const hasArticles = articles && articles.length > 0;

  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
      <ArticleHeader>
        <Heading size="xl" as="h1">
          {pageName || ""}
        </Heading>
      </ArticleHeader>

      {hasArticles && (
        <Typography as="div">
          <List>
            {articles.map((article: any, index: number) => (
              <>
                <li key={index}>
                  <Heading size="lg" as="h2" weight="bold">
                    {article.pageName || ""}
                  </Heading>
                  {article.lastChangedDateString && (
                    <div className="operational-message-archive__date">
                      <MetaTimestamp datetime={article.lastChangedDateString}>
                        {article.lastChangedDateFormatted}
                      </MetaTimestamp>
                    </div>
                  )}
                  {article.mainBodyRichText &&
                  article.mainBodyRichText.items &&
                  article.mainBodyRichText.items.length > 0 ? (
                    <div className="operational-message__body">
                      <RichTextArea {...article.mainBodyRichText} />
                    </div>
                  ) : (
                    article.mainBody && (
                      <div className="operational-message__body">
                        {article.mainBody}
                      </div>
                    )
                  )}
                </li>
                <Divider as="li" key={`div-${index}`} />
              </>
            ))}
          </List>
        </Typography>
      )}

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
