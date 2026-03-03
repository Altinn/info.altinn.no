import { ArrowRightIcon } from "@navikt/aksel-icons";
import type { LatestNewsBlockV2ViewModel } from "/Models/Generated/LatestNewsBlockV2ViewModel";
import "../../../styles/legacy-pages.scss";
import "./LatestNewsBlockV2.scss";

const LatestNewsBlockV2 = ({
  heading,
  news,
  archiveLink,
}: LatestNewsBlockV2ViewModel) => {

  return (<div className="legacy-page col-lg-8 offset-lg-2">
    <section className="a-articleList">
      {heading && heading.trim() !== "" && <h2 className="pb-2">{heading || ""}</h2>}

      {news && news.length > 0 && news.map((article, index) => (
        <article
          className="a-linkArticle"
          key={`news-${index}`}
          lang={article.language || undefined}
        >
          <h3>
            <a href={article.url || "#"} className="a-link-title">
              {article.pageName || ""}
            </a>
          </h3>
          <p className="latest-news-intro-truncate">{article.mainIntro || ""}</p>
        </article>
      ))}
      
      {archiveLink && archiveLink.url && archiveLink.text && (
        <a href={archiveLink.url} className="a-linkFeatured a-link-large">
          {archiveLink.text || ""}
          <ArrowRightIcon aria-hidden="true" />
        </a>
      )}
    </section>
  </div>)
};

export default LatestNewsBlockV2;
