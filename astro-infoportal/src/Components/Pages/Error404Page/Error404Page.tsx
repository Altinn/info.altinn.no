import { Heading, Typography } from "@altinn/altinn-components";
import { RichTextArea } from "/App.Components";
import { Error404PageViewModel } from "/Models/Generated/Error404PageViewModel";
import "./Error404Page.scss";

const Error404Page = ({
  pageName,
  subHeading,
  mainBody,
  image,
}: Error404PageViewModel) => {
  return (
    <div className="error404-page">
      <div className="container">
        {subHeading && (
          <div className="row">
            <div className="col-sm-12 col-md-7 col-lg-6 offset-lg-1">
              <Typography>{subHeading}</Typography>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-sm-12 col-md-7 col-lg-6 offset-lg-1">
            <Heading size="xl" as="h1" className="error404-page__title">
              {pageName || ""}
            </Heading>
            {mainBody && <RichTextArea {...mainBody} />}
          </div>

          {image && image.src && (
            <div className="col-sm-12 col-md-5">
              <figure className="error404-page__image">
                <img
                  src={image.src}
                  alt={image.altText || ""}
                  className="error404-page__img"
                />
              </figure>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Error404Page;
