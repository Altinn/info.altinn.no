import {Layout, RootProvider} from '@altinn/altinn-components';
import {useEffect, useState} from 'react';
import * as Components from '../../../App.Components';
import '@altinn/altinn-components/dist/global.css';
import '@digdir/designsystemet-theme';
import '@digdir/designsystemet-css';
import type {SiteLayoutViewModel} from '/Models/Generated/SiteLayoutViewModel';
import useSidebarConfig from '../../Shared/PageSidebar/useSidebarConfig';
import useFooterConfig from '../Footer/useFooterConfig';
import useHeaderConfig from '../Header/useHeaderConfig';
import './SiteLayout.scss';
import {SkipLink} from '@digdir/designsystemet-react';
import BannerBlock from '../../../Components/Blocks/BannerBlock/BannerBlock';

const SiteLayout = ({
  child,
  headerViewModel,
  footerViewModel,
  pageSidebarViewModel,
  skipLinkText,
}: SiteLayoutViewModel) => {
  const Comp = child ? (Components as any)[child.componentName] : null;

  // Only enable GlobalHeader on client side to avoid SSR issues
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const currentLanguage = headerViewModel?.menuLanguageList?.find(
    (l) => l.selected,
  )?.languageName;

  const normalize = (s?: string) =>
    (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const getLanguageCode = (langName?: string): 'nb' | 'nn' | 'en' => {
    const v = normalize(langName);
    if (!v) return 'nb';
    if (
      v === 'nn' ||
      v === 'nnno' ||
      v.startsWith('nn-') ||
      v.includes('nynorsk')
    )
      return 'nn';
    if (v === 'en' || v.startsWith('en-') || v.includes('english')) return 'en';
    if (
      v === 'no' ||
      v === 'nonb' ||
      v.startsWith('no-') ||
      v.includes('norsk') ||
      v.includes('bokmal')
    )
      return 'nb';
    return 'nb';
  };

  const languageCode = getLanguageCode(currentLanguage);

  // Config from hooks
  const {headerProps, color} = useHeaderConfig(
    headerViewModel || ({} as any),
    languageCode,
  );
  const footerProps = useFooterConfig(footerViewModel || ({} as any));
  const sidebarConfig = useSidebarConfig(pageSidebarViewModel);

  // Pages that have their own width constraints and should not be constrained by layout
  const exludedPages = [
    'StartPage',
    'SchemaOverviewPage',
    'SectionPage',
    'ThemePage',
    'SubsidyOverviewPage',
  ];
  const shouldConstrainWidth =
    child && !exludedPages.includes(child.componentName);
  const hasSidebar = !!sidebarConfig;

  const contentColor: 'company' = 'company';

  return (
    <RootProvider languageCode={languageCode}>
      <SkipLink
        className="site-layout__skip-link"
        href="#main-content"
        data-color="person"
        data-size="xs"
      >
        {skipLinkText}
      </SkipLink>
      {headerViewModel?.banner && <BannerBlock {...headerViewModel.banner} />}
      <Layout
        color={color}
        header={headerProps}
        footer={footerProps}
        content={{color: contentColor}}
        useGlobalHeader={isClient && !!headerViewModel}
        {...(sidebarConfig ? {sidebar: sidebarConfig} : {})}
        theme="default"
      >
        {shouldConstrainWidth ? (
          <div
            className={`layout-content-constrained${
              hasSidebar ? ' layout-content-constrained--sidebar' : ''
            }`}
          >
            <Comp {...child} />
          </div>
        ) : (
          child && (
            <div>
              <Comp {...child} />
            </div>
          )
        )}
      </Layout>
    </RootProvider>
  );
};

export default SiteLayout;
