import {Badge, Banner} from '@altinn/altinn-components';
import {XMarkIcon} from '@navikt/aksel-icons';
import {useEffect, useState} from 'react';
import {RichTextArea} from '/App.Components';
import {IconButton} from '../../Shared/IconButton/IconButton';

import './BannerBlock.scss';

const BannerBlock = ({
  message,
  isActive,
  badgeText,
  colorTheme,
  variant,
  closeButtonText,
  contentHash,
  localStoragePrefix,
}: any) => {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (!localStoragePrefix || !contentHash) return;

    const storageKey = `${localStoragePrefix}-${contentHash}`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(localStoragePrefix) && key !== storageKey) {
        localStorage.removeItem(key);
        i--;
      }
    }

    const dismissed = localStorage.getItem(storageKey);
    if (dismissed !== 'true') {
      setIsDismissed(false);
    }
  }, [contentHash, localStoragePrefix]);

  const handleClose = () => {
    const storageKey = `${localStoragePrefix}-${contentHash}`;
    localStorage.setItem(storageKey, 'true');
    setIsDismissed(true);
  };

  if (!isActive || isDismissed) {
    return null;
  }

  // Global top banner (#571): the altinn-components "Strong Company" banner —
  // dark-navy surface + white text + white info icon, matching the logged-in
  // (AF/Tilgangsstyring) banner. variant="strong" inherits its color from the
  // parent's data-color context, so the wrapper sets data-color="company" to
  // resolve the company navy ("company" is not a valid Banner `color` value).
  // No custom icon — the library renders its native one. `buildBanner` sets
  // variant="strong"; the inline content-block path never sets it.
  if (variant === 'strong') {
    return (
      <div className="banner-block-strong" data-color="company">
        <Banner
          variant="strong"
          sticky={false}
          closeTitle={closeButtonText || 'Close'}
          onClose={handleClose}
          title={
            <>
              {badgeText && (
                <Badge label={badgeText} size="sm" className="altinn-badge" />
              )}
              <RichTextArea {...message} />
            </>
          }
        />
      </div>
    );
  }

  // Inline CMS content block: editor-chosen color (light tinted surface),
  // no leading icon. This is the original BannerBlock rendering.
  const validColors = [
    'accent',
    'success',
    'warning',
    'danger',
    'info',
  ] as const;
  const themeColor = validColors.includes(
    colorTheme as (typeof validColors)[number],
  )
    ? (colorTheme as (typeof validColors)[number])
    : 'accent';

  return (
    <section
      className="banner-block"
      role="status"
      aria-live="polite"
      data-color={themeColor}
    >
      <div className="banner-block__content">
        {badgeText && (
          <Badge
            label={badgeText}
            size="sm"
            className="altinn-badge"
          />
        )}
        {message && <RichTextArea {...message} />}
      </div>
      <IconButton
        icon={XMarkIcon}
        variant="solid"
        onClick={handleClose}
        className="banner-block__close"
        iconAltText={closeButtonText || 'Close'}
        themeColor={themeColor}
      />
    </section>
  );
};

export default BannerBlock;
