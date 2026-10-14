import {
  Article,
  ArticleHeader,
  Heading,
  Typography,
} from "@altinn/altinn-components";
import AccordionBlock from "../../Blocks/AccordionBlock/AccordionBlock";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";
import HelpPageToc from "./HelpPageToc";
import "./HelpPage.scss";
import { Card } from "@digdir/designsystemet-react";
import ContentArea from "/Components/Shared/ContentArea/ContentArea";

const HelpPage = ({
  pageName,
  leadText,
  sections,
  tableOfContentsLabel,
  breadcrumb,
  helpContentArea
}: any) => {
  console.log({sections})
  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
      <ArticleHeader>
        <Heading size="xl" as="h1">
          {pageName}
        </Heading>
        {leadText && (
          <Typography as="div" className="help-page__lead-text">
            <RichTextArea {...leadText} />
          </Typography>
        )}
      </ArticleHeader>

      <HelpPageToc sections={sections} label={tableOfContentsLabel} />

      {sections?.map((section: any) => (
        <section
          key={section.id}
          id={section.anchorId}
          className="help-page__section"
        >
          <Heading size="lg" as="h2" className="help-page__section-heading">
            {section.heading}
          </Heading>

          {section.leadText && (
            <Typography as="div">
              <RichTextArea {...section.leadText} />
            </Typography>
          )}

          {section.accordions.length > 0 && (
            <Card color="neutral">
              {section.accordions.map((accordion: any, index: number) => (
                <AccordionBlock
                  key={index}
                  heading={accordion.heading}
                  description={accordion.content}
                />
              ))}
            </Card>
          )}
        </section>
      ))}

      {helpContentArea && (
        <ContentArea {...helpContentArea} />
      )}
    </Article>
  );
};

export default HelpPage;
