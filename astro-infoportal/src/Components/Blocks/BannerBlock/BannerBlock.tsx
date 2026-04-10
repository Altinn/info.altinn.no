import {Badge} from '@altinn/altinn-components';
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

  const handleClose = () => {
    const storageKey = `${localStoragePrefix}-${contentHash}`;
    localStorage.setItem(storageKey, 'true');
    setIsDismissed(true);
  };

  if (!isActive || isDismissed) {
    return null;
  }

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
