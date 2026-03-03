import {
  Article,
  ArticleHeader,
  Heading,
} from "@altinn/altinn-components";
import { HelpQuestionPageViewModel } from "/Models/Generated/HelpQuestionPageViewModel";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import "./HelpQuestionPage.scss";

const HelpQuestionPage = ({
  pageName,
  mainBody,
  breadcrumb,
}: HelpQuestionPageViewModel) => {
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
