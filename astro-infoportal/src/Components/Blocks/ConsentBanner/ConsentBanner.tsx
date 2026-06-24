import { Button, Heading, Paragraph } from "@digdir/designsystemet-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  CONSENT_REOPEN_HASH,
  loadSiteimprove,
  needsPrompt,
  readConsent,
  writeConsent,
} from "/utils/consent";
import type { ConsentBannerViewModel } from "@constants/globalData";
import "./ConsentBanner.scss";

// A trailing inline link after running text; renders only when both the label
// and the target are present (the optional CMS link fields).
const TrailingLink = ({ text, url }: { text?: string; url?: string }) =>
  text && url ? (
    <>
      {" "}
      <a href={url}>{text}</a>
    </>
  ) : null;

const ConsentBanner = ({
  heading,
  bodyText,
  acceptLabel,
  rejectLabel,
  necessaryText,
  changeLinkText,
  changeLinkUrl,
  necessaryLinkText,
  necessaryLinkUrl,
}: ConsentBannerViewModel) => {
  const [visible, setVisible] = useState(false);
  const headingId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  // Set by open() so the focus effect only fires on an explicit reopen
  // (footer / personvern / programmatic), not when the banner first appears.
  const focusOnOpenRef = useRef(false);

  // Client-only: the page is edge-cached per URL, so visibility must never be
  // decided at SSR. Show only when a (re)decision is needed.
  useEffect(() => {
    setVisible(needsPrompt(readConsent()));
  }, []);

  // Reopen hook for the footer link, the personvern-page link/button
  // (href ending in #informasjonskapsler or [data-consent-reopen]), a direct
  // hash visit, and window.altinnConsent.open().
  useEffect(() => {
    const open = () => {
      setVisible(true);
      focusOnOpenRef.current = true; // move focus to the banner once it renders
      // The banner sits at the top of the page, so when it's reopened from the
      // footer (or anywhere below the fold) scroll up to it — otherwise nothing
      // appears to happen.
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Strip the reopen hash so a refresh doesn't re-open the banner for a user
      // who has already made a choice.
      if (window.location.hash === `#${CONSENT_REOPEN_HASH}`) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    };
    const onClick = (event: MouseEvent) => {
      const trigger = (event.target as HTMLElement | null)?.closest(
        `a[href$="#${CONSENT_REOPEN_HASH}"], [data-consent-reopen]`,
      );
      if (trigger) {
        event.preventDefault();
        open();
      }
    };
    document.addEventListener("click", onClick);
    if (window.location.hash === `#${CONSENT_REOPEN_HASH}`) open();
    const win = window as unknown as { altinnConsent?: unknown };
    win.altinnConsent = {
      open,
      get: readConsent,
      // Mirror the banner's accept flow: persist the choice, then let
      // loadSiteimprove() decide (it self-gates on consent), so a programmatic
      // grant takes effect immediately rather than only on the next navigation.
      set: (statistics: boolean) => {
        writeConsent(statistics);
        loadSiteimprove();
      },
    };
    return () => {
      document.removeEventListener("click", onClick);
      delete win.altinnConsent;
    };
  }, []);

  // After an explicit reopen, move focus to the banner so keyboard and
  // screen-reader users land on it (announced via aria-labelledby).
  useEffect(() => {
    if (visible && focusOnOpenRef.current) {
      focusOnOpenRef.current = false;
      sectionRef.current?.focus();
    }
  }, [visible]);

  if (!visible) return null;

  const accept = () => {
    writeConsent(true);
    loadSiteimprove();
    setVisible(false);
  };
  const reject = () => {
    writeConsent(false);
    setVisible(false);
  };

  return (
    <section
      ref={sectionRef}
      className="consent-banner"
      aria-labelledby={headingId}
      tabIndex={-1}
    >
      <div className="consent-banner__content">
        <Heading
          id={headingId}
          level={2}
          className="consent-banner__heading"
        >
          {heading}
        </Heading>
        <Paragraph variant="long" className="consent-banner__body">
          {bodyText}
          <TrailingLink text={changeLinkText} url={changeLinkUrl} />
        </Paragraph>
        <div className="consent-banner__actions">
          <Button variant="primary" type="button" onClick={accept}>
            {acceptLabel}
          </Button>
          <Button variant="primary" type="button" onClick={reject}>
            {rejectLabel}
          </Button>
        </div>
        <Paragraph variant="long" className="consent-banner__necessary">
          {necessaryText}
          <TrailingLink text={necessaryLinkText} url={necessaryLinkUrl} />
        </Paragraph>
      </div>
    </section>
  );
};

export default ConsentBanner;
