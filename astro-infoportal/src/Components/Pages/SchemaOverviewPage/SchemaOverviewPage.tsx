import {
  Divider,
  Grid,
  Heading,
  List,
  ListItem,
  ListItemIcon,
  PageBase,
  Section,
} from '@altinn/altinn-components';
import {Tabs} from '@digdir/designsystemet-react';
import * as AkselIcons from '@navikt/aksel-icons';
import {Fragment, useEffect, useState} from 'react';
import type {SchemaOverviewPageViewModel} from '/Models/Generated/SchemaOverviewPageViewModel';
import ProvidersInline, {
  type ProviderInlineItem,
} from '../../Shared/ProvidersInline/ProvidersInline';
import './SchemaOverviewPage.scss';
import {SearchItem} from '/Components/Shared/SearchItem/SearchItem';

const TabsEnum = {
  Category: 'category',
  Provider: 'provider',
} as const;

type TabType = (typeof TabsEnum)[keyof typeof TabsEnum];

const isBrowser =
  typeof location !== 'undefined' &&
  typeof history !== 'undefined' &&
  typeof addEventListener !== 'undefined';

const SchemaOverviewPage = ({
  schemaCategories,
  providerCollections,
  recommendedSchemas,
  providersText,
  servicesText,
  recommendedSchemasHeaderText,
  initialTab,
}: SchemaOverviewPageViewModel) => {
  const defaultTab = (
    initialTab === 'provider' ? TabsEnum.Provider : TabsEnum.Category
  ) as TabType;
  const [tabValue, setTabValue] = useState<TabType>(defaultTab);

  const getIcon = (iconName?: string) => {
    if (!iconName) return AkselIcons.PersonIcon;

    const IconComponent = (AkselIcons as any)[iconName];
    return IconComponent || AkselIcons.PersonIcon;
  };

  useEffect(() => {
    if (!isBrowser) return;

    const syncFromUrl = () => {
      try {
        const params = new URLSearchParams(location.search);
        const category = params.get('category') as TabType | null;
        setTabValue(
          category === TabsEnum.Provider
            ? TabsEnum.Provider
            : TabsEnum.Category,
        );
      } catch {}
    };

    addEventListener('popstate', syncFromUrl);
    return () => removeEventListener('popstate', syncFromUrl);
  }, []);

  const setTabAndUrl = (tab: TabType) => {
    if (!isBrowser) {
      setTabValue(tab);
      return;
    }
    try {
      const url = new URL(location.href);
      url.searchParams.set('category', tab);
      history.pushState({}, '', url.toString());
    } catch {}
    setTabValue(tab);
  };

  return (
    <PageBase
      spacing={6}
      margin="page"
      className="schema-overview"
    >
      <Tabs value={tabValue}>
        <Tabs.List>
          <Tabs.Tab
            className="schema-overview__tab"
            value={TabsEnum.Category}
            onClick={() => setTabAndUrl(TabsEnum.Category)}
          >
            <ListItemIcon
              icon={{theme: 'subtle', svgElement: AkselIcons.MenuGridIcon}}
              size="lg"
            />
            {servicesText}
          </Tabs.Tab>
          <Tabs.Tab
            className="schema-overview__tab"
            value={TabsEnum.Provider}
            onClick={() => setTabAndUrl(TabsEnum.Provider)}
          >
            <ListItemIcon
              icon={{theme: 'subtle', svgElement: AkselIcons.PassportIcon}}
              size="lg"
            />
            {providersText}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={TabsEnum.Category}>
          {schemaCategories && (
            <div className="schema-overview__grid">
              <Grid
                color="company"
                spacing={3}
                cols={3}
              >
                {schemaCategories.map((item, idx) => (
                  <ListItem
                    className="schema-overview__category-item"
                    id={idx.toString()}
                    as="a"
                    href={item.url || '#'}
                    size="lg"
                    key={idx}
                    label={
                      <span className="schema-overview__category-label">
                        {item.category}
                      </span>
                    }
                    variant="subtle"
                    icon={{
                      theme: 'subtle',
                      svgElement: getIcon(item.icon),
                    }}
                  />
                ))}
              </Grid>
            </div>
          )}

          <Section margin="section">
            <Heading size="lg">{recommendedSchemasHeaderText}</Heading>
            {recommendedSchemas?.length ? (
              <List
                size="sm"
                color="neutral"
                spacing={0}
              >
                {recommendedSchemas.map(
                  ({pageName, providerIcons, url}, idx) => {
                    const providerItems: ProviderInlineItem[] = Array.isArray(
                      providerIcons,
                    )
                      ? providerIcons
                          .filter(
                            (p): p is typeof p & {name: string} => !!p?.name,
                          )
                          .map((p) => ({
                            name: p.name,
                            imageUrl: p.imageUrl || '',
                            url:
                              typeof (p as any).url === 'string'
                                ? (p as any).url
                                : undefined,
                          }))
                      : [];
                    const keyBase = idx;
                    return (
                      <Fragment key={keyBase}>
                        <SearchItem
                          className="search-item__item"
                          as="a"
                          href={url || '#'}
                          title={pageName}
                          summary={
                            providerItems.length ? (
                              <ProvidersInline
                                providers={providerItems}
                                disableLinks={true}
                              />
                            ) : undefined
                          }
                        />
                        <Divider as="li" />
                      </Fragment>
                    );
                  },
                )}
              </List>
            ) : null}
          </Section>
        </Tabs.Panel>

        <Tabs.Panel value={TabsEnum.Provider}>
          <Section>
            {providerCollections?.map(({letter, providers}, idx) => {
              const providerList = Array.isArray(providers) ? providers : [];
              return (
                <li key={idx}>
                  <Heading
                    size="md"
                    className="schema-overview__provider-letter"
                  >
                    {letter}
                  </Heading>

                  <List>
                    {providerList.map(({name, url, imageUrl}, i) => {
                      const providerIcon = name
                        ? {
                            name,
                            imageUrl,
                            type: 'company' as const,
                          }
                        : undefined;

                      return (
                        <ListItem
                          className="schema-overview__provider-item"
                          variant="subtle"
                          key={i}
                          label={name}
                          href={url || '#'}
                          as="a"
                          icon={providerIcon}
                        />
                      );
                    })}
                  </List>
                </li>
              );
            })}
          </Section>
        </Tabs.Panel>
      </Tabs>
    </PageBase>
  );
};

export default SchemaOverviewPage;
