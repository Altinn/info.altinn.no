import { Divider, DsLink, Grid, Typography } from "@altinn/altinn-components";
import {
  type ProviderInlineItem,
  ProvidersInline,
} from "../../Shared/ProvidersInline/ProvidersInline";
import "./RelevantSchemasBlock.scss";
import { MenuGridIcon, TrendUpIcon } from "@navikt/aksel-icons";
import { SearchItem } from "/Components/Shared/SearchItem/SearchItem";

const RelevantSchemasBlock = ({
  schemas,
  relevantSchemasHeader,
  schemaOverviewPageUrl,
  showAllSchemasText,
}: any) => {
  return (
    <div className="relevant-schemas-block">
      <Typography
        as="h2"
        size="sm"
        style={{ fontWeight: 400 }}
        className="relevant-schemas-block__heading"
      >
        <TrendUpIcon aria-hidden="true" />
        {relevantSchemasHeader || ""}
      </Typography>
      <Divider />
      {schemas && schemas.length > 0 && (
        <Grid
          as="ul"
          color="neutral"
          cols={2}
          size="lg"
          className="relevant-schemas-block__grid"
        >
          {schemas.map(({ pageName, providerIcons, url, andMoreText }: any, idx: any) => {
            const providerItems: ProviderInlineItem[] = (providerIcons || [])
              .filter(
                (p: any): p is typeof p & { name: string } =>
                  p?.name != null && p.name !== "",
              )
              .map((p: any) => ({
                name: p.name,
                imageUrl: p.imageUrl || "",
                url: (p as any).url || undefined,
              }));

            return (
              <SearchItem
                key={"item-" + idx}
                className="relevant-schemas-block__item"
                as="a"
                href={url || "#"}
                title={pageName || ""}
                summary={
                  providerItems.length ? (
                    <ProvidersInline
                      className="providers-inline--small"
                      providers={providerItems}
                      disableLinks={true}
                      size="xs"
                      strong={false}
                      andMoreText={andMoreText || ""}
                      isStartPage={true}
                    />
                  ) : undefined
                }
              />
            );
          })}
        </Grid>
      )}
      {schemaOverviewPageUrl && (
        <DsLink
          href={schemaOverviewPageUrl || "#"}
          className="relevant-schemas-block__show-more"
        >
          <MenuGridIcon aria-hidden="true" />
          {showAllSchemasText || ""}
        </DsLink>
      )}
    </div>
  );
};

export default RelevantSchemasBlock;
