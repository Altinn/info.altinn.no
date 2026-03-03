import { RichTextArea } from "/App.Components";
import { ImageProps } from "/Models/Generated/ImageProps";
import { LinkItemViewModel } from "/Models/Generated/LinkItemViewModel";
import { RichTextAreaProps } from "/Models/Generated/RichTextAreaProps";
import "./AdvisorStartBlock.scss";
import "../../../styles/legacy-pages.scss";
import { PencilWritingIcon } from '@navikt/aksel-icons';


type Props = {
  heading: string;
  mainBody: RichTextAreaProps;
  linkLocation: LinkItemViewModel;
  buttonText?: string;
  image: ImageProps;
  imageAltText?: string;
};

const AdvisorStartBlock = ({
  heading,
  mainBody,
  linkLocation,
  buttonText,
  image,
  imageAltText,
}: Props) => {
  return (
    <div className="legacy-page advisor-start-block">
      <div className="a-card a-cardImage mt-4">
        {image?.src && <img src={image.src} alt={imageAltText || ""} />}
        <div className="a-cardImage-text">
          {heading && <h2>{heading}</h2>}
          {mainBody && <RichTextArea {...mainBody} />}
          {linkLocation?.url && (
            <a href={linkLocation.url} className="a-linkIcon">
              <PencilWritingIcon aria-hidden="true" />
              <span className="a-linkIcon-text">
                {buttonText || "Start advisor"}
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvisorStartBlock;
