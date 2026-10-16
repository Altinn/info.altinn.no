import { Card, Link } from "@digdir/designsystemet-react";
import { ArrowDownRightIcon } from "@navikt/aksel-icons";

// Table of contents for HelpPage: one link per section, pointing at the
// section's anchorId (set by HelpPageTransformer).
const HelpPageToc = ({ sections, label }: any) => {
  const linkedSections = sections?.filter((section: any) => section.heading);
  if (!linkedSections?.length) return null;

  return (
    <Card data-color="company" variant="tinted" asChild>
      <nav aria-label={label} className="help-page__toc">
        <ul>
          {linkedSections.map((section: any) => (
            <li key={section.anchorId}>
              <ArrowDownRightIcon aria-hidden="true" />
              <Link href={`#${section.anchorId}`}>{section.heading}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </Card>
  );
};

export default HelpPageToc;
