import { RichTextArea } from "/App.Components";
import { EGuideStartBlockViewModel } from "/Models/Generated/EGuideStartBlockViewModel";
import "./EGuideStartBlock.scss";
import "../../../styles/legacy-pages.scss";
import { PencilWritingIcon } from '@navikt/aksel-icons';

const EGuideStartBlock = ({
  heading,
  mainBody,
  guideLocation,
  isGuidePage,
  image,
  imageAltText,
  startGuideText
}: EGuideStartBlockViewModel) => {
  return (
    <div className="legacy-page eguide-start-block">
      <div className="a-card a-cardImage mt-4">
        {image?.src && <img src={image.src} alt={imageAltText || ""} />}
        <div className="a-cardImage-text">
          {heading && <h2>{heading}</h2>}
          {mainBody && <RichTextArea {...mainBody} />}
          {guideLocation?.url && (
            isGuidePage ? (
              <a href={guideLocation.url} className="a-linkIcon">
                <PencilWritingIcon aria-hidden="true" />
                <span className="a-linkIcon-text">{startGuideText || "Start guide"}</span>
              </a>
            ) : (
              <a
                href="#"
                className="a-linkIcon"
                data-toggle="altinn-modal"
                data-action="load"
                data-url={`${guideLocation.url}?clear=true`}
                data-target="#modal"
              >
                <PencilWritingIcon aria-hidden="true" />

                <span className="a-linkIcon-text">{startGuideText || "Start guide"}</span>
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default EGuideStartBlock;
