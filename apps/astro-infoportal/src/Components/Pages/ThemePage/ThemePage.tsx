import { ContentArea } from "/App.Components";
import BreadcrumbsView from "../../Layout/Breadcrumbs/BreadcrumbsView";
import "../../../styles/legacy-pages.scss";
import "./ThemePage.scss";

const ThemePage = ({
  pageName,
  mainIntro,
  themeGroups,
  bottomContentArea,
  breadcrumb,
}: any) => {
  return (
    <section id="content" className="legacy-page" tabIndex={-1}>
      <div className="container">
        <div className="row">
          <div className="col-sm-12 col-lg-10 offset-lg-1 pb-3">
            <div className="pb-4">
              {breadcrumb && <BreadcrumbsView {...breadcrumb} />}
              <h1 className="a-fontBold a-pageTitle" style={{ fontWeight: 'bold' }}>{pageName}</h1>
              {mainIntro && <p className="a-leadText" id="leadText">{mainIntro}</p>}
            </div>

            {/* Render theme items in content tree order */}
            {themeGroups?.map((group: any, index: number) => {
              // Render articles with linked title
              if (group.type === "article") {
                return (
                  <article key={`article-${index}`} className="a-linkArticle">
                    <h2>
                      <a href={group.url || "#"} className="a-link-title">
                        {group.title}
                      </a>
                    </h2>
                    {group.intro && <p>{group.intro}</p>}

                    {group.childPages && group.childPages.length > 0 && (
                      <div className="a-list-container clearfix mb-5">
                        <ul className="a-list a-list-noIcon a-list-2col">
                          {group.childPages.map((page: any, pageIndex: number) => (
                            <li
                              key={`page-${index}-${pageIndex}`}
                              className="a-dotted a-clickable a-list-hasRowLink"
                            >
                              <a href={page.url || "#"} className="a-list-rowLink">
                                <div className="row">
                                  <div className="col">{page.text}</div>
                                </div>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                );
              }

              // Render containers with plain text title
              if (group.type === "container") {
                return (
                  <div key={`container-${index}`} className="theme-container-group">
                    <h2 className="a-h3">{group.title}</h2>
                    {group.childPages && group.childPages.length > 0 && (
                      <div className="a-list-container clearfix mb-5">
                        <ul className="a-list a-list-noIcon a-list-2col">
                          {group.childPages.map((page: any, pageIndex: number) => (
                            <li
                              key={`container-page-${index}-${pageIndex}`}
                              className="a-dotted a-clickable a-list-hasRowLink"
                            >
                              <a href={page.url} className="a-list-rowLink">
                                <div className="row">
                                  <div className="col">{page.text}</div>
                                </div>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>

        {/* Bottom Content Area with temporary block name labels */}
        {bottomContentArea && (
          <div className="row">
            <div className="col-sm-12">
              <ContentArea {...bottomContentArea} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ThemePage;
