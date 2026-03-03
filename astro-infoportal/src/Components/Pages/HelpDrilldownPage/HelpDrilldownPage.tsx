import {
  Article,
  ArticleHeader,
  Heading,
  List,
  ListItem,
} from "@altinn/altinn-components";
import { HelpDrilldownPageViewModel } from "/Models/Generated/HelpDrilldownPageViewModel";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import ContentArea from "../../Shared/ContentArea/ContentArea";
import "./HelpDrilldownPage.scss";

const HelpDrilldownPage = ({
  pageName,
  // iconUrl,
  // altImage,
  landingPages,
  bottomContentArea,
  breadcrumb,
}: HelpDrilldownPageViewModel) => {
  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
      <ArticleHeader>
        <Heading size="xl" as="h1">
          {pageName}
        </Heading>
        {/* {iconUrl && (
              <img src={iconUrl} alt={altImage || pageName} />
            )} */}
      </ArticleHeader>

      {landingPages && landingPages.length > 0 && (
        <List size="sm" color="neutral">
          {landingPages.map((page, idx) => (
            <ListItem
              key={idx}
              title={page.pageName}
              variant="subtle"
              as="a"
              href={page.url || "#"}
              linkIcon
            />
          ))}
        </List>
      )}

      {bottomContentArea && <ContentArea {...bottomContentArea} />}
    </Article>
  );
};

export default HelpDrilldownPage;
