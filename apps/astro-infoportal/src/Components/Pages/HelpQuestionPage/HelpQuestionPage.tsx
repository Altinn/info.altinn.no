import {
  Article,
  ArticleHeader,
  Heading,
} from "@altinn/altinn-components";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import "./HelpQuestionPage.scss";

const HelpQuestionPage = ({
  pageName,
  mainBody,
  breadcrumb,
}: any) => {
  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
      <ArticleHeader>
        <Heading size="xl" as="h1">{pageName}</Heading>
      </ArticleHeader>

      {mainBody && <RichTextArea {...mainBody} />}
    </Article>
  );
};

export default HelpQuestionPage;
