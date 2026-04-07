import {
  Article,
  ArticleHeader,
  Heading,
  List,
  ListItem,
  Typography
} from "@altinn/altinn-components";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import "./CategoryPage.scss";
import RichTextArea from "../../Shared/RichTextArea/RichTextArea";

const CategoryPage = ({
  mainIntro,
  pageName,
  breadcrumb,
  subCategories,
}: any) => {
  return (
    <Article>
      {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
      <ArticleHeader>
        <Heading size="xl" as="h1">
          {pageName}
        </Heading>
      </ArticleHeader>
      {mainIntro && <RichTextArea {...mainIntro} />}

      {subCategories?.length ? (
        <List size="sm" color="neutral">
          {subCategories.map(({ heading, schemaCountText, url }: any, idx: any) => (
            <ListItem
              className="category-page__subcategory-item"
              key={idx}
              label={heading}
              variant="subtle"
              as="a"
              href={url}
              linkIcon
              badge={
                schemaCountText ? (
                  <Typography as="span" size="xs">
                    {schemaCountText}
                  </Typography>
                ) : undefined
              }
            />
          ))}
        </List>
      ) : null}

      {/* <ArticleContact
              title="Står du fast?"
              items={[
                { label: "Chat med en veileder" },
                { label: "Ring 75 00 60 00" },
                { label: "Skriv til Altinn" },
              ]}
            >
              <p>Kontaktinformasjon eller hjelpetekst kan legges her.</p>
            </ArticleContact> */}
    </Article>
  );
};

export default CategoryPage;
