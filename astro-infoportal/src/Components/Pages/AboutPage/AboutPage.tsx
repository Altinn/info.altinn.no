import {
  Article,
  ArticleHeader,
  Divider,
  Heading,
  List,
  SearchItem,
  Section,
} from "@altinn/altinn-components";
import ContentArea from "../../Shared/ContentArea/ContentArea";
import "./AboutPage.scss";

const AboutPage = ({ pageName, linkArea, contactArea }: any) => {
  return (
    <Article>
      <ArticleHeader>
        <Heading size="xl" as="h1">
          {pageName}
        </Heading>
      </ArticleHeader>

      {linkArea && linkArea.length > 0 && (
        <List className="about-page__link-list">
          {linkArea
            .filter((link: any) => !!link?.url)
            .map((link: any, index: number) => (
              <React.Fragment key={link.url || index}>
                <SearchItem
                  as="a"
                  href={link.url || "#"}
                  title={link.text}
                  summary={link.preamble}
                />
                <Divider as="li" />
              </React.Fragment>
            ))}
        </List>
      )}

      {contactArea && (
        <Section margin="section" className="about-page__contact">
          <ContentArea {...contactArea} />
        </Section>
      )}
    </Article>
  );
};

export default AboutPage;
