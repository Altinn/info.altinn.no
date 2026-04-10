import {
  Article,
  DsHeading,
  DsLink,
  DsParagraph,
  Section,
} from "@altinn/altinn-components";
import { Card } from "@digdir/designsystemet-react";
import { ArrowRightIcon } from "@navikt/aksel-icons";
// import LoginBlock from "../../Blocks/LoginBlock/LoginBlock";
// import AlternativeLoginBlock from "../../Blocks/AlternativeLoginBlock/AlternativeLoginBlock";
import RelevantSchemasBlock from "../../Blocks/RelevantSchemasBlock/RelevantSchemasBlock";
import ContentArea from "../../Shared/ContentArea/ContentArea";
import SearchInput from "../../Shared/SearchInput/SearchInput";
import OperationalMessageArticlePage from "../OperationalMessageArticlePage/OperationalMessageArticlePage";
import "./StartPage.scss";
import CampaignBlock from "../../Blocks/CampaignBlock/CampaignBlock";

const StartPage = ({
  // isUserLoggedIn,
  // userName,
  // welcomeMessageTitle,
  // welcomeMessageIngress,
  searchPageUrl,
  searchPlaceholder,
  searchAriaLabel,
  searchContentText,
  // login,
  // alternateLogin,
  criticalOperationalMessages,
  operationalMessages,
  relevantSchemas,
  companyTitle,
  companyText,
  companyImageUrl,
  // companyImageAlt,
  promoBoxArea,
  linkButtonArea,
  linkButtonAreaTitle,
  latestNewsHeading,
  newsList,
  newsArchiveUrl,
  showArchiveText,
  campaginArea,
  topImageUrl,
}: any) => {
  return (
    <Article>
      <Section className="start-page__content">
        {criticalOperationalMessages &&
          criticalOperationalMessages.length > 0 && (
            <div className="start-page__critical-messages">
              {criticalOperationalMessages.map((message: any, idx: number) => (
                <OperationalMessageArticlePage key={idx} {...message} />
              ))}
            </div>
          )}

        {operationalMessages && operationalMessages.length > 0 && (
          <div className="start-page__messages">
            {operationalMessages.map((message: any, idx: number) => (
              <OperationalMessageArticlePage key={idx} {...message} />
            ))}
          </div>
        )}
        <Section className="start-page__main-section">
          {linkButtonArea &&
            linkButtonArea.items &&
            linkButtonArea.items.length > 0 && (
              <div className="start-page__promo-boxes start-page__promo-boxes--no-bg">
                <div className="start-page__promo-content">
                  <DsHeading level={1} data-size="md">
                    {linkButtonAreaTitle}
                  </DsHeading>
                  <ContentArea {...linkButtonArea} />
                </div>
                <div className="start-page__promo-image">
                  <img src={topImageUrl} alt="" />
                </div>
              </div>
            )}

          {searchPageUrl && (
            <div className="start-page__search">
              <div>
                <DsHeading level={2} data-size="sm" style={{ margin: 0 }}>
                  {searchPlaceholder}
                </DsHeading>
                <DsParagraph data-size="sm">{searchContentText}</DsParagraph>
              </div>
              <SearchInput
                placeholder={searchPlaceholder || ""}
                searchPageUrl={searchPageUrl}
                ariaLabel={searchAriaLabel}
              />
            </div>
          )}

          {relevantSchemas && <RelevantSchemasBlock {...relevantSchemas} />}
          {campaginArea && <CampaignBlock {...campaginArea} />}
        </Section>

        {promoBoxArea && (
          <div className="start-page__promo-boxes">
            <div className="start-page__promo-content">
              {companyTitle && <DsHeading level={2}>{companyTitle}</DsHeading>}
              {companyText && (
                <DsParagraph data-size="sm">{companyText}</DsParagraph>
              )}
              <ul className="start-page__promo-list">
                <ContentArea {...promoBoxArea} />
              </ul>
            </div>
            {companyImageUrl && (
              <div className="start-page__promo-image">
                <img
                  src={companyImageUrl}
                  alt="" 
                />
              </div>
            )}
          </div>
        )}

        {newsList && newsList.length > 0 && (
          <div className="start-page__news">
            {latestNewsHeading && (
              <DsHeading level={2} style={{ marginTop: 0 }}>
                {latestNewsHeading}
              </DsHeading>
            )}
            <div className="start-page__news-grid">
              {newsList.map((article: any, idx: number) => (
                <Card data-color="neutral" key={"news-" + idx} asChild>
                  <a href={article.url || "#"}>
                    <Card.Block>
                      <DsHeading level={3} style={{ fontSize: "1.125rem" }}>
                        {article.pageName}
                      </DsHeading>
                      <DsParagraph data-size="sm">
                        {article.lastChanged}
                      </DsParagraph>
                    </Card.Block>
                  </a>
                </Card>
              ))}
            </div>
            {newsArchiveUrl && showArchiveText && (
              <DsLink href={newsArchiveUrl} style={{ color: "#085d9f" }}>
                <ArrowRightIcon
                  aria-hidden="true"
                  style={{ color: "#085d9f", marginRight: "0.25rem" }}
                />
                {showArchiveText}
              </DsLink>
            )}
          </div>
        )}
      </Section>
    </Article>
  );
};

export default StartPage;
