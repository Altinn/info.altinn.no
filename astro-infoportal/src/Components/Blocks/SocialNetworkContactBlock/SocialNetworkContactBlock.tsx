import { Typography } from "@altinn/altinn-components";
import type { SocialNetworkContactBlockViewModel } from "/Models/Generated/SocialNetworkContactBlockViewModel";

const SocialNetworkContactBlock = ({
  header,
  text,
  facebookLink,
  twitterLink,
  linkedInLink,
}: SocialNetworkContactBlockViewModel) => {
  return (
    <div className="contact-block contact-block--social">
      {header && <Typography as="h3">{header}</Typography>}
      {text && <Typography as="p">{text}</Typography>}
      {(facebookLink || twitterLink || linkedInLink) && (
        <div className="contact-block__social-links">
          {facebookLink && (
            <a
              href={facebookLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              Facebook
            </a>
          )}
          {twitterLink && (
            <a
              href={twitterLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              Twitter
            </a>
          )}
          {linkedInLink && (
            <a
              href={linkedInLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              LinkedIn
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialNetworkContactBlock;
